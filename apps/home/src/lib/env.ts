/**
 * Environment configuration for Home/Marketing site
 * Centralizes all environment variable access with type safety and validation
 */
import { type Environment, parseAppEnv } from '@workspace/shared/env';

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
  homeUrl: string;
  dashUrl: string;
  media: MediaConfig;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  // Astro's --mode flag sets import.meta.env.MODE (e.g., --mode development sets MODE=development)
  const appEnv = parseAppEnv(import.meta.env.MODE);

  const config: EnvConfig = {
    nodeEnv,
    appEnv,
    homeUrl: import.meta.env.PUBLIC_HOME_URL || 'https://home-dev.userplane.io',
    dashUrl: import.meta.env.PUBLIC_DASH_URL || 'https://dash-dev.userplane.io',
    media: {
      cdnDomain: import.meta.env.PUBLIC_CDN_DOMAIN || 'cdn.userplane.io',
      imageZone: import.meta.env.PUBLIC_CLOUDFLARE_IMAGE_ZONE || 'userplane.io',
      skipTransform: import.meta.env.PUBLIC_SKIP_IMAGE_TRANSFORM === 'true',
    },
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();
