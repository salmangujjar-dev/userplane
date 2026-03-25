import { createAuthClientInstance } from '@userplane/auth/client';

const API_URL = import.meta.env.WXT_API_URL || 'https://api-dev.userplane.io';

export const authClient = createAuthClientInstance({
  baseURL: API_URL,
  fetchOptions: { credentials: 'include' },
});
