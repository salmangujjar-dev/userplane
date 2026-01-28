/**
 * Next.js instrumentation file
 * This file is used to initialize Sentry on the server and edge runtimes
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import * as Sentry from '@sentry/nextjs';
import { createBeforeSendFilter, IGNORED_ERRORS_SERVER } from '@workspace/sentry';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    const { env } = await import('./src/lib/env');

    Sentry.init({
      dsn: env.sentry.dsn,
      environment: env.nodeEnv,
      release: env.sentry.release,

      // Performance monitoring
      tracesSampleRate: env.sentry.tracesSampleRate,

      // Filter sensitive data
      beforeSend: createBeforeSendFilter(),

      // Ignore expected errors
      ignoreErrors: [...IGNORED_ERRORS_SERVER],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    const { env } = await import('./src/lib/env');

    Sentry.init({
      dsn: env.sentry.dsn,
      environment: env.nodeEnv,
      release: env.sentry.release,

      // Performance monitoring
      tracesSampleRate: env.sentry.tracesSampleRate,

      // Filter sensitive data
      beforeSend: createBeforeSendFilter(),
    });
  }
}

/**
 * Capture errors from nested React Server Components
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#errors-from-nested-react-server-components
 */
export const onRequestError = Sentry.captureRequestError;
