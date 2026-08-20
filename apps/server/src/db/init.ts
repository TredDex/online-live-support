import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'support.db');

export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS visitors (
    visitor_id TEXT PRIMARY KEY,
    socket_id TEXT,
    status TEXT NOT NULL DEFAULT 'offline',
    name TEXT,
    email TEXT,
    phone TEXT,
    page TEXT NOT NULL DEFAULT '/',
    user_agent TEXT,
    language TEXT,
    timezone TEXT,
    latitude REAL,
    longitude REAL,
    location_permission TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    visit_count INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS conversations (
    conversation_id TEXT PRIMARY KEY,
    visitor_id TEXT,
    status TEXT NOT NULL DEFAULT 'waiting_for_agent',
    customer_socket_id TEXT,
    agent_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notification_preferences (
    visitor_id TEXT PRIMARY KEY,
    browser_enabled INTEGER NOT NULL DEFAULT 1,
    email_enabled INTEGER NOT NULL DEFAULT 0,
    sms_enabled INTEGER NOT NULL DEFAULT 0,
    email TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    conversation_id TEXT,
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    sent_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_visitors_last_seen
    ON visitors(last_seen_at);

  CREATE INDEX IF NOT EXISTS idx_conversations_visitor
    ON conversations(visitor_id);

  CREATE INDEX IF NOT EXISTS idx_conversations_updated
    ON conversations(updated_at);

  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, timestamp);

  CREATE INDEX IF NOT EXISTS idx_notifications_visitor
    ON notifications(visitor_id, created_at);
`);

console.log(`SQLite database ready: ${dbPath}`);
