import MiniChart from './components/MiniChart';

import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

type Page = 'home' | 'chat' | 'articles' | 'markets' | 'status' | 'agent';

type Message = {
  id: string;
  senderRole: 'customer' | 'agent';
  message: string;
  timestamp: string;
};

type Conversation = {
  conversationId: string;
  status: 'waiting_for_agent' | 'agent_handling' | 'resolved';
  agentId?: string;
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

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'chat', label: 'Live Support', icon: '◉' },
  { id: 'articles', label: 'Help Center', icon: '▤' },
  { id: 'markets', label: 'Markets', icon: '↗' },
  { id: 'status', label: 'System Status', icon: '●' },
];

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [dark, setDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );
  const [apiOnline, setApiOnline] = useState(false);
  const [socketOnline, setSocketOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);

const [queue, setQueue] = useState<Conversation[]>([]);
const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);


type MarketCoin = {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image?: string;
};


const [marketCoins, setMarketCoins] = useState<MarketCoin[]>([]);
const [marketUpdated, setMarketUpdated] = useState<string>('');
const [marketLoading, setMarketLoading] = useState(false);
  const [input, setInput] = useState('');
  const [agentInput, setAgentInput] = useState('');
  const [agentMode, setAgentMode] = useState(false);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [agentId] = useState(() => localStorage.getItem('ols-agent-id') || 'Agent001');

  const [visitorId] = useState(() => {
    const existing = localStorage.getItem('ols-visitor-id');
    if (existing) return existing;

    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    localStorage.setItem('ols-visitor-id', id);
    return id;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('ols-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('ols-theme');
    if (saved) setDark(saved === 'dark');
  }, []);


useEffect(() => {
  if (page !== 'markets') return;

  const loadMarkets = async () => {
    try {
      setMarketLoading(true);

      const response = await fetch(
        `${API_URL}/api/market/coins`
      );

      const data = await response.json();

      setMarketCoins(data);

      setMarketUpdated(
        new Date().toLocaleTimeString()
      );

    } catch (error) {
      console.error(
        'Market data error:',
        error
      );
    } finally {
      setMarketLoading(false);
    }
  };


  loadMarkets();

  const timer = setInterval(
    loadMarkets,
    60000
  );


  return () => clearInterval(timer);

}, [page]);


  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => setApiOnline(r.ok))
      .catch(() => setApiOnline(false));

    const s = io(API_URL, { transports: ['websocket', 'polling'], withCredentials: true });
    setSocket(s);

    const identifyVisitor = () => {
      setSocketOnline(true);

      s.emit('visitor:identify', {
        visitorId,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    };

    s.on('connect', identifyVisitor);

    s.on('disconnect', () => {
      setSocketOnline(false);
    });

    s.on('connect_error', () => {
      setSocketOnline(false);
    });

    s.on(
      'visitor:identified',
      (data: { visitor: Visitor; returning: boolean }) => {
        setVisitor(data.visitor);

        localStorage.setItem(
          'ols-visitor-id',
          data.visitor.visitorId,
        );
      },
    );

    s.on('visitor:updated', (updated: Visitor) => {
      if (updated.visitorId === visitorId) {
        setVisitor(updated);
      }
    });
    s.on('message:received', (message: Message) => {
      setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
    });
    s.on('conversation:updated', (c: Conversation) => setConversation(c));
      
s.on('conversation:created', (c: Conversation) => {
  setConversation(c);
  setPage('chat');
});


s.on(
  'conversation:incoming',
  (c: Conversation) => {

    setConversation(c);

    setQueue(prev => {
      const exists = prev.some(
        item => item.conversationId === c.conversationId
      );

      return exists
        ? prev
        : [...prev, c];
    });

  }
);
   s.on(
      'conversation:accepted',
      (data: {
        conversationId: string;
        agentId: string;
        status: 'agent_handling';
      }) => {
        setConversation((current) =>
          current?.conversationId === data.conversationId
            ? {
                ...current,
                status: data.status,
                agentId: data.agentId,
              }
            : current,
        );
      },
    );

    s.on(
      'conversation:resolved',
      (data: {
        conversationId: string;
        agentId: string;
      }) => {
        setConversation((current) =>
          current?.conversationId === data.conversationId
            ? {
                ...current,
                status: 'resolved',
                agentId: data.agentId,
              }
            : current,
        );
      },
    );
    return () => {
      s.disconnect();
    };
  }, [visitorId]);

  useEffect(() => {
    if (!socket?.connected || !visitor) return;

    socket.emit('visitor:update', {
      visitorId: visitor.visitorId,
      page: window.location.pathname,
    });
  }, [page, socket, visitor]);

  const startChat = async () => {
    const id = uid();
    setConversation({ conversationId: id, status: 'waiting_for_agent' });
    setMessages([]);
    setPage('chat');
    socket?.emit('customer:create', { conversationId: id });
    try {
      const r = await fetch(`${API_URL}/api/conversations/${id}/messages`);
      if (r.ok) {
        const old = await r.json();
        if (Array.isArray(old)) setMessages(old);
      }
    } catch {}
  };

  const sendCustomer = () => {
    const text = input.trim();
    if (!text || !conversation || !socket) return;
    const message = {
      id: uid(),
      conversationId: conversation.conversationId,
      senderId: 'customer',
      senderRole: 'customer' as const,
      message: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, message]);
    socket.emit('message:send', {
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderRole: 'customer',
      message: message.message,
    });
    setInput('');
  };

  const joinAgent = () => {
    if (!socket) return;

    socket.emit('agent:join', {
      agentId,
    });

    setAgentMode(true);
  };

  const acceptConversation = () => {
    if (!socket || !conversation) return;

    socket.emit('conversation:accept', {
      conversationId: conversation.conversationId,
      agentId,
    });

    setAgentMode(true);
  };

  const resolveConversation = () => {
    if (!socket || !conversation) return;

    socket.emit('conversation:resolve', {
      conversationId: conversation.conversationId,
      agentId,
    });
  };

  const sendAgent = () => {
    const text = agentInput.trim();
    if (!text || !conversation || !socket) return;
    const message = {
      id: uid(),
      conversationId: conversation.conversationId,
      senderId: agentId,
      senderRole: 'agent' as const,
      message: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, message]);
    socket.emit('message:send', {
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderRole: 'agent',
      message: message.message,
    });
    setAgentInput('');
  };

