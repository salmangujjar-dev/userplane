import nextEnv from '@next/env';
import { defineConfig } from 'drizzle-kit';

import { getDatabaseUrl, getLocalDatabasePath, isRemoteDatabaseUrl } from './src/lib/db/config';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), true);

const baseConfig = {
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
} as const;

const databaseUrl = getDatabaseUrl();

export default isRemoteDatabaseUrl(databaseUrl)
  ? defineConfig({
      ...baseConfig,
      dialect: 'turso',
      dbCredentials: {
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
    })
  : defineConfig({
      ...baseConfig,
      dialect: 'sqlite',
      dbCredentials: { url: getLocalDatabasePath() },
    });
