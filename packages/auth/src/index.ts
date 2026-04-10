import { oauthProvider } from '@better-auth/oauth-provider';
import type { DbClient } from '@userplane/db';
import * as schema from '@userplane/db/schema';
import { type Environment, isSecureEnvironment } from '@userplane/shared/env';
import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, jwt, magicLink, openAPI } from 'better-auth/plugins';

import { setFeatureFlagsConfig } from './flags';
import { authMiddlewareHook, userCreateHook } from './hooks';
import { ac, adminRole, csmRole, userRole } from './permissions';

// Export APIError for use in callbacks
export { APIError };

// Re-export MCP/OAuth utilities from the oauth-provider plugin
export {
  mcpHandler,
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from '@better-auth/oauth-provider';

// Export roles for server use only
export { adminRole, csmRole, userRole } from './permissions';

// Export types and utilities for both server and client use
export type { Action, PermissionMap, Resource, RoleName } from './types';
export { isValidRoleName } from './types';

// Export feature flag utilities for composable hook configuration
export * from './flags';

// Note: For client-side usage, import from '@userplane/auth/permissions-client'
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

export interface FeatureFlagsConfig {
  /** Enable email normalization during user creation */
  enableEmailNormalization?: boolean;
  /** Allow disposable email addresses during signup */
  allowDisposableEmail?: boolean;
  /** Enable name normalization from email during user creation */
  enableNameNormalization?: boolean;
}

export interface McpConfig {
  /** URL to the login page for the OAuth authorization flow */
  loginPage: string;
  /** URL to the consent page where users approve MCP client access */
  consentPage: string;
  /** URL of the resource server (used for audience validation) */
  resourceServerUrl: string;
}

export interface AuthConfig {
  database: DbClient;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  cookiePrefix?: string;
  /**
   * Cookie domain for cross-subdomain sharing (e.g., .userplane.io)
   * When set, cookies are shared across all subdomains
   * Set this to share cookies across subdomains
   */
  cookieDomain?: string;
  /** Node environment - defaults to process.env.NODE_ENV */
  nodeEnv?: 'development' | 'production' | 'test';
  /**
   * Application environment for deployment stage
   * Controls cookie security settings (both environments use secure cookies via HTTPS)
   * Defaults to 'development'
   */
  appEnv?: Environment;
  google: {
    clientId: string;
    clientSecret: string;
    redirectURI?: string;
  };
  admin?: AdminConfig;
  email: EmailConfig;
  deleteUser?: DeleteUserConfig;
  /** Feature flags configuration - overrides environment variables */
  featureFlags?: FeatureFlagsConfig;
  /** MCP OAuth 2.1 Provider — enables AI tools to authenticate via OAuth */
  mcp?: McpConfig;
  /** Callback after user is created (e.g., create payment customer) */
  onUserCreated?: (user: { id: string; email: string; name: string }) => Promise<void>;
}

export function createAuth(config: AuthConfig) {
  const nodeEnv = config.nodeEnv || (process.env.NODE_ENV as typeof config.nodeEnv);
  const isProduction = nodeEnv === 'production';

  // Use appEnv for cookie security decisions (both environments use HTTPS)
  const appEnv = config.appEnv || 'development';
  const isSecure = isSecureEnvironment(appEnv);

  // Register feature flags config for use in hooks
  if (config.featureFlags) {
    setFeatureFlagsConfig(config.featureFlags);
  }

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
      // MCP OAuth 2.1 Provider — requires jwt() for token signing
      ...(config.mcp
        ? [
            jwt(),
            oauthProvider({
              loginPage: config.mcp.loginPage,
              consentPage: config.mcp.consentPage,
              validAudiences: [config.mcp.resourceServerUrl],
              scopes: ['openid', 'profile', 'email', 'offline_access', 'mcp:tools'],
              allowDynamicClientRegistration: true,
              allowUnauthenticatedClientRegistration: true,
            }),
          ]
        : []),
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
      // Force secure cookies since both environments use HTTPS
      useSecureCookies: isSecure,
      // Cross-subdomain cookie sharing
      // Allows cookies set on api.userplane.io to be read by dash.userplane.io
      //
      // Security model:
      // - cookieDomain (.userplane.io) controls which domains can READ the cookie
      // - trustedOrigins controls which domains can USE the auth API
      // Even if an untrusted subdomain reads the cookie, it cannot authenticate
      // because requests from non-trusted origins are rejected by Better Auth.
      // This is the recommended pattern: parent domain for cookie sharing,
      // trustedOrigins for access control.
      // See: https://www.better-auth.com/docs/concepts/cookies#cross-subdomain-cookies
      ...(config.cookieDomain
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: config.cookieDomain,
            },
          }
        : {}),
      // Cookie attributes: use none with secure flag to support OAuth POST callbacks
      // SameSite=lax cookies are NOT sent on cross-site POST requests (per spec),
      // which breaks OAuth providers that use POST-based callbacks (Google, Apple)
      // See: https://github.com/better-auth/better-auth/issues/5243
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },
    databaseHooks: {
      user: {
        create: {
          ...userCreateHook,
          ...(config.onUserCreated
            ? {
                after: async (user: { id: string; email: string; name: string }) => {
                  await config.onUserCreated!(user);
                },
              }
            : {}),
        },
      },
    },
    hooks: {
      before: authMiddlewareHook,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
