/**
 * Environment configuration for Dashboard
 * Centralizes all environment variable access with type safety and validation
 */
import { type Environment, isProductionLike, parseAppEnv } from '@workspace/shared/env';

interface SentryConfig {
  // Runtime configuration
  dsn?: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;

  // Build-time only (for source map uploads)
  org?: string;
  project?: string;
  authToken?: string;
}

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  /** Application environment for deployment stage (development, production) */
  appEnv: Environment;
  apiUrl: string;
  homeUrl: string;
  authCookiePrefix: string;
  sentry: SentryConfig;
}

/**
 * Parse float with fallback
 */
function parseFloat(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  // APP_ENV is set via next.config.mjs (e.g., APP_ENV=development next dev)
  const appEnv = parseAppEnv(process.env.APP_ENV);
  // Use appEnv to determine production-like behavior for Sentry sampling
  const isProdLike = isProductionLike(appEnv);

  const config: EnvConfig = {
    nodeEnv,
    appEnv,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api-preview.userplane.io',
    homeUrl: process.env.NEXT_PUBLIC_HOME_URL || 'https://home-preview.userplane.io',
    authCookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX || 'userplane',
    sentry: {
      // Runtime configuration
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.SENTRY_RELEASE,
      tracesSampleRate: parseFloat(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || process.env.SENTRY_TRACES_SAMPLE_RATE,
        isProdLike ? 0.1 : 1.0
      ),
      replaysSessionSampleRate: parseFloat(
        process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
        0.1
      ),
      replaysOnErrorSampleRate: parseFloat(
        process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE,
        1.0
      ),

      // Build-time only (for source map uploads)
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT_DASH,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();

/**
 * Client-safe environment config (only NEXT_PUBLIC_ variables)
 * Use this in client components to ensure no server-only secrets leak
 */
export const clientEnv = {
  nodeEnv: env.nodeEnv,
  appEnv: env.appEnv,
  apiUrl: env.apiUrl,
  homeUrl: env.homeUrl,
  authCookiePrefix: env.authCookiePrefix,
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: env.sentry.tracesSampleRate,
    replaysSessionSampleRate: env.sentry.replaysSessionSampleRate,
    replaysOnErrorSampleRate: env.sentry.replaysOnErrorSampleRate,
  },
} as const;
