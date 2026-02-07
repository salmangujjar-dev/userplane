import { createServerLogger, type LogLevel } from '@workspace/logger';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const isDev = process.env.NODE_ENV !== 'production';
const logger = createServerLogger('db-migrate', {
  level: (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info'),
  pretty: isDev,
});

const runMigrations = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  logger.info('Running migrations...');

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('Migrations completed successfully!');
  } catch (error) {
    logger.error({ err: error }, 'Migration failed');
    process.exit(1);
  }

  await pool.end();
};

runMigrations();
