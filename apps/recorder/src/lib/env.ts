/**
 * Environment configuration for Recorder
 * Centralizes all environment variable access with type safety and validation
 */
import { type Environment, isProductionLike, parseAppEnv } from '@workspace/shared/env';

interface SentryConfig {
  // Runtime configuration
  dsn?: string;
  release?: string;
  tracesSampleRate: number;

  // Build-time only (for source map uploads)
  org?: string;
  project?: string;
  authToken?: string;
}

interface MediaConfig {
  /** CDN domain for static assets (e.g., 'cdn.userplane.io') */
  cdnDomain: string;
  /** Cloudflare zone for image transforms (e.g., 'userplane.io') */
  imageZone: string;
  /** Skip image transforms (serve original URLs). Opt-out for local dev. */
  skipTransform: boolean;
}

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  /** Application environment for deployment stage (development, production) */
  appEnv: Environment;
  apiUrl: string;
  media: MediaConfig;
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
  // Astro's --mode flag sets import.meta.env.MODE (e.g., --mode development sets MODE=development)
  const appEnv = parseAppEnv(import.meta.env.MODE);
  // Use appEnv to determine production-like behavior for Sentry sampling
  const isProdLike = isProductionLike(appEnv);

  const config: EnvConfig = {
    nodeEnv,
    appEnv,
    apiUrl: import.meta.env.PUBLIC_API_URL || 'https://api-dev.userplane.io/api/v1',
    media: {
      cdnDomain: import.meta.env.PUBLIC_CDN_DOMAIN || 'cdn.userplane.io',
      imageZone: import.meta.env.PUBLIC_CLOUDFLARE_IMAGE_ZONE || 'userplane.io',
      skipTransform: import.meta.env.PUBLIC_SKIP_IMAGE_TRANSFORM === 'true',
    },
    sentry: {
      // Runtime configuration
      dsn: import.meta.env.PUBLIC_SENTRY_DSN,
      release: import.meta.env.PUBLIC_SENTRY_RELEASE,
      tracesSampleRate: parseFloat(
        import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
        isProdLike ? 0.1 : 1.0
      ),

      // Build-time only (for source map uploads)
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT_RECORDER,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    },
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();
