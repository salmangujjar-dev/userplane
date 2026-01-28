/**
 * Sentry initialization for API
 * Must be imported and called at the very top of the entry point
 */
import * as Sentry from '@sentry/bun';

import { env } from '@/api/env';

export function initSentry() {
  if (!env.sentry.dsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.nodeEnv,
    release: env.sentry.release,

    // Performance monitoring
    tracesSampleRate: env.sentry.tracesSampleRate,

    // Filter sensitive data before sending to Sentry
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        const sensitiveHeaders = [
          'authorization',
          'cookie',
          'x-userplane-session-token',
          'x-userplane-upload-token',
        ];

        for (const header of sensitiveHeaders) {
          if (event.request.headers[header]) {
            event.request.headers[header] = '[Filtered]';
          }
        }
      }

      return event;
    },

    // Ignore expected errors
    ignoreErrors: ['RATE_LIMIT_EXCEEDED', 'Unauthorized', 'UNAUTHORIZED'],
  });
}
