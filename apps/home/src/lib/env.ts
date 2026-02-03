/**
 * Environment configuration for Home/Marketing site
 * Centralizes all environment variable access with type safety and validation
 */
import { type Environment, parseAppEnv } from '@workspace/shared/env';

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  /** Application environment for deployment stage (development, preview, staging, production) */
  appEnv: Environment;
  homeUrl: string;
  dashUrl: string;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  // Astro's --mode flag sets import.meta.env.MODE (e.g., --mode preview sets MODE=preview)
  const appEnv = parseAppEnv(import.meta.env.MODE);

  const config: EnvConfig = {
    nodeEnv,
    appEnv,
    homeUrl: import.meta.env.PUBLIC_HOME_URL || 'http://localhost:4321',
    dashUrl: import.meta.env.PUBLIC_DASH_URL || 'http://localhost:3000',
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();
