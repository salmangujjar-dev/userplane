import { createClient, createSafeClient } from '@workspace/client';

import { env } from '@/env';

const baseClient = createClient({
  url: `${env.api.url}/api/v1`,
  credentials: 'include',
  onError: (error) => {
    console.error('API Error:', error);

    // Handle 401 Unauthorized errors by redirecting to sign-in
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `/auth?redirect_to=${encodeURIComponent(currentPath)}`;
        window.location.href = redirectUrl;
      }
    }
  },
});

// Wrap client with safe error handling
export const apiClient = createSafeClient(baseClient);
