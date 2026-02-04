/**
 * Environment configuration utilities
 * Provides typed helpers for environment-specific file naming
 */

/**
 * Valid environment names used across the application
 */
export type Environment = 'development' | 'production';

/**
 * Environment file name pattern: .env.{environment}
 */
export type EnvFileName = `.env.${Environment}`;

/**
 * Get the environment file name for a given environment
 *
 * @param environment - The environment name (development, production)
 * @returns The corresponding env file name (e.g., .env.development)
 *
 * @example
 * ```ts
 * getEnvFileName('production') // returns '.env.production'
 * getEnvFileName('development') // returns '.env.development'
 * getEnvFileName('unknown') // returns '.env.development' (default)
 * ```
 */
export function getEnvFileName(environment: string): EnvFileName {
  switch (environment) {
    case 'production':
      return '.env.production';
    case 'development':
    default:
      return '.env.development';
  }
}

/**
 * Check if a string is a valid environment name
 */
export function isValidEnvironment(value: string): value is Environment {
  return ['development', 'production'].includes(value);
}

/**
 * All valid environment names
 */
export const ENVIRONMENTS: readonly Environment[] = ['development', 'production'] as const;

/**
 * Parse APP_ENV with type safety and default to development
 *
 * @param value - The APP_ENV value from environment variables
 * @returns A valid Environment value, defaults to 'development' if invalid or undefined
 *
 * @example
 * ```ts
 * parseAppEnv('production') // returns 'production'
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
 * Both development and production use HTTPS (development via Cloudflare tunnels)
 *
 * @param env - The environment to check
 * @returns always true since both environments use HTTPS
 */
export function isSecureEnvironment(env: Environment): boolean {
  if (!isValidEnvironment(env)) return false;
  return true;
}

/**
 * Check if environment is production-like (for logging, Sentry sampling, etc.)
 *
 * @param env - The environment to check
 * @returns true if the environment is production
 */
export function isProductionLike(env: Environment): boolean {
  return env === 'production';
}
