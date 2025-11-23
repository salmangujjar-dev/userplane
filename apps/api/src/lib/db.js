import { createDb } from '@workspace/db';
import { env } from './env';
export const db = createDb({
  databaseUrl: env.database.url,
  maxConnections: 10,
  idleTimeout: 20,
});
