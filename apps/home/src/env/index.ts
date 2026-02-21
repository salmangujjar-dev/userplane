/**
 * Environment configuration and validation for home/marketing site
 * Centralizes all environment variable access with type safety and validation
 *
 * Types are inferred from Zod schemas in schema.ts to ensure consistency.
 *
 * Note: This app uses Astro with import.meta.env (PUBLIC_ prefix)
 */
import { ZodError } from 'zod';

import { type EnvConfig, type RawEnvConfig, rawEnvSchema } from './schema';

// =============================================================================
// Environment Parsing
// =============================================================================

/**
 * Get raw environment values from Astro's import.meta.env
 * Astro exposes env vars on import.meta.env with PUBLIC_ prefix for client-side
 */
function getRawEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: import.meta.env.MODE === 'production' ? 'production' : 'development',
    MODE: import.meta.env.MODE,
    PUBLIC_HOME_URL: import.meta.env.PUBLIC_HOME_URL,
    PUBLIC_DASH_URL: import.meta.env.PUBLIC_DASH_URL,
    PUBLIC_CDN_DOMAIN: import.meta.env.PUBLIC_CDN_DOMAIN,
    PUBLIC_ASSETS_DOMAIN: import.meta.env.PUBLIC_ASSETS_DOMAIN,
    PUBLIC_CLOUDFLARE_IMAGE_ZONE: import.meta.env.PUBLIC_CLOUDFLARE_IMAGE_ZONE,
    PUBLIC_SKIP_IMAGE_TRANSFORM: import.meta.env.PUBLIC_SKIP_IMAGE_TRANSFORM,
  };
}

/**
 * Parse and validate environment variables using Zod schema
 */
function parseEnv(): RawEnvConfig {
  const rawEnv = getRawEnv();
  const result = rawEnvSchema.safeParse(rawEnv);

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
  return error.issues
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
  return {
    nodeEnv: raw.NODE_ENV,
    appEnv: raw.MODE,
    home: {
      url: raw.PUBLIC_HOME_URL,
    },
    dashboard: {
      url: raw.PUBLIC_DASH_URL,
    },
    storage: {
      cdnDomain: raw.PUBLIC_CDN_DOMAIN,
      assetsDomain: raw.PUBLIC_ASSETS_DOMAIN,
      imageZone: raw.PUBLIC_CLOUDFLARE_IMAGE_ZONE,
      skipTransform: raw.PUBLIC_SKIP_IMAGE_TRANSFORM,
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
