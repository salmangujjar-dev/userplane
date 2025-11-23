import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export interface DbConfig {
  databaseUrl: string;
  maxConnections?: number;
  idleTimeout?: number;
}

export function createDb(config: DbConfig) {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: config.maxConnections || 10,
    idleTimeoutMillis: (config.idleTimeout || 20) * 1000,
    connectionTimeoutMillis: 10000,
  });

  return drizzle(pool, { schema });
}

export function getDb(config: DbConfig) {
  if (!dbInstance) {
    dbInstance = createDb(config);
  }
  return dbInstance;
}

export type DbClient = ReturnType<typeof createDb>;
