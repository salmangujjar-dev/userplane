import { createClient, createSafeClient, isDefinedError } from '@workspace/client';
import posthog from 'posthog-js';

import { authClient } from '@/client/auth';
import { env } from '@/env';

// Deduplication flag to prevent multiple concurrent 401 redirects.
// When several in-flight requests all return 401, only the first one
// triggers sign-out + redirect; the rest are no-ops.
let isRedirectingToAuth = false;

function handle401Redirect(): void {
  if (typeof window === 'undefined' || isRedirectingToAuth) return;
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

const baseClient = createClient({
  url: `${env.api.url}/api/v1`,
  credentials: 'include',
  onError: (error) => {
    // Defined API errors (e.g. LINK_LIMIT_EXCEEDED, UNAUTHORIZED) are expected
    // and handled in the UI; do not log or report them. Still redirect on 401.
    if (isDefinedError(error)) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? (error as { status: number }).status
          : undefined;
      if (status === 401) {
        handle401Redirect();
      }
      return;
    }

    console.error('API Error:', error);

    // Capture 5xx server errors in PostHog
    if (error && typeof error === 'object' && 'status' in error) {
      const status = error.status as number;
      if (status >= 500 && status < 600) {
        posthog.captureException(error, {
          error_type: 'api_error',
          status_code: String(status),
        });
      }
    }

    // Handle 401 Unauthorized (non-defined) by signing out and redirecting to sign-in.
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      handle401Redirect();
    }
  },
});

// Wrap client with safe error handling
export const apiClient = createSafeClient(baseClient);
