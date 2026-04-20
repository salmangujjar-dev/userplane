/**
 * Environment configuration Zod schemas for dashboard
 * Defines the shape and validation rules for all environment variables
 * Types are inferred from schemas to ensure consistency
 */
import { z } from 'zod';

import { AUTH, DEV_URLS, DOCS_URL, POSTHOG, STORAGE, ZENDESK_MARKETPLACE } from './defaults';

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
 * Boolean with default value
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
// Raw Environment Variable Schemas (for parsing process.env)
// =============================================================================

/** App env vars schema */
export const appEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'production']).default('development'),
});

/** URL env vars schema */
export const urlEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: urlWithDefault(DEV_URLS.API),
  NEXT_PUBLIC_DASHBOARD_URL: urlWithDefault(DEV_URLS.DASH),
  NEXT_PUBLIC_HOME_URL: urlWithDefault(DEV_URLS.HOME),
  NEXT_PUBLIC_RECORDER_URL: urlWithDefault(DEV_URLS.RECORDER),
  NEXT_PUBLIC_CDN_DOMAIN: urlWithDefault(DEV_URLS.CDN),
  NEXT_PUBLIC_ASSETS_DOMAIN: urlWithDefault(DEV_URLS.ASSETS),
  NEXT_PUBLIC_DOCS_URL: urlWithDefault(DOCS_URL),
});

/** Auth env vars schema */
export const authEnvSchema = z.object({
  NEXT_PUBLIC_AUTH_COOKIE_PREFIX: stringWithDefault(AUTH.COOKIE_PREFIX),
});

/** Storage env vars schema */
export const storageEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE: stringWithDefault(STORAGE.IMAGE_ZONE),
  NEXT_PUBLIC_SKIP_IMAGE_TRANSFORM: booleanWithDefault(false),
});

/** PostHog env vars schema */
export const posthogEnvSchema = z.object({
  NEXT_PUBLIC_POSTHOG_KEY: z
    .string()
    .optional()
    .transform((val): string | undefined => val || undefined),
  NEXT_PUBLIC_POSTHOG_HOST: stringWithDefault(POSTHOG.HOST),
});

/** Zendesk Marketplace env vars schema */
export const zendeskMarketplaceEnvSchema = z.object({
  NEXT_PUBLIC_ZENDESK_MARKETPLACE_APP_URL: urlWithDefault(ZENDESK_MARKETPLACE.APP_URL),
  NEXT_PUBLIC_ZENDESK_MARKETPLACE_LIVE: booleanWithDefault(ZENDESK_MARKETPLACE.LIVE),
});

/** Combined raw environment variables schema */
export const rawEnvSchema = appEnvSchema
  .merge(urlEnvSchema)
  .merge(authEnvSchema)
  .merge(storageEnvSchema)
  .merge(posthogEnvSchema)
  .merge(zendeskMarketplaceEnvSchema);

/** Raw parsed environment type */
export type RawEnvConfig = z.infer<typeof rawEnvSchema>;

// =============================================================================
// Structured Configuration Schemas (for application use)
// =============================================================================

/** API configuration schema */
export const apiConfigSchema = z.object({
  url: z.string().url(),
});

/** Dashboard configuration schema */
export const dashboardConfigSchema = z.object({
  url: z.string().url(),
});

/** Home configuration schema */
export const homeConfigSchema = z.object({
  url: z.string().url(),
});

/** Recorder configuration schema */
export const recorderConfigSchema = z.object({
  url: z.string().url(),
});

/** Auth configuration schema */
export const authConfigSchema = z.object({
  cookiePrefix: z.string(),
});

/** Storage configuration schema */
export const storageConfigSchema = z.object({
  cdnDomain: z.string().url(),
  assetsDomain: z.string().url(),
  imageZone: z.string(),
  skipTransform: z.boolean(),
});

/** PostHog configuration schema */
export const posthogConfigSchema = z.object({
  apiKey: z.string().optional(),
  host: z.string().url(),
});

/** Docs configuration schema */
export const docsConfigSchema = z.object({
  url: z.string().url(),
});

/** Zendesk configuration schema */
export const zendeskConfigSchema = z.object({
  marketplace: z.object({
    appUrl: z.string().url(),
    live: z.boolean(),
  }),
});

/** Complete environment configuration schema */
export const envConfigSchema = z.object({
  appEnv: z.enum(['development', 'production']),
  useSecureCookies: z.boolean(),
  api: apiConfigSchema,
  dashboard: dashboardConfigSchema,
  home: homeConfigSchema,
  recorder: recorderConfigSchema,
  auth: authConfigSchema,
  storage: storageConfigSchema,
  posthog: posthogConfigSchema,
  docs: docsConfigSchema,
  zendesk: zendeskConfigSchema,
});

// =============================================================================
// Inferred Types (pinned to schemas)
// =============================================================================

export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
export type HomeConfig = z.infer<typeof homeConfigSchema>;
export type RecorderConfig = z.infer<typeof recorderConfigSchema>;
export type AuthConfig = z.infer<typeof authConfigSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type PostHogConfig = z.infer<typeof posthogConfigSchema>;
export type DocsConfig = z.infer<typeof docsConfigSchema>;
export type ZendeskConfig = z.infer<typeof zendeskConfigSchema>;
export type EnvConfig = z.infer<typeof envConfigSchema>;
