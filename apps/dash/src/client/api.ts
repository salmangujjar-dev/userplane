import apiClient from '@workspace/api-client';
import { env } from '@/env';

export const api = apiClient(env.api.url, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: 'include', // Important: Include cookies in cross-origin requests
    });
  },
});
