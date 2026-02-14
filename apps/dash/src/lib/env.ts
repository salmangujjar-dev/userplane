/**
 * Environment configuration for Dashboard
 * Centralizes all environment variable access with type safety and validation
 */
import { type Environment, parseAppEnv } from '@workspace/shared/env';

interface PostHogConfig {
  apiKey?: string;
  host: string;
  // Build-time only
  personalApiKey?: string;
  projectId?: string;
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
  homeUrl: string;
  authCookiePrefix: string;
  media: MediaConfig;
  posthog: PostHogConfig;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  const appEnv = parseAppEnv(process.env.APP_ENV);

  const config: EnvConfig = {
    nodeEnv,
    appEnv,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.userplane.io',
    homeUrl: process.env.NEXT_PUBLIC_HOME_URL || 'https://home-dev.userplane.io',
    authCookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX || 'userplane',
    media: {
      cdnDomain: process.env.NEXT_PUBLIC_CDN_DOMAIN || 'cdn.userplane.io',
      imageZone: process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE || 'userplane.io',
      skipTransform: process.env.NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM === 'true',
    },
    posthog: {
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
      projectId: process.env.POSTHOG_PROJECT_ID,
    },
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();

/**
 * Client-safe environment config (only NEXT_PUBLIC_ variables)
 * Use this in client components to ensure no server-only secrets leak
 */
export const clientEnv = {
  nodeEnv: env.nodeEnv,
  appEnv: env.appEnv,
  apiUrl: env.apiUrl,
  homeUrl: env.homeUrl,
  authCookiePrefix: env.authCookiePrefix,
  media: env.media,
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  },
} as const;
