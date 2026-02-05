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
 * Parse and validate environment variables using Zod schema
 */
function parseEnv(): RawEnvConfig {
  const result = rawEnvSchema.safeParse(process.env);

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
