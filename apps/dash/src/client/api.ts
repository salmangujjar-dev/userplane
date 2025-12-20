import { createClient } from '@workspace/client';
import { env } from '@/env';

export const apiClient = createClient({
  url: `${env.api.url}/api/v1`,
  credentials: 'include',
  onError: (error) => {
    console.error('API Error:', error);
  },
});
