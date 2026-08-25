import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb() {
  if (!env.DB) throw new Error('Database binding is unavailable.');
  return drizzle(env.DB, { schema });
}

export function getD1(): D1Database {
  if (!env.DB) throw new Error('Database binding is unavailable.');
  return env.DB;
}

export function getFiles(): R2Bucket {
  if (!env.FILES) throw new Error('Object storage binding is unavailable.');
  return env.FILES;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  schemaReady ??= initializeSchema().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

async function initializeSchema(): Promise<void> {
  const db = getD1();
  const statements = [
    `CREATE TABLE IF NOT EXISTS gallery_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS gallery_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      revision INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS editors (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      object_key TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      added_at INTEGER NOT NULL,
      added_by TEXT NOT NULL,
      position INTEGER NOT NULL,
      deleted_at INTEGER,
      version INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS photo_tags (
      photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (photo_id, tag)
    )`,
    `CREATE TABLE IF NOT EXISTS upload_consents (
      photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      policy_version TEXT NOT NULL,
      confirmed_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_editors_single_owner
      ON editors(role) WHERE role = 'owner'`,
    `CREATE INDEX IF NOT EXISTS idx_photos_active_position
      ON photos(position) WHERE deleted_at IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at)`,
    `CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag, photo_id)`,
    `INSERT OR IGNORE INTO gallery_settings (id, title, subtitle, updated_at)
      VALUES (1, 'Project Gallery', 'A secure, shared log of builds, breakthroughs, and the work between.', 0)`,
    `INSERT OR IGNORE INTO gallery_meta (id, revision) VALUES (1, 0)`,
  ];
  await db.batch(statements.map((statement) => db.prepare(statement)));
  await db.prepare('PRAGMA optimize').run();
}
