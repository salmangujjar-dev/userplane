import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from './db/client';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-do-not-use-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3002',
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? [],
});
