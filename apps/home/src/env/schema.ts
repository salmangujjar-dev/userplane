/**
 * Environment configuration Zod schemas for home/marketing site
 * Defines the shape and validation rules for all environment variables
 * Types are inferred from schemas to ensure consistency
 *
 * Note: This app uses Astro with import.meta.env (PUBLIC_ prefix)
 */
import { z } from 'zod';

import { DEV_URLS, STORAGE } from './defaults';

// =============================================================================
// Parse Utilities
// =============================================================================

/**
 * String with default value
 */
const stringWithDefault = (defaultValue: string) =>
  z
    .string()
    .optional()
    .transform((val): string => val || defaultValue);

/**
 * URL with default value (validates the default and any provided value)
 */
const urlWithDefault = (defaultValue: string) =>
  z
    .string()
    .optional()
    .transform((val): string => val || defaultValue)
    .pipe(z.string().url());

/**
 * Boolean from string with default value
 */
const booleanWithDefault = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((val): boolean => {
      if (!val) return defaultValue;
      return val.toLowerCase() === 'true';
    });

// =============================================================================
// Raw Environment Variable Schemas (for parsing import.meta.env)
// =============================================================================

/** App env vars schema */
export const appEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Astro uses MODE from --mode flag
  MODE: z.enum(['development', 'production']).default('development'),
});

/** URL env vars schema */
export const urlEnvSchema = z.object({
  PUBLIC_HOME_URL: urlWithDefault(DEV_URLS.HOME),
  PUBLIC_DASH_URL: urlWithDefault(DEV_URLS.DASH),
});

/** Storage env vars schema */
export const storageEnvSchema = z.object({
  PUBLIC_CDN_DOMAIN: urlWithDefault(DEV_URLS.CDN),
  PUBLIC_ASSETS_DOMAIN: urlWithDefault(DEV_URLS.ASSETS),
  PUBLIC_CLOUDFLARE_IMAGE_ZONE: stringWithDefault(STORAGE.IMAGE_ZONE),
  PUBLIC_SKIP_IMAGE_TRANSFORM: booleanWithDefault(false),
});

/** Combined raw environment variables schema */
export const rawEnvSchema = appEnvSchema.merge(urlEnvSchema).merge(storageEnvSchema);

/** Raw parsed environment type */
export type RawEnvConfig = z.infer<typeof rawEnvSchema>;

// =============================================================================
// Structured Configuration Schemas (for application use)
// =============================================================================

/** Home configuration schema */
export const homeConfigSchema = z.object({
  url: z.string().url(),
});

/** Dashboard configuration schema */
export const dashboardConfigSchema = z.object({
  url: z.string().url(),
});

/** Storage configuration schema */
export const storageConfigSchema = z.object({
  cdnDomain: z.string().url(),
  assetsDomain: z.string().url(),
  imageZone: z.string(),
  skipTransform: z.boolean(),
});

/** Complete environment configuration schema */
export const envConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']),
  appEnv: z.enum(['development', 'production']),
  home: homeConfigSchema,
  dashboard: dashboardConfigSchema,
  storage: storageConfigSchema,
});

// =============================================================================
// Inferred Types (pinned to schemas)
// =============================================================================

export type HomeConfig = z.infer<typeof homeConfigSchema>;
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type EnvConfig = z.infer<typeof envConfigSchema>;
