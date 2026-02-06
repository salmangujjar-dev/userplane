/**
 * Environment configuration and validation for dashboard
 * Centralizes all environment variable access with type safety and validation
 *
 * Types are inferred from Zod schemas in schema.ts to ensure consistency.
 */
import { isSecureEnvironment } from '@workspace/shared/env';
import { ZodError } from 'zod';

import { SENTRY } from './defaults';
import {
  type ApiConfig,
  type AuthConfig,
  type DashboardConfig,
  type EnvConfig,
  type HomeConfig,
  type RawEnvConfig,
  rawEnvSchema,
  type RecorderConfig,
  type SentryConfig,
  type StorageConfig,
} from './schema';

// Re-export types for external use
export type {
  ApiConfig,
  AuthConfig,
  DashboardConfig,
  EnvConfig,
  HomeConfig,
  RecorderConfig,
  SentryConfig,
  StorageConfig,
};

// =============================================================================
// Environment Parsing
// =============================================================================

/**
 * Explicitly reference each NEXT_PUBLIC_* env var so that the Next.js compiler
 * can inline them at build time. Passing process.env as a whole object does not
 * trigger static replacement, which causes client-side code to see undefined
 * for every NEXT_PUBLIC_* key and fall back to defaults.
 *
 * Server-only vars (no NEXT_PUBLIC_ prefix) are fine with process.env because
 * they are read at runtime on the server where process.env is a real object.
 */
function getExplicitEnv(): Record<string, string | undefined> {
  return {
    // App
    APP_ENV: process.env.APP_ENV,

    // URLs
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
    NEXT_PUBLIC_HOME_URL: process.env.NEXT_PUBLIC_HOME_URL,
    NEXT_PUBLIC_RECORDER_URL: process.env.NEXT_PUBLIC_RECORDER_URL,
    NEXT_PUBLIC_CDN_DOMAIN: process.env.NEXT_PUBLIC_CDN_DOMAIN,
    NEXT_PUBLIC_ASSETS_DOMAIN: process.env.NEXT_PUBLIC_ASSETS_DOMAIN,

    // Auth
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX,

    // Storage
    NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE: process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE,
    NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM: process.env.NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM,

    // Sentry (client)
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE,

    // Sentry (server) -- runtime-only, no inlining needed, but included for
    // completeness so the schema can validate them from the same input object
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_RELEASE: process.env.SENTRY_RELEASE,
    SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
  };
}

/**
 * Parse and validate environment variables using Zod schema
 */
function parseEnv(): RawEnvConfig {
  const result = rawEnvSchema.safeParse(getExplicitEnv());

  if (!result.success) {
    const errors = formatZodErrors(result.error);
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Format Zod validation errors into readable string
 */
function formatZodErrors(error: ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return `  - ${path}: ${err.message}`;
    })
    .join('\n');
}

// =============================================================================
// Configuration Transform
// =============================================================================

/**
 * Transform raw environment config into structured application config
 */
function transformEnvConfig(raw: RawEnvConfig): EnvConfig {
  const isProduction = raw.APP_ENV === 'production';

  // Use production sample rate in production, otherwise use configured or default
  const tracesSampleRate = isProduction
    ? SENTRY.TRACES_SAMPLE_RATE_PROD
    : raw.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;

  return {
    appEnv: raw.APP_ENV,
    useSecureCookies: isSecureEnvironment(raw.APP_ENV),
    api: {
      url: raw.NEXT_PUBLIC_API_URL,
    },
    dashboard: {
      url: raw.NEXT_PUBLIC_DASHBOARD_URL,
    },
    home: {
      url: raw.NEXT_PUBLIC_HOME_URL,
    },
    recorder: {
      url: raw.NEXT_PUBLIC_RECORDER_URL,
    },
    auth: {
      cookiePrefix: raw.NEXT_PUBLIC_AUTH_COOKIE_PREFIX,
    },
    storage: {
      cdnDomain: raw.NEXT_PUBLIC_CDN_DOMAIN,
      assetsDomain: raw.NEXT_PUBLIC_ASSETS_DOMAIN,
      imageZone: raw.NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE,
      skipTransform: raw.NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM,
    },
    sentry: {
      dsn: raw.NEXT_PUBLIC_SENTRY_DSN,
      release: raw.NEXT_PUBLIC_SENTRY_RELEASE,
      tracesSampleRate,
      replaysSessionSampleRate: raw.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      replaysErrorSampleRate: raw.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE,
    },
  };
}

// =============================================================================
// Load Configuration
// =============================================================================

/**
 * Load and validate environment configuration
 */
function loadEnvConfig(): EnvConfig {
  const raw = parseEnv();
  return transformEnvConfig(raw);
}

export const env = loadEnvConfig();
