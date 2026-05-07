import path from 'node:path';

import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd(), true);

const [{ migrate }, { db }] = await Promise.all([
  import('drizzle-orm/libsql/migrator'),
  import('./client'),
]);

await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });

console.log('Migrations applied successfully.');
