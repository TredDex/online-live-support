import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const API_URL =
  import.meta.env.VITE_API_URL || undefined;

type Page =
  | 'home'
  | 'articles'
  | 'status'
  | 'agent';

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'agent';
  message: string;
  timestamp: string;
};

type Conversation = {
  conversationId: string;
  status:
    | 'waiting_for_agent'
    | 'agent_handling'
    | 'resolved';
  customerSocketId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
};

export default function App() {
  const [page, setPage] = useState<Page>(
    window.location.pathname === '/agent'
      ? 'agent'
      : window.location.pathname === '/articles'
        ? 'articles'
        : window.location.pathname === '/status'
          ? 'status'
          : 'home',
  );

  const [socket, setSocket] =
    useState<Socket | null>(null);

  const [apiOnline, setApiOnline] =
    useState(false);

  const [socketOnline, setSocketOnline] =
    useState(false);

  const [conversationId, setConversationId] =
    useState('');

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [messageInput, setMessageInput] =
    useState('');

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [agentId, setAgentId] =
    useState('Agent001');

  const [agentConnected, setAgentConnected] =
    useState(false);

  const [activeConversation, setActiveConversation] =
    useState('');

  useEffect(() => {
    const client = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    setSocket(client);

    fetch(`${API_URL}/api/status`)
      .then((response) => {
        setApiOnline(response.ok);
      })
      .catch(() => {
        setApiOnline(false);
      });

    client.on('connect', () => {
      setSocketOnline(true);
    });

    client.on('disconnect', () => {
      setSocketOnline(false);
    });

    client.on(
      'conversation:incoming',
      (conversation: Conversation) => {
        setConversations((current) => {
          const exists = current.some(
            (item) =>
              item.conversationId ===
              conversation.conversationId,
          );

          return exists
            ? current.map((item) =>
                item.conversationId ===
                conversation.conversationId
                  ? conversation
                  : item,
              )
            : [...current, conversation];
        });
      },
    );

    client.on(
      'message:received',
      (message: Message) => {
        setMessages((current) => [
          ...current,
          message,
        ]);
      },
    );

    return () => {
      client.disconnect();
    };
  }, []);

  const navigate = (next: Page) => {
    const routes: Record<Page, string> = {
      home: '/',
      articles: '/articles',
      status: '/status',
      agent: '/agent',
    };

    window.history.pushState({}, '', routes[next]);
    setPage(next);
    window.scrollTo(0, 0);
  };

  const startChat = () => {
    if (!socket?.connected) {
      alert('Live support is currently disconnected.');
      return;
    }

    const id = crypto.randomUUID();

    setConversationId(id);
    setMessages([]);

    socket.emit('customer:create', {
      conversationId: id,
    });
  };

  const sendMessage = () => {
    const text = messageInput.trim();

    if (!text || !conversationId || !socket) {
      return;
    }

    socket.emit('message:send', {
      conversationId,
      senderId: socket.id,
      senderRole: 'customer',
      message: text,
    });

    setMessageInput('');
  };

  const connectAgent = () => {
    if (!socket?.connected) {
      alert('Socket connection is unavailable.');
      return;
    }

    socket.emit('agent:join', {
      agentId: agentId.trim() || 'Agent001',
    });

    setAgentConnected(true);
  };

  const acceptConversation = (
    id: string,
  ) => {
    if (!socket) return;

    setActiveConversation(id);

    socket.emit('conversation:accept', {
      conversationId: id,
      agentId,
    });
  };

  const sendAgentMessage = () => {
    const text = messageInput.trim();

    if (!text || !activeConversation || !socket) {
      return;
    }

    socket.emit('message:send', {
      conversationId: activeConversation,
      senderId: agentId,
      senderRole: 'agent',
      message: text,
    });

    setMessageInput('');
  };

  return (
    <div className="app">
      <header className="header">
        <button
          className="brand"
          onClick={() => navigate('home')}
        >
          ◈ Online Live Support
        </button>

        <nav>
          <button onClick={() => navigate('home')}>
            Help Center
          </button>

          <button
            onClick={() => navigate('articles')}
          >
            Articles
          </button>

          <button
            onClick={() => navigate('status')}
          >
            System Status
          </button>

          <button
            onClick={() => navigate('agent')}
          >
            Agent Console
          </button>

          <button
            className="primary"
            onClick={startChat}
          >
            Live Chat
          </button>
        </nav>
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="hero">
              <span>ONLINE LIVE SUPPORT</span>
              <h1>How can we help you?</h1>
              <p>
                Get help from our support center or
                connect with a live agent.
              </p>

              <button
                className="primary large"
                onClick={startChat}
              >
                Start Live Chat
              </button>
            </section>

            <section className="cards">
              {[
                'Account & Security',
                'Payments',
                'Trading',
                'Wallet',
                'Identity Verification',
                'Technical Support',
              ].map((item) => (
                <article key={item}>
                  <h3>{item}</h3>
                  <p>
                    Get help with {item.toLowerCase()}
                    .
                  </p>
                </article>
              ))}
            </section>
          </>
        )}

        {page === 'articles' && (
          <section className="page">
            <span>HELP CENTER</span>
            <h1>Support Articles</h1>

            {[
              'I cannot log in to my account',
              'How identity verification works',
              'Withdrawal is pending',
              'How to check a transaction',
              'How to secure your account',
              'How to contact live support',
            ].map((article) => (
              <article className="list-item" key={article}>
                <strong>{article}</strong>
                <span>›</span>
              </article>
            ))}
          </section>
        )}

        {page === 'status' && (
          <section className="page">
            <span>SYSTEM</span>
            <h1>System Status</h1>

            <div className="status">
              <div>
                <strong>Support API</strong>
                <span>
                  {apiOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div>
                <strong>WebSocket</strong>
                <span>
                  {socketOnline
                    ? 'Connected'
                    : 'Disconnected'}
                </span>
              </div>

              <div>
                <strong>Service</strong>
                <span>Online Live Support</span>
              </div>
            </div>
          </section>
        )}

        {page === 'agent' && (
          <section className="page">
            <span>OPERATIONS</span>
            <h1>Agent Console</h1>

            <div className="agent-toolbar">
              <input
                value={agentId}
                onChange={(event) =>
                  setAgentId(event.target.value)
                }
                placeholder="Agent001"
              />

              <button
                className="primary"
                onClick={connectAgent}
              >
                {agentConnected
                  ? 'Agent Connected'
                  : 'Connect Agent'}
              </button>
            </div>

            <div className="agent-layout">
              <aside className="inbox">
                <h2>Conversations</h2>

                {conversations.length === 0 ? (
                  <p>
                    Waiting for customer
                    conversations...
                  </p>
                ) : (
                  conversations.map(
                    (conversation) => (
                      <button
                        className="conversation"
                        key={
                          conversation.conversationId
                        }
                        onClick={() =>
                          acceptConversation(
                            conversation.conversationId,
                          )
                        }
                      >
                        <strong>
                          Customer
                        </strong>
                        <small>
                          {conversation.status}
                        </small>
                      </button>
                    ),
                  )
                )}
              </aside>

              <section className="chat">
                <h2>
                  {activeConversation ||
                    'Select a conversation'}
                </h2>

                <div className="messages">
                  {messages
                    .filter(
                      (message) =>
                        message.conversationId ===
                        activeConversation,
                    )
                    .map((message) => (
                      <div
                        className={`message ${message.senderRole}`}
                        key={message.id}
                      >
                        <strong>
                          {message.senderRole}
                        </strong>
                        <p>{message.message}</p>
                      </div>
                    ))}
                </div>

                <div className="composer">
                  <input
                    value={messageInput}
                    onChange={(event) =>
                      setMessageInput(
                        event.target.value,
                      )
                    }
                    placeholder="Type a response..."
                  />

                  <button
                    className="primary"
                    onClick={
                      page === 'agent'
                        ? sendAgentMessage
                        : sendMessage
                    }
                  >
                    Send
                  </button>
                </div>
              </section>
            </div>
          </section>
        )}
      </main>

      {conversationId && page !== 'agent' && (
        <div className="chat-panel">
          <div className="chat-header">
            <strong>Live Support</strong>
            <button
              onClick={() => setConversationId('')}
            >
              ×
            </button>
          </div>

          <div className="messages">
            {messages
              .filter(
                (message) =>
                  message.conversationId ===
                  conversationId,
              )
              .map((message) => (
                <div
                  className={`message ${message.senderRole}`}
                  key={message.id}
                >
                  <strong>
                    {message.senderRole}
                  </strong>
                  <p>{message.message}</p>
                </div>
              ))}
          </div>

          <div className="composer">
            <input
              value={messageInput}
              onChange={(event) =>
                setMessageInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
            />

            <button
              className="primary"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
