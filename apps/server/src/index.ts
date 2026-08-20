import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = Fastify({
  logger: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../../web/dist');

await app.register(fastifyStatic, {
  root: webDistPath,
  prefix: '/',
});

await app.register(helmet);

await app.register(cors, {
  origin: true,
  credentials: true,
});

type ConversationStatus =
  | 'waiting_for_agent'
  | 'agent_handling'
  | 'resolved';

type Conversation = {
  conversationId: string;
  status: ConversationStatus;
  customerSocketId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'agent';
  message: string;
  timestamp: string;
};

const conversations = new Map<string, Conversation>();
const messages = new Map<string, Message[]>();

app.get('/health', async () => ({
  ok: true,
  service: 'online-live-support-api',
  timestamp: new Date().toISOString(),
}));

app.get('/api/status', async () => ({
  api: 'online',
  socket: 'available',
  service: 'online-live-support',
}));

app.get('/api/conversations', async () => {
  return Array.from(conversations.values());
});

app.get<{ Params: { id: string } }>(
  '/api/conversations/:id',
  async (request, reply) => {
    const conversation = conversations.get(request.params.id);

    if (!conversation) {
      return reply.code(404).send({
        error: 'Conversation not found',
      });
    }

    return conversation;
  },
);

app.get<{ Params: { id: string } }>(
  '/api/conversations/:id/messages',
  async (request) => {
    return messages.get(request.params.id) ?? [];
  },
);

const io = new SocketIOServer(app.server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  app.log.info(`Socket connected: ${socket.id}`);

  socket.on(
    'customer:create',
    (data: { conversationId: string }) => {
      const now = new Date().toISOString();

      const conversation: Conversation = {
        conversationId: data.conversationId,
        status: 'waiting_for_agent',
        customerSocketId: socket.id,
        createdAt: now,
        updatedAt: now,
      };

      conversations.set(data.conversationId, conversation);
      messages.set(data.conversationId, []);

      socket.join(`conversation:${data.conversationId}`);

      io.emit('conversation:incoming', conversation);

      socket.emit('conversation:created', conversation);
    },
  );

  socket.on(
    'agent:join',
    (data: { agentId: string }) => {
      socket.data.agentId = data.agentId;
      socket.data.role = 'agent';

      socket.emit('agent:joined', {
        agentId: data.agentId,
        socketId: socket.id,
        status: 'available',
      });
    },
  );

  socket.on(
    'conversation:accept',
    (data: {
      conversationId: string;
      agentId: string;
    }) => {
      const conversation = conversations.get(data.conversationId);

      if (!conversation) {
        socket.emit('error:message', {
          message: 'Conversation not found.',
        });
        return;
      }

      conversation.status = 'agent_handling';
      conversation.agentId = data.agentId;
      conversation.updatedAt = new Date().toISOString();

      socket.join(`conversation:${data.conversationId}`);

      io.emit('conversation:accepted', {
        conversationId: data.conversationId,
        agentId: data.agentId,
        status: 'agent_handling',
      });
    },
  );

  socket.on(
    'message:send',
    (data: {
      conversationId: string;
      senderId: string;
      senderRole: 'customer' | 'agent';
      message: string;
    }) => {
      const conversation = conversations.get(data.conversationId);

      if (!conversation) {
        socket.emit('error:message', {
          message: 'Conversation not found.',
        });
        return;
      }

      const message: Message = {
        id: crypto.randomUUID(),
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        message: data.message,
        timestamp: new Date().toISOString(),
      };

      const conversationMessages =
        messages.get(data.conversationId) ?? [];

      conversationMessages.push(message);
      messages.set(data.conversationId, conversationMessages);

      io.to(`conversation:${data.conversationId}`).emit(
        'message:received',
        message,
      );
    },
  );

  socket.on(
    'conversation:resolve',
    (data: {
      conversationId: string;
      agentId: string;
    }) => {
      const conversation = conversations.get(data.conversationId);

      if (!conversation) {
        return;
      }

      conversation.status = 'resolved';
      conversation.agentId = data.agentId;
      conversation.updatedAt = new Date().toISOString();

      io.emit('conversation:resolved', {
        conversationId: data.conversationId,
        agentId: data.agentId,
      });
    },
  );

  socket.on('customer:typing', (data) => {
    socket.to(`conversation:${data.conversationId}`).emit(
      'customer:typing',
      data,
    );
  });

  socket.on('agent:typing', (data) => {
    socket.to(`conversation:${data.conversationId}`).emit(
      'agent:typing',
      data,
    );
  });

  socket.on('disconnect', () => {
    app.log.info(`Socket disconnected: ${socket.id}`);
  });
});

app.setNotFoundHandler(async (request, reply) => {
  const pathname = request.url.split('?')[0];

  const isApiRoute =
    pathname.startsWith('/api/') ||
    pathname === '/health';

  const isSocketRoute =
    pathname.startsWith('/socket.io/');

  const isSpaRoute =
    pathname === '/' ||
    pathname === '/agent' ||
    pathname === '/articles' ||
    pathname === '/status';

  if (!isApiRoute && !isSocketRoute && isSpaRoute) {
    return reply.sendFile('index.html');
  }

  return reply.code(404).send({
    error: 'Not Found',
    path: pathname,
  });
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

await app.listen({
  port,
  host,
});

app.log.info(
  `Online Live Support API listening on ${host}:${port}`,
);
