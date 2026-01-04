import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';

export interface AuthClientConfig {
  baseURL: string;
  fetchOptions?: RequestInit;
}

export function createAuthClientInstance(config: AuthClientConfig) {
  return createAuthClient({
    baseURL: config.baseURL,
    plugins: [adminClient()],
    fetchOptions: {
      credentials: 'include',
      ...config.fetchOptions,
    },
  });
}

export type AuthClient = ReturnType<typeof createAuthClientInstance>;
