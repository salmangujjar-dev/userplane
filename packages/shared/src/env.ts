/**
 * Environment configuration utilities
 * Provides typed helpers for environment-specific file naming
 */

/**
 * Valid environment names used across the application
 */
export type Environment = 'development' | 'staging' | 'production' | 'preview';

/**
 * Environment file name pattern: .env.{environment}
 */
export type EnvFileName = `.env.${Environment}`;

/**
 * Get the environment file name for a given environment
 *
 * @param environment - The environment name (development, staging, production, preview)
 * @returns The corresponding env file name (e.g., .env.development)
 *
 * @example
 * ```ts
 * getEnvFileName('staging') // returns '.env.staging'
 * getEnvFileName('production') // returns '.env.production'
 * getEnvFileName('development') // returns '.env.development'
 * getEnvFileName('preview') // returns '.env.preview'
 * getEnvFileName('unknown') // returns '.env.development' (default)
 * ```
 */
export function getEnvFileName(environment: string): EnvFileName {
  switch (environment) {
    case 'staging':
      return '.env.staging';
    case 'production':
      return '.env.production';
    case 'preview':
      return '.env.preview';
    case 'development':
    default:
      return '.env.development';
  }
}

/**
 * Check if a string is a valid environment name
 */
export function isValidEnvironment(value: string): value is Environment {
  return ['development', 'staging', 'production', 'preview'].includes(value);
}

/**
 * All valid environment names
 */
export const ENVIRONMENTS: readonly Environment[] = [
  'development',
  'staging',
  'production',
  'preview',
] as const;

/**
 * Parse APP_ENV with type safety and default to development
 *
 * @param value - The APP_ENV value from environment variables
 * @returns A valid Environment value, defaults to 'development' if invalid or undefined
 *
 * @example
 * ```ts
 * parseAppEnv('preview') // returns 'preview'
 * parseAppEnv('invalid') // returns 'development'
 * parseAppEnv(undefined) // returns 'development'
 * ```
 */
export function parseAppEnv(value: string | undefined): Environment {
  if (value && isValidEnvironment(value)) return value;
  return 'development';
}

/**
 * Check if environment requires secure cookies (HTTPS)
 * Preview, staging, and production all use HTTPS and require secure cookies
 *
 * @param env - The environment to check
 * @returns true if the environment requires secure cookies
 */
export function isSecureEnvironment(env: Environment): boolean {
  return env === 'preview' || env === 'staging' || env === 'production';
}

/**
 * Check if environment is production-like (for logging, Sentry sampling, etc.)
 * Only staging and production are considered production-like
 *
 * @param env - The environment to check
 * @returns true if the environment is production-like
 */
export function isProductionLike(env: Environment): boolean {
  return env === 'staging' || env === 'production';
}
