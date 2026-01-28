/**
 * Environment configuration for Home/Marketing site
 * Centralizes all environment variable access with type safety and validation
 */

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  homeUrl: string;
  dashUrl: string;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];

  const config: EnvConfig = {
    nodeEnv,
    homeUrl: import.meta.env.PUBLIC_HOME_URL || 'http://localhost:4321',
    dashUrl: import.meta.env.PUBLIC_DASH_URL || 'http://localhost:3000',
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();
