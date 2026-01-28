/**
 * Environment configuration for Recorder
 * Centralizes all environment variable access with type safety and validation
 */

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

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  apiUrl: string;
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
  const isProduction = nodeEnv === 'production';

  const config: EnvConfig = {
    nodeEnv,
    apiUrl: import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    sentry: {
      // Runtime configuration
      dsn: import.meta.env.PUBLIC_SENTRY_DSN,
      release: import.meta.env.PUBLIC_SENTRY_RELEASE,
      tracesSampleRate: parseFloat(
        import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
        isProduction ? 0.1 : 1.0
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
