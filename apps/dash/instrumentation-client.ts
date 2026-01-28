/**
 * Client-side instrumentation file
 * This file configures Sentry for the browser
 * Learn more: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */
import * as Sentry from '@sentry/nextjs';
import { createBeforeSendFilter, IGNORED_ERRORS_BROWSER } from '@workspace/sentry';

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
  beforeSend: createBeforeSendFilter({ filterCookies: true }),

  // Ignore expected errors
  ignoreErrors: [...IGNORED_ERRORS_BROWSER],
});

/**
 * Instrument client-side navigations for Sentry
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
