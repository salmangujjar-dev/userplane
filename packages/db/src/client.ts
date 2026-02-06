import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';

import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export interface DbConfig {
  databaseUrl: string;
  maxConnections?: number;
  idleTimeout?: number;
}

/**
 * Build PoolConfig from a database URL, handling the sslrootcert=system case.
 *
 * Render (and some other providers) append `sslrootcert=system` to the
 * connection string. The `pg` driver does not recognise the special value
 * "system" and tries to `fs.readFileSync('system')`, which fails with ENOENT.
 *
 * When we see `sslrootcert=system` we strip it from the URL and set
 * `ssl.rejectUnauthorized = true` so that Node.js uses its built-in CA bundle
 * (equivalent to "system" CA certificates).
 */
function buildPoolConfig(config: DbConfig): PoolConfig {
  const poolConfig: PoolConfig = {
    max: config.maxConnections || 10,
    idleTimeoutMillis: (config.idleTimeout || 20) * 1000,
    connectionTimeoutMillis: 10000,
  };

  try {
    const url = new URL(config.databaseUrl);
    const sslrootcert = url.searchParams.get('sslrootcert');

    if (sslrootcert === 'system') {
      // Remove the param so pg does not try to read a file called "system"
      url.searchParams.delete('sslrootcert');
      poolConfig.connectionString = url.toString();
      // Use Node.js built-in CA bundle (same as OS "system" CAs)
      poolConfig.ssl = { rejectUnauthorized: true };
    } else {
      poolConfig.connectionString = config.databaseUrl;
    }
  } catch {
    // If the URL is not parseable (e.g. socket path), pass it through as-is
    poolConfig.connectionString = config.databaseUrl;
  }

  return poolConfig;
}

export function createDb(config: DbConfig) {
  const pool = new Pool(buildPoolConfig(config));

  return drizzle(pool, { schema });
}

export function getDb(config: DbConfig) {
  if (!dbInstance) {
    dbInstance = createDb(config);
  }
  return dbInstance;
}

export type DbClient = ReturnType<typeof createDb>;
