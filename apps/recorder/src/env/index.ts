/**
 * Environment configuration and validation for recorder
 * Centralizes all environment variable access with type safety and validation
 *
 * Types are inferred from Zod schemas in schema.ts to ensure consistency.
 *
 * Note: This app uses Astro with import.meta.env (PUBLIC_ prefix)
 */
import { ZodError } from 'zod';

import {
  type ApiConfig,
  type EnvConfig,
  type PostHogConfig,
  type RawEnvConfig,
  rawEnvSchema,
  type StorageConfig,
} from './schema';

// Re-export types for external use
export type { ApiConfig, EnvConfig, PostHogConfig, StorageConfig };

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
    PUBLIC_API_URL: import.meta.env.PUBLIC_API_URL,
    PUBLIC_CDN_DOMAIN: import.meta.env.PUBLIC_CDN_DOMAIN,
    PUBLIC_ASSETS_DOMAIN: import.meta.env.PUBLIC_ASSETS_DOMAIN,
    PUBLIC_CLOUDFLARE_IMAGE_ZONE: import.meta.env.PUBLIC_CLOUDFLARE_IMAGE_ZONE,
    PUBLIC_SKIP_IMAGE_TRANSFORM: import.meta.env.PUBLIC_SKIP_IMAGE_TRANSFORM,
    PUBLIC_POSTHOG_KEY: import.meta.env.PUBLIC_POSTHOG_KEY,
    PUBLIC_POSTHOG_HOST: import.meta.env.PUBLIC_POSTHOG_HOST,
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
  return error.errors
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
    api: {
      url: raw.PUBLIC_API_URL,
    },
    storage: {
      cdnDomain: raw.PUBLIC_CDN_DOMAIN,
      assetsDomain: raw.PUBLIC_ASSETS_DOMAIN,
      imageZone: raw.PUBLIC_CLOUDFLARE_IMAGE_ZONE,
      skipTransform: raw.PUBLIC_SKIP_IMAGE_TRANSFORM,
    },
    posthog: {
      apiKey: raw.PUBLIC_POSTHOG_KEY,
      host: raw.PUBLIC_POSTHOG_HOST,
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
