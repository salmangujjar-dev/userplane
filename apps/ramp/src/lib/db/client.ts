import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import { getDatabaseConfig } from './config';
import * as schema from './schema';

function createDb() {
  const client = createClient(getDatabaseConfig());
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> };
export const db = globalForDb.db || createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
