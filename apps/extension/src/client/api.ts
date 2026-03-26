import { createClient, createSafeClient, isDefinedError } from '@userplane/client';

import { getPostHog } from '@/lib/posthog';

const API_URL = import.meta.env.WXT_API_URL || 'https://api-dev.userplane.io';

let isHandling401 = false;

function handle401(): void {
  if (isHandling401) return;
  isHandling401 = true;

  chrome.runtime
    .sendMessage({ type: 'AUTH_EXPIRED' })
    .catch(() => {})
    .finally(() => {
      isHandling401 = false;
    });
}

const baseClient = createClient({
  url: `${API_URL}/api/v1`,
  credentials: 'include',
  onError: (error) => {
    if (isDefinedError(error)) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? (error as { status: number }).status
          : undefined;
      if (status === 401) {
        handle401();
      }
      return;
    }

    console.debug('API Error:', error);

    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      if (status === 401) {
        handle401();
      }
      if (status >= 500) {
        getPostHog()?.captureException(error, {
          error_type: 'api_error',
          status_code: String(status),
        });
      }
    }
  },
});

export const apiClient = createSafeClient(baseClient);
