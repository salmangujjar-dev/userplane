/**
 * Environment configuration and validation for recorder
 * Centralizes all environment variable access with type safety and validation
 *
 * Types are inferred from Zod schemas in schema.ts to ensure consistency.
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
 * Explicitly reference each NEXT_PUBLIC_* env var so that the Next.js compiler
 * can inline them at build time. Passing process.env as a whole object does not
 * trigger static replacement, which causes client-side code to see undefined
 * for every NEXT_PUBLIC_* key and fall back to defaults.
 *
 * Server-only vars (no NEXT_PUBLIC_ prefix) are fine with process.env because
 * they are read at runtime on the server where process.env is a real object.
 */
function getExplicitEnv(): Record<string, string | undefined> {
  return {
    // App
    APP_ENV: process.env.APP_ENV,

    // API
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,

    // Storage
    NEXT_PUBLIC_CDN_DOMAIN: process.env.NEXT_PUBLIC_CDN_DOMAIN,
    NEXT_PUBLIC_ASSETS_DOMAIN: process.env.NEXT_PUBLIC_ASSETS_DOMAIN,
    NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE: process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE,
    NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM: process.env.NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM,

    // PostHog
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}

/**
 * Parse and validate environment variables using Zod schema
 */
function parseEnv(): RawEnvConfig {
  const result = rawEnvSchema.safeParse(getExplicitEnv());

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
    .map((issue) => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
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
    appEnv: raw.APP_ENV,
    api: {
      url: raw.NEXT_PUBLIC_API_URL,
    },
    storage: {
      cdnDomain: raw.NEXT_PUBLIC_CDN_DOMAIN,
      assetsDomain: raw.NEXT_PUBLIC_ASSETS_DOMAIN,
      imageZone: raw.NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE,
      skipTransform: raw.NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM,
    },
    posthog: {
      apiKey: raw.NEXT_PUBLIC_POSTHOG_KEY,
      host: raw.NEXT_PUBLIC_POSTHOG_HOST,
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
