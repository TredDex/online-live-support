import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getGlobalMarket,
  getMarketCoins,
  getTrendingCoins,
  getMarketOverview,
} from './services/market.service.js';

import {
  getVisitor,
  listVisitors,
  upsertVisitor,
  setVisitorOffline,
  createConversation,
  getConversation,
  listConversations,
  updateConversation,
  deleteConversation,
  addMessage,
  getMessages,
} from './db/repository.js';

import './db/init.js';

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
  visitorId?: string;
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

type Visitor = {
  visitorId: string;
  socketId: string;
  status: 'online' | 'offline';
  name?: string;
  email?: string;
  phone?: string;
  page: string;
  userAgent: string;
  language?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  locationPermission?: 'granted' | 'denied' | 'unavailable';
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
};


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
  return listConversations();
});

app.get('/api/markets/global', async (request, reply) => {
  try {
    return await getGlobalMarket();
  } catch (error) {
    request.log.error(error);
    return reply.code(502).send({
      error: 'Market data provider unavailable',
    });
  }
});

app.get('/api/markets/coins', async (request, reply) => {
  try {
    return await getMarketCoins();
  } catch (error) {
    request.log.error(error);
    return reply.code(502).send({
      error: 'Market data provider unavailable',
    });
  }
});

app.get('/api/markets/trending', async (request, reply) => {
  try {
    return await getTrendingCoins();
  } catch (error) {
    request.log.error(error);
    return reply.code(502).send({
      error: 'Market data provider unavailable',
    });
  }
});

app.get('/api/markets/overview', async (request, reply) => {
  try {
    return await getMarketOverview();
  } catch (error) {
    request.log.error(error);
    return reply.code(502).send({
      error: 'Market data provider unavailable',
    });
  }
});

app.get('/api/visitors', async () => {
  return listVisitors();
});

app.get<{ Params: { id: string } }>(
  '/api/visitors/:id',
  async (request, reply) => {
    const visitor = getVisitor(request.params.id);

    if (!visitor) {
      return reply.code(404).send({
        error: 'Visitor not found',
      });
    }

    return visitor;
  },
);

app.get<{ Params: { id: string } }>(
  '/api/visitors/:id/conversations',
  async (request) => {
    return listConversations().filter(
      (conversation) =>
        conversation.visitorId === request.params.id,
    );
  },
);

app.get<{ Params: { id: string } }>(
  '/api/conversations/:id',
  async (request, reply) => {
    const conversation = getConversation(request.params.id);

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
    return getMessages(request.params.id);
  },
);

app.delete<{ Params: { id: string } }>(
  '/api/conversations/:id',
  async (request, reply) => {
    const conversation = getConversation(request.params.id);

    if (!conversation) {
      return reply.code(404).send({
        error: 'Conversation not found',
      });
    }

    deleteConversation(request.params.id);

    io.emit('conversation:deleted', {
      conversationId: request.params.id,
    });

    return {
      ok: true,
      conversationId: request.params.id,
    };
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
    'visitor:identify',
    (data: {
      visitorId?: string;
      page?: string;
      userAgent?: string;
      language?: string;
      timezone?: string;
    }) => {
      const now = new Date().toISOString();
      const existing = data.visitorId
        ? getVisitor(data.visitorId)
        : undefined;

      const visitorId =
        existing?.visitorId ??
        data.visitorId ??
        crypto.randomUUID();

      const visitor: Visitor = {
        visitorId,
        socketId: socket.id,
        status: 'online',
        name: existing?.name,
        email: existing?.email,
        phone: existing?.phone,
        page: data.page ?? '/',
        userAgent: data.userAgent ?? '',
        language: data.language,
        timezone: data.timezone,
        latitude: existing?.latitude,
        longitude: existing?.longitude,
        locationPermission: existing?.locationPermission,
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastSeenAt: now,
        visitCount: (existing?.visitCount ?? 0) + 1,
      };

      upsertVisitor(visitor);

      socket.data.visitorId = visitorId;
      socket.data.role = 'visitor';

      socket.emit('visitor:identified', {
        visitor,
        returning: Boolean(existing),
      });

      io.emit('visitor:online', visitor);
    },
  );

  socket.on(
    'visitor:update',
    (data: {
      visitorId: string;
      page?: string;
      latitude?: number;
      longitude?: number;
      locationPermission?: 'granted' | 'denied' | 'unavailable';
    }) => {
      const visitor = getVisitor(data.visitorId);

      if (!visitor) {
        return;
      }

      visitor.socketId = socket.id;
      visitor.status = 'online';
      visitor.lastSeenAt = new Date().toISOString();

      if (data.page !== undefined) {
        visitor.page = data.page;
      }

      if (
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number'
      ) {
        visitor.latitude = data.latitude;
        visitor.longitude = data.longitude;
      }

      if (data.locationPermission !== undefined) {
        visitor.locationPermission = data.locationPermission;
      }

      upsertVisitor(visitor);

      io.emit('visitor:updated', visitor);
    },
  );

  socket.on(
    'visitor:register',
    (data: {
      visitorId: string;
      name: string;
      email: string;
      phone: string;
    }) => {
      const visitor = getVisitor(data.visitorId);

      if (!visitor) {
        socket.emit('error:visitor', {
          message: 'Visitor session not found.',
        });
        return;
      }

      visitor.name = data.name.trim();
      visitor.email = data.email.trim().toLowerCase();
      visitor.phone = data.phone.trim();
      visitor.lastSeenAt = new Date().toISOString();

      upsertVisitor(visitor);

      socket.emit('visitor:registered', visitor);
      io.emit('visitor:updated', visitor);
    },
  );

  socket.on(
    'customer:create',
    (data: { conversationId: string }) => {
      const now = new Date().toISOString();

      const visitorId = socket.data.visitorId as string | undefined;

      const conversation: Conversation = {
        conversationId: data.conversationId,
        visitorId,
        status: 'waiting_for_agent',
        customerSocketId: socket.id,
        createdAt: now,
        updatedAt: now,
      };

      createConversation(conversation);

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
      const conversation = getConversation(data.conversationId);

      if (!conversation) {
        socket.emit('error:message', {
          message: 'Conversation not found.',
        });
        return;
      }

      conversation.status = 'agent_handling';
      conversation.agentId = data.agentId;
      conversation.updatedAt = new Date().toISOString();

      updateConversation(conversation);

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
      const conversation = getConversation(data.conversationId);

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

      addMessage(message);

      conversation.updatedAt = message.timestamp;
      updateConversation(conversation);

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
      const conversation = getConversation(data.conversationId);

      if (!conversation) {
        return;
      }

      conversation.status = 'resolved';
      conversation.agentId = data.agentId;
      conversation.updatedAt = new Date().toISOString();

      updateConversation(conversation);

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
    const visitorId = socket.data.visitorId as string | undefined;

    if (visitorId) {
      const visitor = getVisitor(visitorId);

      if (visitor) {
        visitor.status = 'offline';
        visitor.lastSeenAt = new Date().toISOString();

        setVisitorOffline(
          visitorId,
          visitor.lastSeenAt,
        );

        io.emit('visitor:offline', visitor);
      }
    }

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
