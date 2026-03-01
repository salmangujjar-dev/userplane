import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

function createDb() {
  const sqlite = new Database(path.join(process.cwd(), 'data', 'ramp.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> };
export const db = globalForDb.db || createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
