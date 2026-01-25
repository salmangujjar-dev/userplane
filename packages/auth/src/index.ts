import type { DbClient } from '@workspace/db';
import * as schema from '@workspace/db/schema';
import { APIError, betterAuth, type BetterAuthPlugin } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, magicLink, openAPI } from 'better-auth/plugins';

import { authMiddlewareHook, userCreateHook } from './hooks';
import { ac, adminRole, csmRole, userRole } from './permissions';

// Export APIError for use in callbacks
export { APIError };

// Export roles for server use only
export { adminRole, csmRole, userRole } from './permissions';

// Export types and utilities for both server and client use
export type { Action, PermissionMap, Resource, RoleName } from './types';
export { isValidRoleName } from './types';

// Export feature flag utilities for composable hook configuration
export * from './flags';

// Note: For client-side usage, import from '@workspace/auth/permissions-client'
// to avoid importing server-only Better Auth code

export interface AdminConfig {
  /** User IDs that should always be treated as admins */
  adminUserIds?: string[];
  /** Duration of impersonation session in seconds (default: 1 hour) */
  impersonationSessionDuration?: number;
}

export interface EmailConfig {
  /** Function to send verification emails */
  sendVerificationEmail: (data: {
    user: { email: string; name: string };
    url: string;
    token: string;
  }) => Promise<void>;
  /** Function to send magic link emails */
  sendMagicLink: (data: { email: string; url: string; token: string }) => Promise<void>;
}

export interface DeleteUserConfig {
  /** Function to send account deletion verification email */
  sendDeleteAccountVerification: (data: {
    user: { id: string; email: string; name: string };
    url: string;
    token: string;
  }) => Promise<void>;
  /** Function called before user deletion to validate/block deletion */
  beforeDelete?: (user: { id: string; email: string; name: string }) => Promise<void>;
  /** Function called after successful user deletion */
  afterDelete?: (user: { id: string; email: string; name: string }) => Promise<void>;
}

export interface AuthConfig {
  database: DbClient;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  cookiePrefix?: string;
  /** Node environment - defaults to process.env.NODE_ENV */
  nodeEnv?: 'development' | 'production' | 'test';
  google: {
    clientId: string;
    clientSecret: string;
    redirectURI?: string;
  };
  admin?: AdminConfig;
  email: EmailConfig;
  deleteUser?: DeleteUserConfig;
  /** Additional plugins to include (e.g., DodoPayments) */
  plugins?: BetterAuthPlugin[];
}

export function createAuth(config: AuthConfig) {
  const nodeEnv = config.nodeEnv || (process.env.NODE_ENV as typeof config.nodeEnv);
  const isProduction = nodeEnv === 'production';
  const isDevelopment = !isProduction;

  return betterAuth({
    database: drizzleAdapter(config.database, {
      provider: 'pg',
      schema: schema,
    }),
    secret: config.secret,
    baseURL: config.baseURL,
    trustedOrigins: config.trustedOrigins,
    // Enable email/password authentication
    emailAndPassword: {
      enabled: true,
      autoSignIn: false, // Don't auto sign in - require email verification first
      requireEmailVerification: true,
    },
    // Enable account linking with Google as trusted provider
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    },
    // Email verification config
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        await config.email.sendVerificationEmail({ user, url, token });
      },
    },
    // User deletion config
    user: config.deleteUser
      ? {
          deleteUser: {
            enabled: true,
            ...config.deleteUser,
          },
        }
      : undefined,
    plugins: [
      admin({
        adminUserIds: config.admin?.adminUserIds,
        impersonationSessionDuration: config.admin?.impersonationSessionDuration ?? 60 * 60, // 1 hour default
        ac,
        roles: {
          admin: adminRole,
          csm: csmRole,
          user: userRole,
        },
      }),
      magicLink({
        sendMagicLink: async ({ email, url, token }) => {
          await config.email.sendMagicLink({ email, url, token });
        },
        expiresIn: 60 * 10, // 10 minutes
      }),
      // Only include openAPI plugin in non-production environments
      ...(isProduction ? [] : [openAPI()]),
      // Include any additional plugins (e.g., DodoPayments)
      ...(config.plugins ?? []),
    ],
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
    advanced: {
      // Cookie prefix for all cookies
      cookiePrefix: config.cookiePrefix || 'userplane',
      // Cookie attributes based on environment
      // Development: use lax for localhost with different ports
      // Production: use lax with secure flag
      defaultCookieAttributes: isDevelopment
        ? {
            sameSite: 'lax',
            secure: false,
          }
        : {
            sameSite: 'lax',
            secure: true,
          },
    },
    databaseHooks: {
      user: {
        create: userCreateHook,
      },
    },
    hooks: {
      before: authMiddlewareHook,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

// Re-export DodoPayments types for convenience
export type { DodoPaymentsAuthConfig, WebhookHeaders } from './dodopayments';
export { createDodoPaymentsPlugin, setWebhookContextProvider } from './dodopayments';
