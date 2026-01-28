/**
 * Next.js instrumentation file
 * This file is used to initialize Sentry on the server and edge runtimes
 * Learn more: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    const Sentry = await import('@sentry/nextjs');
    const { env } = await import('./src/lib/env');

    Sentry.init({
      dsn: env.sentry.dsn,
      environment: env.nodeEnv,
      release: env.sentry.release,

      // Performance monitoring
      tracesSampleRate: env.sentry.tracesSampleRate,

      // Filter sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          const sensitiveHeaders = ['authorization', 'cookie'];
          for (const header of sensitiveHeaders) {
            if (event.request.headers[header]) {
              event.request.headers[header] = '[Filtered]';
            }
          }
        }

        return event;
      },

      // Ignore expected errors
      ignoreErrors: ['UNAUTHORIZED', 'Unauthorized'],
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    const Sentry = await import('@sentry/nextjs');
    const { env } = await import('./src/lib/env');

    Sentry.init({
      dsn: env.sentry.dsn,
      environment: env.nodeEnv,
      release: env.sentry.release,

      // Performance monitoring
      tracesSampleRate: env.sentry.tracesSampleRate,

      // Filter sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          const sensitiveHeaders = ['authorization', 'cookie'];
          for (const header of sensitiveHeaders) {
            if (event.request.headers[header]) {
              event.request.headers[header] = '[Filtered]';
            }
          }
        }

        return event;
      },
    });
  }
}