const marketCards = marketCoins.map((coin) => ({
  id: coin.id,
  name: coin.name,
  symbol: coin.symbol.toUpperCase(),
  icon: coin.image,
  price: `$${coin.current_price.toLocaleString()}`,
  change: `${(
    coin.price_change_percentage_24h ?? 0
  ).toFixed(2)}%`,
}));


  const title = page === 'agent' ? 'Agent Console' :
    page === 'chat' ? 'Live Support' :
    page === 'articles' ? 'Help Center' :
    page === 'markets' ? 'Markets' :
    page === 'status' ? 'System Status' : 'Customer Support';

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage('home')} aria-label="Online Live Support home">
          <span className="brand-mark">✦</span>
          <span><b>Online Live</b><small>Support</small></span>
        </button>
        <div className="top-actions">
          <span className={`connection ${apiOnline && socketOnline ? 'online' : ''}`}>
            <i /> {apiOnline && socketOnline ? 'Online' : 'Connecting'}
          </span>
          <button className="icon-btn" onClick={() => setDark(v => !v)} title="Switch light/dark mode" aria-label="Switch theme">
            {dark ? '☀' : '☾'}
          </button>
          <button className="agent-pill" onClick={() => { setAgentMode(true); setPage('agent'); }}>
            <span className="avatar">A</span> Agent
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="workspace">
            <span className="workspace-dot" /> Customer Portal
          </div>
          <nav>
            {navItems.map(item => (
              <button key={item.id} className={page === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setPage(item.id)}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-card">
            <b>Need help?</b>
            <p>Talk to a real support agent in real time.</p>
            <button className="primary small" onClick={startChat}>Start chat</button>
          </div>
          <button className="nav-item" onClick={() => setPage('status')}><span>⚙</span> Settings & Status</button>
        </aside>

        <main className="content">
          <div className="mobile-nav">
            {navItems.slice(0, 5).map(item => <button key={item.id} onClick={() => setPage(item.id)} className={page === item.id ? 'active' : ''}>{item.icon}<small>{item.label}</small></button>)}
          </div>

          <div className="page-heading">
            <div><span className="eyebrow">ONLINE LIVE SUPPORT</span><h1>{title}</h1></div>
            <button className="theme-switch" onClick={() => setDark(v => !v)}>{dark ? 'Dark mode' : 'Light mode'} <span>{dark ? '☀' : '☾'}</span></button>
          </div>

          {page === 'home' && (
            <section className="hero-grid">
              <div className="hero-panel">
                <span className="badge">● Support is online</span>
                <h2>How can we <em>help</em> today?</h2>
                <p>Get fast answers from our AI assistant or connect with a human agent when you need personal support.</p>
                <div className="hero-actions">
                  <button className="primary" onClick={startChat}>Start live chat <span>→</span></button>
                  <button className="secondary" onClick={() => setPage('articles')}>Browse help center</button>
                </div>
                <div className="trust-row"><span>✓ Secure</span><span>✓ Real-time</span><span>✓ AI-assisted</span></div>
              </div>
              <div className="support-card">
                <div className="support-art"><span>✦</span><span>◌</span><span>↗</span></div>
                <h3>Live agent support</h3>
                <p>Average response time <b>under 2 minutes</b>.</p>
                <button onClick={startChat} className="card-link">Talk to an agent →</button>
              </div>
            </section>
          )}

          {page === 'chat' && (
            <section className="chat-layout">
              <div className="chat-panel">
                <div className="chat-head"><div><span className="status-dot" /> <b>Online Live Support</b><small>Typically replies in under 2 minutes</small></div><button onClick={() => setPage('home')}>×</button></div>
                <div className="messages">
                  {messages.length === 0 && <div className="welcome"><div className="big-icon">✦</div><h2>Hi there 👋</h2><p>Tell us what you need help with. An agent will join shortly.</p><div className="quick-actions"><button onClick={() => setInput('I need help with my account')}>Account help</button><button onClick={() => setInput('I need help with a payment')}>Payment help</button><button onClick={() => setInput('I have a technical issue')}>Technical issue</button></div></div>}
                  {messages.map(m => <div key={m.id} className={`bubble-row ${m.senderRole}`}><div className="bubble"><span>{m.message}</span><small>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div></div>)}
                </div>
                <div className="composer"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCustomer()} placeholder="Write a message..." /><button onClick={sendCustomer} aria-label="Send message">➤</button></div>
                <div className="composer-note">Powered by Online Live Support • Never share passwords or private keys.</div>
              </div>
              <aside className="chat-info"><h3>Conversation</h3><div className="info-row"><span>Status</span><b>{conversation?.status === 'agent_handling' ? 'Agent handling' : 'Waiting for agent'}</b></div><div className="info-row"><span>Connection</span><b className={socketOnline ? 'good' : ''}>{socketOnline ? 'Real-time' : 'Offline'}</b></div><hr /><p>🔒 Your conversation uses the secure application connection. Support will never ask for seed phrases or private keys.</p></aside>
            </section>
          )}

          {page === 'articles' && <section className="cards-section"><div className="search-box">⌕ <input placeholder="Search help articles..." /></div><div className="article-grid">{['Getting started with Online Live Support','How live chat works','Account and profile','Payments and billing','Security best practices','Wallet and crypto safety'].map((x,i) => <button className="article-card" key={x}><span className="article-icon">{['✦','◉','◎','◫','⌁','◇'][i]}</span><div><h3>{x}</h3><p>Learn the essentials and find quick answers.</p><span>Read article →</span></div></button>)}</div></section>}
           
          {page === 'markets' && (
  <section className="cards-section">

    <div className="section-title">

      <div>
        <h2>Live Market Overview</h2>
        <p>
          Real-time cryptocurrency prices powered by CoinGecko API v3.
        </p>
      </div>

      <div>
        <span className="badge">
          ● Live Market Data
        </span>

        <div className="market-status">
          {marketLoading
            ? "Updating prices..."
            : `Last updated ${marketUpdated}`
          }
        </div>
      </div>

    </div>


    <div className="market-grid">

      {marketCards.length === 0 && (
        <div className="notice">
          Loading live market data...
        </div>
      )}


      {marketCards.map((coin) => (

        <div className="market-card" key={coin.symbol}>

          <div className="coin-info">

            {coin.icon ? (
              <img
                className="coin-icon"
                src={coin.icon}
                alt={`${coin.name} logo`}
              />
            ) : (
              <span className="coin">
                {coin.symbol[0]}
              </span>
            )}

            <div>
              <b>{coin.name}</b>
              <small>{coin.symbol}</small>
            </div>

          </div>


          <strong>
            {coin.price}
          </strong>


          <span
            className={
              Number(
                coin.change.replace('%', '')
              ) >= 0
                ? "positive"
                : "negative"
            }
          >
            {coin.change}
          </span>


          <MiniChart
            positive={
              Number(
                coin.change.replace('%', '')
              ) >= 0
            }
          />

        </div>

      ))}

    </div>


    <div className="notice">
      Market data supplied through the server-side CoinGecko v3 integration.
      API keys remain protected on the backend.
    </div>


  </section>
)}
         


{page === 'status' && (
  <section className="status-grid">

    <div className="status-main">

      <div className="status-banner">
        <span>●</span>

        <div>
          <h2>All systems operational</h2>
          <p>
            Online Live Support services are responding normally.
          </p>
        </div>

      </div>


      {[
        ['REST API', apiOnline],
        ['Socket.IO', socketOnline],
        ['Customer Portal', true],
        ['Agent Console', true],
      ].map(([name, ok]) => (

        <div
          className="status-row"
          key={String(name)}
        >

          <span className="status-dot" />

          <div>
            <b>{name}</b>

            <small>
              {ok ? 'Operational' : 'Checking connection'}
            </small>

          </div>

          <strong>
            {ok ? 'Operational' : 'Degraded'}
          </strong>

        </div>

      ))}

    </div>


    <div className="system-card">

      <h3>
        Connection details
      </h3>


      <p>
        <b>API</b>
        <br />
        {API_URL}
      </p>


      <p>
        <b>Theme</b>
        <br />
        {dark ? 'Dark mode' : 'Light mode'}
      </p>


      <button
        className="secondary"
        onClick={() => setDark(v => !v)}
      >
        Switch theme
      </button>


    </div>


  </section>
)}





{page === 'agent' && (
  <section className="agent-layout">

    <div className="agent-header">

      <div>
        <span className="badge">
          ● Agent console
        </span>

        <h2>
          Welcome, {agentId}
        </h2>

        <p>
          Manage customer conversations in real time.
        </p>

      </div>


      <button
        className="primary"
        onClick={() => {
          setAgentMode(false);
          setPage('home');
        }}
      >
        Customer portal
      </button>

    </div>


    <div className="agent-grid">

      <div className="queue-card">

        <h3>
          Conversation queue
        </h3>


        <div className="queue-empty">

          {queue.length === 0 ? (

            <>
              <span className="big-icon">
                ◌
              </span>

              <b>
                No active conversations
              </b>

              <p>
                New customer chats will appear here.
              </p>
            </>

          ) : (

            queue.map((item) => (

              <button
                key={item.conversationId}
                className="queue-item"
                onClick={() => {
                  setConversation(item);
                  setPage('chat');
                }}
              >

                <span className="avatar">
                  C
                </span>


                <div>
                  <b>
                    Customer conversation
                  </b>

                  <small>
                    {item.status}
                  </small>
                </div>


                <span>
                  →
                </span>

              </button>

            ))

          )}

        </div>

      </div>


      <div className="agent-chat">

        <div className="chat-head">
          <b>
            Agent workspace
          </b>

          <span>
            {agentMode
              ? 'Available'
              : 'Viewing'}
          </span>
        </div>


        <div className="messages">

          {messages.map((m) => (

            <div
              key={m.id}
              className={`bubble-row ${m.senderRole}`}
            >

              <div className="bubble">
                <span>
                  {m.message}
                </span>
              </div>

            </div>

          ))}

        </div>


        <div className="composer">

          <input
            value={agentInput}
            onChange={(e) =>
              setAgentInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === 'Enter' && sendAgent()
            }
            placeholder="Reply as agent..."
          />


          <button onClick={sendAgent}>
            ➤
          </button>

        </div>


      </div>

    </div>

  </section>
)}

      </main>
    </div>
  </div>
);
}

