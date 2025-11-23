import { createAuthClient } from 'better-auth/client';

export interface AuthClientConfig {
  baseURL: string;
  fetchOptions?: RequestInit;
}

export type AuthClient = ReturnType<typeof createAuthClient>;

export function createAuthClientInstance(config: AuthClientConfig): AuthClient {
  return createAuthClient({
    baseURL: config.baseURL,
    fetchOptions: {
      credentials: 'include',
      ...config.fetchOptions,
    },
  });
}
