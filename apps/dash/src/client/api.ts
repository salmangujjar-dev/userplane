import * as Sentry from '@sentry/nextjs';
import { createClient, createSafeClient } from '@workspace/client';

import { authClient } from '@/client/auth';
import { env } from '@/env';

// Deduplication flag to prevent multiple concurrent 401 redirects.
// When several in-flight requests all return 401, only the first one
// triggers sign-out + redirect; the rest are no-ops.
let isRedirectingToAuth = false;

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

    // Handle 401 Unauthorized errors by signing out and redirecting to sign-in.
    // The sign-out clears the stale session cookie so the middleware won't
    // bounce the user back from /auth (which would cause an infinite loop).
    // The session_expired param acts as a safety net: even if sign-out fails,
    // the middleware will let the request through to the auth page.
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      if (typeof window !== 'undefined' && !isRedirectingToAuth) {
        isRedirectingToAuth = true;
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `/auth?session_expired=true&redirect_to=${encodeURIComponent(currentPath)}`;

        authClient
          .signOut()
          .catch(() => {
            // Ignore sign-out errors -- the session_expired param in the
            // redirect URL ensures the middleware won't redirect back.
          })
          .finally(() => {
            window.location.href = redirectUrl;
          });
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
