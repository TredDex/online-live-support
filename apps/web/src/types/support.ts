export type Message = {
  id: string;
  conversationId?: string;
  senderId?: string;
  senderRole: 'customer' | 'agent';
  message: string;
  timestamp: string;
};

export type Conversation = {
  conversationId: string;
  visitorId?: string;
  status:
    | 'waiting_for_agent'
    | 'agent_handling'
    | 'resolved';
  agentId?: string;
};

export type Visitor = {
  visitorId: string;
  socketId?: string;
  status: 'online' | 'offline';
  name?: string;
  email?: string;
  phone?: string;
  page: string;
  userAgent: string;
  language?: string;
  timezone?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
};
