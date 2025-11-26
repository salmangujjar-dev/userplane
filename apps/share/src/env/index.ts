/**
 * Environment configuration and validation
 * Minimal configuration for read-only redirect service
 */
import { createAppLogger } from '@workspace/logger';

interface EnvConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production' | 'test';
  cors: {
    origins: string[];
    credentials: boolean;
    maxAge: number;
  };
}

/**
 * Parse comma-separated string into array
 */
function parseCommaSeparated(value: string | undefined, defaultValue: string[]): string[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Parse integer with fallback
 */
function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse boolean with fallback
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];

  const config: EnvConfig = {
    port: parseInteger(process.env.SHARE_PORT, 3002),
    host: process.env.SHARE_HOST || '0.0.0.0',
    nodeEnv,
    cors: {
      origins: parseCommaSeparated(process.env.SHARE_CORS_ORIGINS, ['*']),
      credentials: parseBoolean(process.env.SHARE_CORS_CREDENTIALS, false),
      maxAge: parseInteger(process.env.SHARE_CORS_MAX_AGE, 86400),
    },
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();

/**
 * Logger instance for environment configuration
 */
const logger = createAppLogger('share-env');

/**
 * Log configuration on startup
 */
export function logConfig(): void {
  logger.info(
    {
      mode: env.nodeEnv,
      port: env.port,
      host: env.host,
      corsOrigins: env.cors.origins,
    },
    'Share service configuration loaded'
  );
}
