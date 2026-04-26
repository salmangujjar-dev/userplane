import path from 'node:path';

import type { Config } from '@libsql/client';

export function getLocalDatabasePath() {
  return path.join(process.cwd(), 'data', 'ramp.db');
}

export function getDatabaseUrl() {
  return process.env.TURSO_DATABASE_URL ?? `file:${getLocalDatabasePath()}`;
}

export function isRemoteDatabaseUrl(url: string) {
  return /^(libsql|https?|wss?):\/\//.test(url);
}

export function getDatabaseConfig(): Config {
  const url = getDatabaseUrl();
  const isRemote = isRemoteDatabaseUrl(url);
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (isRemote && !authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL points to Turso.');
  }

  return {
    url,
    ...(authToken ? { authToken } : {}),
  };
}
