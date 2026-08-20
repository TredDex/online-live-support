import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');

mkdirSync(dataDir, { recursive: true });

const databasePath = path.join(dataDir, 'support.db');

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      visitor_id TEXT PRIMARY KEY,
      socket_id TEXT,
      status TEXT NOT NULL DEFAULT 'offline',
      name TEXT,
      email TEXT,
      phone TEXT,
      page TEXT NOT NULL DEFAULT '/',
      user_agent TEXT NOT NULL DEFAULT '',
      language TEXT,
      timezone TEXT,
      latitude REAL,
      longitude REAL,
      location_permission TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      visit_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      conversation_id TEXT PRIMARY KEY,
      visitor_id TEXT,
      status TEXT NOT NULL DEFAULT 'waiting_for_agent',
      customer_socket_id TEXT,
      agent_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (visitor_id)
        REFERENCES visitors(visitor_id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (conversation_id)
        REFERENCES conversations(conversation_id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      visitor_id TEXT PRIMARY KEY,
      browser_enabled INTEGER NOT NULL DEFAULT 1,
      email_enabled INTEGER NOT NULL DEFAULT 1,
      sms_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (visitor_id)
        REFERENCES visitors(visitor_id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      conversation_id TEXT,
      message_id TEXT,
      channel TEXT NOT NULL,
      destination TEXT,
      status TEXT NOT NULL,
      provider TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      sent_at TEXT,
      FOREIGN KEY (visitor_id)
        REFERENCES visitors(visitor_id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS automation_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      event TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      configuration TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_visitors_last_seen
      ON visitors(last_seen_at);

    CREATE INDEX IF NOT EXISTS idx_conversations_visitor
      ON conversations(visitor_id);

    CREATE INDEX IF NOT EXISTS idx_conversations_status
      ON conversations(status);

    CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id);

    CREATE INDEX IF NOT EXISTS idx_notifications_visitor
      ON notification_deliveries(visitor_id);
  `);
}

initializeDatabase();

console.log(`SQLite database ready: ${databasePath}`);
