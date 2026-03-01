import { createAuthClient } from 'better-auth/client';
import { adminClient, magicLinkClient } from 'better-auth/client/plugins';

// Note: Permission constants and types should be imported from '@userplane/auth/permissions-client'
// to avoid bundling server-only code in the client

export interface AuthClientConfig {
  baseURL: string;
  fetchOptions?: RequestInit;
}

export function createAuthClientInstance(config: AuthClientConfig) {
  return createAuthClient({
    baseURL: config.baseURL,
    plugins: [
      // Client doesn't need access control configuration
      // Permission checks happen server-side
      adminClient(),
      magicLinkClient(),
    ],
    fetchOptions: {
      credentials: 'include',
      ...config.fetchOptions,
    },
  });
}

export type AuthClient = ReturnType<typeof createAuthClientInstance>;
