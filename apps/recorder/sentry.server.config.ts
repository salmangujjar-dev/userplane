import * as Sentry from '@sentry/astro';
import { recorderBeforeSendFilter } from '@workspace/sentry';

const isProduction = import.meta.env.MODE === 'production';

// Parse traces sample rate from env, falling back to defaults:
// 0.1 in production, 1.0 in development
const tracesSampleRate = import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE
  ? parseFloat(import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
  : isProduction
    ? 0.1
    : 1.0;

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.PUBLIC_SENTRY_RELEASE,
  tracesSampleRate,
  // SentryEventLike is a simplified subset of ErrorEvent used by @workspace/sentry
  // to avoid depending on @sentry/* types directly; the cast is safe.
  beforeSend: recorderBeforeSendFilter as unknown as Parameters<
    typeof Sentry.init
  >[0]['beforeSend'],
});
