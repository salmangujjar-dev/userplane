import { createDb, type DbClient } from '@workspace/db';
import { env } from '@/api/env';

export const db: DbClient = createDb({
  databaseUrl: env.database.url,
  maxConnections: 10,
  idleTimeout: 20,
});

export type Db = typeof db;
