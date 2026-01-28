/**
 * Client-side instrumentation file
 * This file configures Sentry for the browser
 * Learn more: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */
import * as Sentry from '@sentry/nextjs';

import { clientEnv } from '@/lib/env';

Sentry.init({
  dsn: clientEnv.sentry.dsn,
  environment: clientEnv.nodeEnv,
  release: clientEnv.sentry.release,

  // Performance monitoring
  tracesSampleRate: clientEnv.sentry.tracesSampleRate,

  // Session Replay
  replaysSessionSampleRate: clientEnv.sentry.replaysSessionSampleRate,
  replaysOnErrorSampleRate: clientEnv.sentry.replaysOnErrorSampleRate,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive cookies
    if (event.request?.cookies) {
      const sensitivePatterns = ['session_token', 'auth'];
      for (const key of Object.keys(event.request.cookies)) {
        if (sensitivePatterns.some((pattern) => key.includes(pattern))) {
          event.request.cookies[key] = '[Filtered]';
        }
      }
    }

    return event;
  },

  // Ignore expected errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
  ],
});
