/**
 * Sentry initialization for API
 * Must be imported and called at the very top of the entry point
 */
import * as Sentry from '@sentry/bun';
import { createBeforeSendFilter, IGNORED_ERRORS_API } from '@workspace/sentry';

import { env } from '@/api/env';

export function initSentry() {
  if (!env.sentry.dsn) {
    console.warn('Sentry DSN is not set, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.server.nodeEnv,
    release: env.sentry.release,

    // Performance monitoring
    tracesSampleRate: env.sentry.tracesSampleRate,

    // Filter sensitive data before sending to Sentry
    beforeSend: createBeforeSendFilter(),

    // Ignore expected errors
    ignoreErrors: [...IGNORED_ERRORS_API],
  });
}
