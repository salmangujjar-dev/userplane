import { createServerLogger, type LogLevel } from '@workspace/logger';
import { Pool } from 'pg';

const isDev = process.env.NODE_ENV !== 'production';
const logger = createServerLogger('db-reset', {
  level: (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info'),
  pretty: isDev,
});

function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('sslrootcert');
    return parsed.toString();
  } catch {
    return url;
  }
}

const resetDatabase = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  if (!isDev) {
    logger.error('db:reset is only allowed in development');
    process.exit(1);
  }

  logger.info('Dropping all tables in public schema...');

  const pool = new Pool({
    connectionString: sanitizeDatabaseUrl(databaseUrl),
    max: 1,
  });

  try {
    await pool.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    // Drop drizzle migration journal
    await pool.query(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);

    logger.info('Database reset complete');
  } catch (error) {
    logger.error({ err: error }, 'Database reset failed');
    process.exit(1);
  }

  await pool.end();
};

resetDatabase();
