import { db } from './init.js';

export type StoredVisitor = {
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
  latitude?: number;
  longitude?: number;
  locationPermission?: 'granted' | 'denied' | 'unavailable';
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
};

export type StoredConversation = {
  conversationId: string;
  visitorId?: string;
  status: 'waiting_for_agent' | 'agent_handling' | 'resolved';
  customerSocketId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'agent';
  message: string;
  timestamp: string;
};

const visitorFromRow = (row: any): StoredVisitor => ({
  visitorId: row.visitor_id,
  socketId: row.socket_id ?? undefined,
  status: row.status,
  name: row.name ?? undefined,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  page: row.page,
  userAgent: row.user_agent ?? '',
  language: row.language ?? undefined,
  timezone: row.timezone ?? undefined,
  latitude: row.latitude ?? undefined,
  longitude: row.longitude ?? undefined,
  locationPermission: row.location_permission ?? undefined,
  firstSeenAt: row.first_seen_at,
  lastSeenAt: row.last_seen_at,
  visitCount: row.visit_count,
});

const conversationFromRow = (row: any): StoredConversation => ({
  conversationId: row.conversation_id,
  visitorId: row.visitor_id ?? undefined,
  status: row.status,
  customerSocketId: row.customer_socket_id ?? undefined,
  agentId: row.agent_id ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const messageFromRow = (row: any): StoredMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  senderRole: row.sender_role,
  message: row.message,
  timestamp: row.timestamp,
});

export function getVisitor(visitorId: string): StoredVisitor | undefined {
  const row = db
    .prepare(`
      SELECT *
      FROM visitors
      WHERE visitor_id = ?
    `)
    .get(visitorId);

  return row ? visitorFromRow(row) : undefined;
}

export function listVisitors(): StoredVisitor[] {
  return db
    .prepare(`
      SELECT *
      FROM visitors
      ORDER BY last_seen_at DESC
    `)
    .all()
    .map(visitorFromRow);
}

export function upsertVisitor(visitor: StoredVisitor): void {
  db.prepare(`
    INSERT INTO visitors (
      visitor_id,
      socket_id,
      status,
      name,
      email,
      phone,
      page,
      user_agent,
      language,
      timezone,
      latitude,
      longitude,
      location_permission,
      first_seen_at,
      last_seen_at,
      visit_count
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(visitor_id) DO UPDATE SET
      socket_id = excluded.socket_id,
      status = excluded.status,
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      page = excluded.page,
      user_agent = excluded.user_agent,
      language = excluded.language,
      timezone = excluded.timezone,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      location_permission = excluded.location_permission,
      first_seen_at = excluded.first_seen_at,
      last_seen_at = excluded.last_seen_at,
      visit_count = excluded.visit_count
  `).run(
    visitor.visitorId,
    visitor.socketId ?? null,
    visitor.status,
    visitor.name ?? null,
    visitor.email ?? null,
    visitor.phone ?? null,
    visitor.page,
    visitor.userAgent,
    visitor.language ?? null,
    visitor.timezone ?? null,
    visitor.latitude ?? null,
    visitor.longitude ?? null,
    visitor.locationPermission ?? null,
    visitor.firstSeenAt,
    visitor.lastSeenAt,
    visitor.visitCount,
  );
}

export function setVisitorOffline(
  visitorId: string,
  lastSeenAt: string,
): void {
  db.prepare(`
    UPDATE visitors
    SET
      status = 'offline',
      last_seen_at = ?
    WHERE visitor_id = ?
  `).run(lastSeenAt, visitorId);
}

export function createConversation(
  conversation: StoredConversation,
): void {
  db.prepare(`
    INSERT OR REPLACE INTO conversations (
      conversation_id,
      visitor_id,
      status,
      customer_socket_id,
      agent_id,
      created_at,
      updated_at,
      deleted_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(
    conversation.conversationId,
    conversation.visitorId ?? null,
    conversation.status,
    conversation.customerSocketId ?? null,
    conversation.agentId ?? null,
    conversation.createdAt,
    conversation.updatedAt,
  );
}

export function getConversation(
  conversationId: string,
): StoredConversation | undefined {
  const row = db
    .prepare(`
      SELECT *
      FROM conversations
      WHERE conversation_id = ?
        AND deleted_at IS NULL
    `)
    .get(conversationId);

  return row ? conversationFromRow(row) : undefined;
}

export function listConversations(): StoredConversation[] {
  return db
    .prepare(`
      SELECT *
      FROM conversations
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC
    `)
    .all()
    .map(conversationFromRow);
}

export function updateConversation(
  conversation: StoredConversation,
): void {
  db.prepare(`
    UPDATE conversations
    SET
      visitor_id = ?,
      status = ?,
      customer_socket_id = ?,
      agent_id = ?,
      updated_at = ?
    WHERE conversation_id = ?
      AND deleted_at IS NULL
  `).run(
    conversation.visitorId ?? null,
    conversation.status,
    conversation.customerSocketId ?? null,
    conversation.agentId ?? null,
    conversation.updatedAt,
    conversation.conversationId,
  );
}

export function deleteConversation(
  conversationId: string,
): void {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE conversations
    SET deleted_at = ?
    WHERE conversation_id = ?
      AND deleted_at IS NULL
  `).run(now, conversationId);
}

export function addMessage(message: StoredMessage): void {
  db.prepare(`
    INSERT INTO messages (
      id,
      conversation_id,
      sender_id,
      sender_role,
      message,
      timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    message.id,
    message.conversationId,
    message.senderId,
    message.senderRole,
    message.message,
    message.timestamp,
  );
}

export function getMessages(
  conversationId: string,
): StoredMessage[] {
  return db
    .prepare(`
      SELECT *
      FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
    `)
    .all(conversationId)
    .map(messageFromRow);
}
