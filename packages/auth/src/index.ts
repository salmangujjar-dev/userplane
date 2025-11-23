import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { DbClient } from '@workspace/db';
import * as schema from '@workspace/db/schema';

export interface AuthConfig {
  database: DbClient;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  google: {
    clientId: string;
    clientSecret: string;
    redirectURI?: string;
  };
}

export function createAuth(config: AuthConfig) {
  return betterAuth({
    database: drizzleAdapter(config.database, {
      provider: 'pg',
      schema: schema,
    }),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    socialProviders: {
      google: {
        clientId: config.google.clientId,
        clientSecret: config.google.clientSecret,
        redirectURI: config.google.redirectURI,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
