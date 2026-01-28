import * as Sentry from '@sentry/nextjs';
import { createClient, createSafeClient } from '@workspace/client';

import { env } from '@/env';

const baseClient = createClient({
  url: `${env.api.url}/api/v1`,
  credentials: 'include',
  onError: (error) => {
    console.error('API Error:', error);

    // Capture 5xx server errors in Sentry
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number;
      if (status >= 500 && status < 600) {
        Sentry.captureException(error, {
          tags: {
            error_type: 'api_error',
            status_code: status,
          },
        });
      }
    }

    // Handle 401 Unauthorized errors by redirecting to sign-in
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `/auth?redirect_to=${encodeURIComponent(currentPath)}`;
        window.location.href = redirectUrl;
      }
    }
  },
  headers: () => {
    // Add Sentry trace headers for distributed tracing
    const sentryTrace = Sentry.getActiveSpan();
    if (sentryTrace) {
      const traceHeaders = Sentry.spanToTraceHeader(sentryTrace);
      const baggage = Sentry.spanToBaggageHeader(sentryTrace);

      return {
        ...(traceHeaders && { 'sentry-trace': traceHeaders }),
        ...(baggage && { baggage }),
      };
    }
    return {};
  },
});

// Wrap client with safe error handling
export const apiClient = createSafeClient(baseClient);
