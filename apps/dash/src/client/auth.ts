import { type AuthClient, createAuthClientInstance } from '@workspace/auth/client';

import { env } from '@/env';

export const authClient: AuthClient = createAuthClientInstance({
  baseURL: env.api.url,
  fetchOptions: {
    credentials: 'include',
  },
});
