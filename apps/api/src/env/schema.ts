/**
 * Environment configuration Zod schemas
 * Defines the shape and validation rules for all environment variables
 * Types are inferred from schemas to ensure consistency
 */
import { z } from 'zod';

import {
  AUTH,
  BILLING,
  CACHE,
  CORS,
  DEV_SECRETS,
  DEV_URLS,
  EMAIL,
  INNGEST,
  PAYMENTS,
  POSTHOG,
  RATE_LIMIT,
  RESTORATION,
  SERVER,
  SESSION,
  STORAGE,
  SUPPORT,
  TOKEN_EXPIRY,
} from './defaults';
import {
  booleanWithDefault,
  commaSeparatedArray,
  commaSeparatedUrls,
  emailWithDefault,
  integerWithDefault,
  requiredString,
  requiredUrl,
  stringWithDefault,
  urlWithDefault,
} from './parse';

// =============================================================================
// Raw Environment Variable Schemas (for parsing process.env)
// =============================================================================

/** Server env vars schema */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['development', 'production']).default('development'),
  PORT: integerWithDefault(SERVER.PORT),
  HOST: stringWithDefault(SERVER.HOST),
  /** Shared secret for server-to-server calls (dashboard → API) */
  INTERNAL_API_KEY: z.string().optional().default(''),
});

/** CORS env vars schema */
export const corsEnvSchema = z.object({
  CORS_ORIGINS: commaSeparatedUrls([...CORS.ORIGINS]),
  CORS_CREDENTIALS: booleanWithDefault(CORS.CREDENTIALS),
  CORS_MAX_AGE: integerWithDefault(CORS.MAX_AGE),
});

/** Auth env vars schema */
export const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: stringWithDefault(DEV_SECRETS.AUTH),
  BETTER_AUTH_URL: urlWithDefault(DEV_URLS.API),
  BETTER_AUTH_COOKIE_PREFIX: stringWithDefault(AUTH.COOKIE_PREFIX),
  BETTER_AUTH_COOKIE_DOMAIN: requiredString('BETTER_AUTH_COOKIE_DOMAIN'),
  JWT_ISSUER: stringWithDefault(AUTH.JWT_ISSUER),
});

/** Google OAuth env vars schema */
export const googleEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: urlWithDefault(`${DEV_URLS.API}${AUTH.GOOGLE_REDIRECT_PATH}`),
});

/** Intercom OAuth env vars schema */
export const intercomEnvSchema = z.object({
  INTERCOM_CLIENT_ID: z.string().optional().default(''),
  INTERCOM_CLIENT_SECRET: z.string().optional().default(''),
  INTERCOM_REDIRECT_URI: urlWithDefault(`${DEV_URLS.DASH}${AUTH.INTERCOM_REDIRECT_PATH}`),
});

/**
 * Zendesk OAuth env vars schema
 *
 * "Outbound" OAuth (Userplane → Zendesk):
 * We are the CLIENT. We redirect admins to Zendesk to authorize us.
 * Gives us a Zendesk access_token to call Zendesk APIs on their behalf.
 */
export const zendeskEnvSchema = z.object({
  /** Our client ID registered with Zendesk (zdg-* prefix) */
  ZENDESK_CLIENT_ID: z.string().optional().default(''),
  /** Our client secret from Zendesk OAuth client config */
  ZENDESK_CLIENT_SECRET: z.string().optional().default(''),
  /** Where Zendesk redirects back after admin authorizes us */
  ZENDESK_REDIRECT_URI: urlWithDefault(`${DEV_URLS.DASH}${AUTH.ZENDESK_REDIRECT_PATH}`),
  /** Shared secret for Zendesk App JWT auth (HS256). Set as Zendesk secure setting during OAuth. */
  ZENDESK_JWT_SECRET: z.string().optional().default('zendesk-jwt-secret-dev-only'),
});

/** Dashboard env vars schema */
export const dashboardEnvSchema = z.object({
  INVITE_APP_URL: urlWithDefault(DEV_URLS.DASH),
});

/** Billing env vars schema */
export const billingEnvSchema = z.object({
  TRIAL_PERIOD_DAYS: integerWithDefault(BILLING.TRIAL_PERIOD_DAYS),
});

/** Payments env vars schema */
export const paymentsEnvSchema = z.object({
  DODO_PAYMENTS_API_KEY: requiredString('DODO_PAYMENTS_API_KEY'),
  DODO_PAYMENTS_WEBHOOK_SECRET: requiredString('DODO_PAYMENTS_WEBHOOK_SECRET'),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default(PAYMENTS.ENVIRONMENT),
  DODO_ADD_ON_SEATS_MONTHLY: z.string().optional().default(''),
  DODO_ADD_ON_SEATS_ANNUAL: z.string().optional().default(''),
});

/** Token env vars schema */
export const tokenEnvSchema = z.object({
  INVITE_TOKEN_SECRET: stringWithDefault(DEV_SECRETS.INVITE),
  INVITE_TOKEN_EXPIRES_IN: integerWithDefault(TOKEN_EXPIRY.INVITE),
  DOMAIN_VERIFICATION_TOKEN_SECRET: stringWithDefault(DEV_SECRETS.DOMAIN_VERIFICATION),
  DOMAIN_VERIFICATION_TOKEN_EXPIRES_IN: integerWithDefault(TOKEN_EXPIRY.DOMAIN_VERIFICATION),
  ACCESS_REQUEST_TOKEN_EXPIRES_IN: integerWithDefault(TOKEN_EXPIRY.ACCESS_REQUEST),
  WORKSPACE_CREATE_INVITE_TOKEN_EXPIRES_IN: integerWithDefault(
    TOKEN_EXPIRY.WORKSPACE_CREATE_INVITE
  ),
  RECORDER_TOKEN_SECRET: stringWithDefault(DEV_SECRETS.RECORDER),
  RECORDER_TOKEN_EXPIRES_IN: integerWithDefault(TOKEN_EXPIRY.RECORDING),
  SHARE_TOKEN_SECRET: stringWithDefault(DEV_SECRETS.SHARE),
  SHARE_TOKEN_EXPIRES_IN: integerWithDefault(TOKEN_EXPIRY.SHARE),
  SHARE_TOKEN_MAX_EXPIRES_IN: integerWithDefault(TOKEN_EXPIRY.SHARE_MAX),
});

/** Session env vars schema */
export const sessionEnvSchema = z.object({
  SESSION_TOKEN_SECRET: stringWithDefault(DEV_SECRETS.SESSION),
  UPLOAD_TOKEN_SECRET: stringWithDefault(DEV_SECRETS.UPLOAD),
  SESSION_TOKEN_EXPIRY: integerWithDefault(SESSION.TOKEN_EXPIRY),
  UPLOAD_TOKEN_EXPIRY: integerWithDefault(SESSION.UPLOAD_TOKEN_EXPIRY),
  PRESIGNED_URL_EXPIRY: integerWithDefault(SESSION.PRESIGNED_URL_EXPIRY),
});

/** Database env vars schema */
export const databaseEnvSchema = z.object({
  DATABASE_URL: requiredString('DATABASE_URL'),
});

/** Recorder env vars schema */
export const recorderEnvSchema = z.object({
  RECORDER_URL: urlWithDefault(DEV_URLS.RECORDER),
});

/** Support env vars schema */
export const supportEnvSchema = z.object({
  DOCS_URL: urlWithDefault(DEV_URLS.DOCS),
  SUPPORT_EMAIL: emailWithDefault(SUPPORT.EMAIL),
  CALENDAR_URL: urlWithDefault(DEV_URLS.CALENDAR),
});

/** Email env vars schema */
export const emailEnvSchema = z.object({
  EMAIL_PROVIDER: z.enum(['localhost', 'resend']).default(EMAIL.PROVIDER),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  EMAIL_ONBOARDING_INBOX: emailWithDefault(EMAIL.INBOXES.ONBOARDING),
  EMAIL_NOTIFICATION_INBOX: emailWithDefault(EMAIL.INBOXES.NOTIFICATION),
  EMAIL_BILLING_INBOX: emailWithDefault(EMAIL.INBOXES.BILLING),
  EMAIL_INVITE_INBOX: emailWithDefault(EMAIL.INBOXES.INVITE),
  EMAIL_AUTH_INBOX: emailWithDefault(EMAIL.INBOXES.AUTH),
});

/** Rate limit env vars schema */
export const rateLimitEnvSchema = z.object({
  RATE_LIMIT_ENABLED: booleanWithDefault(RATE_LIMIT.ENABLED),
  RATE_LIMIT_WINDOW: integerWithDefault(RATE_LIMIT.WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: integerWithDefault(RATE_LIMIT.MAX_REQUESTS),
});

/** Redis env vars schema */
export const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: requiredUrl('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: requiredString('UPSTASH_REDIS_REST_TOKEN'),
});

/** Cache env vars schema */
export const cacheEnvSchema = z.object({
  CACHE_ENABLED: booleanWithDefault(CACHE.ENABLED),
});

/** Inngest env vars schema */
export const inngestEnvSchema = z.object({
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  WORKSPACE_SWEEP_LOOKBACK_DAYS: integerWithDefault(INNGEST.WORKSPACE_SWEEP_LOOKBACK_DAYS),
  WORKSPACE_SWEEP_CRON_SCHEDULE: stringWithDefault(INNGEST.CRON_SCHEDULE),
  PROJECT_SWEEP_LOOKBACK_DAYS: integerWithDefault(INNGEST.PROJECT_SWEEP_LOOKBACK_DAYS),
  PROJECT_SWEEP_CRON_SCHEDULE: stringWithDefault(INNGEST.CRON_SCHEDULE),
  RECORDING_SWEEP_LOOKBACK_DAYS: integerWithDefault(INNGEST.RECORDING_SWEEP_LOOKBACK_DAYS),
  RECORDING_SWEEP_CRON_SCHEDULE: stringWithDefault(INNGEST.CRON_SCHEDULE),
  WORKSPACE_RESTORATION_WINDOW_DAYS: integerWithDefault(INNGEST.WORKSPACE_RESTORATION_WINDOW_DAYS),
  PROJECT_RESTORATION_WINDOW_DAYS: integerWithDefault(INNGEST.PROJECT_RESTORATION_WINDOW_DAYS),
  EXPIRED_RECORDING_SWEEP_CRON_SCHEDULE: stringWithDefault(
    INNGEST.EXPIRED_RECORDING_SWEEP_CRON_SCHEDULE
  ),
});

/** Restoration env vars schema */
export const restorationEnvSchema = z.object({
  RESTORATION_GRACE_PERIOD_DAYS: integerWithDefault(RESTORATION.GRACE_PERIOD_DAYS),
  RESTORATION_MAX_WINDOW_DAYS: integerWithDefault(RESTORATION.MAX_WINDOW_DAYS),
});

/** Storage env vars schema */
export const storageEnvSchema = z.object({
  ASSETS_DOMAIN: requiredUrl('ASSETS_DOMAIN'),
  CDN_DOMAIN: requiredUrl('CDN_DOMAIN'),
  CLOUDFLARE_IMAGE_ZONE: stringWithDefault(STORAGE.IMAGE_ZONE),
  SKIP_IMAGE_TRANSFORM: booleanWithDefault(false),
  // CDN bucket
  R2_CDN_ACCOUNT_ID: requiredString('R2_CDN_ACCOUNT_ID'),
  R2_CDN_ACCESS_KEY_ID: requiredString('R2_CDN_ACCESS_KEY_ID'),
  R2_CDN_SECRET_ACCESS_KEY: requiredString('R2_CDN_SECRET_ACCESS_KEY'),
  R2_CDN_BUCKET_NAME: requiredString('R2_CDN_BUCKET_NAME'),
  // Assets bucket
  R2_ASSETS_ACCOUNT_ID: requiredString('R2_ASSETS_ACCOUNT_ID'),
  R2_ASSETS_ACCESS_KEY_ID: requiredString('R2_ASSETS_ACCESS_KEY_ID'),
  R2_ASSETS_SECRET_ACCESS_KEY: requiredString('R2_ASSETS_SECRET_ACCESS_KEY'),
  R2_ASSETS_BUCKET_NAME: requiredString('R2_ASSETS_BUCKET_NAME'),
  // Reports bucket
  R2_REPORTS_ACCOUNT_ID: requiredString('R2_REPORTS_ACCOUNT_ID'),
  R2_REPORTS_ACCESS_KEY_ID: requiredString('R2_REPORTS_ACCESS_KEY_ID'),
  R2_REPORTS_SECRET_ACCESS_KEY: requiredString('R2_REPORTS_SECRET_ACCESS_KEY'),
  R2_REPORTS_BUCKET_NAME: requiredString('R2_REPORTS_BUCKET_NAME'),
});

/** PostHog env vars schema */
export const posthogEnvSchema = z.object({
  POSTHOG_PROJECT_API_KEY: z.string().optional(),
  POSTHOG_HOST: stringWithDefault(POSTHOG.HOST),
  POSTHOG_PERSONAL_API_KEY: z.string().optional(),
  POSTHOG_PROJECT_ID: z.string().optional(),
  POSTHOG_FEATURE_FLAGS_KEY: z.string().optional(),
});

/** Admin env vars schema */
export const adminEnvSchema = z.object({
  ADMIN_USER_IDS: commaSeparatedArray([]),
});

/** Combined raw environment variables schema */
export const rawEnvSchema = serverEnvSchema
  .merge(corsEnvSchema)
  .merge(authEnvSchema)
  .merge(googleEnvSchema)
  .merge(intercomEnvSchema)
  .merge(zendeskEnvSchema)
  .merge(dashboardEnvSchema)
  .merge(billingEnvSchema)
  .merge(paymentsEnvSchema)
  .merge(tokenEnvSchema)
  .merge(sessionEnvSchema)
  .merge(databaseEnvSchema)
  .merge(recorderEnvSchema)
  .merge(supportEnvSchema)
  .merge(emailEnvSchema)
  .merge(rateLimitEnvSchema)
  .merge(redisEnvSchema)
  .merge(cacheEnvSchema)
  .merge(inngestEnvSchema)
  .merge(restorationEnvSchema)
  .merge(storageEnvSchema)
  .merge(posthogEnvSchema)
  .merge(adminEnvSchema);

/** Raw parsed environment type */
export type RawEnvConfig = z.infer<typeof rawEnvSchema>;

// =============================================================================
// Structured Configuration Schemas (for application use)
// =============================================================================

/** Server configuration schema */
export const serverConfigSchema = z.object({
  port: z.number(),
  host: z.string(),
  nodeEnv: z.enum(['development', 'production', 'test']),
  appEnv: z.enum(['development', 'production']),
  /** Shared secret for server-to-server API calls (e.g. dashboard → API) */
  internalApiKey: z.string().optional().default(''),
});

/** CORS configuration schema */
export const corsConfigSchema = z.object({
  origins: z.array(z.string().url()),
  credentials: z.boolean(),
  maxAge: z.number(),
});

/** Auth configuration schema */
export const authConfigSchema = z.object({
  secret: z.string(),
  url: z.string().url(),
  cookiePrefix: z.string(),
  cookieDomain: z.string(),
  jwtIssuer: z.string(),
});

/** OAuth provider configuration schema */
export const oauthConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string().url().or(z.literal('')),
});

/** Dashboard configuration schema */
export const dashboardConfigSchema = z.object({
  baseUrl: z.string().url(),
});

/** Billing configuration schema */
export const billingConfigSchema = z.object({
  trialPeriodDays: z.number(),
});

/** Payments configuration schema */
export const paymentsConfigSchema = z.object({
  apiKey: z.string(),
  webhookSecret: z.string(),
  environment: z.enum(['test_mode', 'live_mode']),
  addons: z.object({
    seatsMonthly: z.string(),
    seatsAnnual: z.string(),
  }),
});

/** Token configuration schema */
export const tokenConfigSchema = z.object({
  inviteSecret: z.string(),
  inviteExpiresIn: z.number(),
  domainVerificationSecret: z.string(),
  domainVerificationExpiresIn: z.number(),
  accessRequestExpiresIn: z.number(),
  workspaceCreateInviteExpiresIn: z.number(),
  recordingSecret: z.string(),
  recordingTokenExpiresIn: z.number(),
  shareSecret: z.string(),
  shareExpiresIn: z.number(),
  shareMaxExpiresIn: z.number(),
});

/** Session configuration schema */
export const sessionConfigSchema = z.object({
  tokenSecret: z.string(),
  uploadTokenSecret: z.string(),
  tokenExpiry: z.number(),
  uploadTokenExpiry: z.number(),
  presignedUrlExpiry: z.number(),
});

/** Database configuration schema */
export const databaseConfigSchema = z.object({
  url: z.string(),
});

/** Recorder configuration schema */
export const recorderConfigSchema = z.object({
  baseUrl: z.string().url(),
});

/** Docs configuration schema */
export const docsConfigSchema = z.object({
  url: z.string().url(),
});

/** Support configuration schema */
export const supportConfigSchema = z.object({
  supportEmail: z.string().email(),
  calendarUrl: z.string().url(),
});

/** Email inboxes schema */
export const emailInboxesSchema = z.object({
  onboarding: z.string().email(),
  notification: z.string().email(),
  billing: z.string().email(),
  invite: z.string().email(),
  auth: z.string().email(),
});

/** Email configuration schema */
export const emailConfigSchema = z.object({
  provider: z.enum(['localhost', 'resend']),
  providerApiKey: z.string().optional(),
  inboxes: emailInboxesSchema,
});

/** Rate limit configuration schema */
export const rateLimitConfigSchema = z.object({
  enabled: z.boolean(),
  windowMs: z.number(),
  maxRequests: z.number(),
});

/** Redis configuration schema */
export const redisConfigSchema = z.object({
  url: z.string().url(),
  token: z.string(),
});

/** Cache configuration schema */
export const cacheConfigSchema = z.object({
  enabled: z.boolean(),
});

/** Inngest configuration schema */
export const inngestConfigSchema = z.object({
  signingKey: z.string().optional(),
  eventKey: z.string().optional(),
  workspaceSweepLookbackDays: z.number(),
  workspaceSweepCronSchedule: z.string(),
  projectSweepLookbackDays: z.number(),
  projectSweepCronSchedule: z.string(),
  recordingSweepLookbackDays: z.number(),
  recordingSweepCronSchedule: z.string(),
  workspaceRestorationWindowDays: z.number(),
  projectRestorationWindowDays: z.number(),
  expiredRecordingSweepCronSchedule: z.string(),
});

/** Restoration configuration schema */
export const restorationConfigSchema = z.object({
  gracePeriodDays: z.number(),
  maxWindowDays: z.number(),
});

/** Bucket credentials schema */
export const bucketCredentialsSchema = z.object({
  accountId: z.string(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  bucketName: z.string(),
});

/** Storage configuration schema */
export const storageConfigSchema = z.object({
  assetsDomain: z.string().url(),
  cdnDomain: z.string().url(),
  imageZone: z.string(),
  skipTransform: z.boolean(),
  cdn: bucketCredentialsSchema,
  assets: bucketCredentialsSchema,
  reports: bucketCredentialsSchema,
});

/** PostHog configuration schema */
export const posthogConfigSchema = z.object({
  apiKey: z.string().optional(),
  host: z.string(),
  personalApiKey: z.string().optional(),
  projectId: z.string().optional(),
  featureFlagsKey: z.string().optional(),
});

/** Admin configuration schema */
export const adminConfigSchema = z.object({
  userIds: z.array(z.string()),
});

/** Complete environment configuration schema */
export const envConfigSchema = z.object({
  server: serverConfigSchema,
  cors: corsConfigSchema,
  auth: authConfigSchema,
  google: oauthConfigSchema,
  intercom: oauthConfigSchema,
  zendesk: oauthConfigSchema.extend({
    jwtSecret: z.string(),
  }),
  dashboard: dashboardConfigSchema,
  billing: billingConfigSchema,
  payments: paymentsConfigSchema,
  token: tokenConfigSchema,
  session: sessionConfigSchema,
  database: databaseConfigSchema,
  recorder: recorderConfigSchema,
  docs: docsConfigSchema,
  support: supportConfigSchema,
  email: emailConfigSchema,
  rateLimit: rateLimitConfigSchema,
  redis: redisConfigSchema,
  cache: cacheConfigSchema,
  inngest: inngestConfigSchema,
  restoration: restorationConfigSchema,
  storage: storageConfigSchema,
  posthog: posthogConfigSchema,
  admin: adminConfigSchema,
});

// =============================================================================
// Inferred Types (pinned to schemas)
// =============================================================================

export type ServerConfig = z.infer<typeof serverConfigSchema>;
export type CorsConfig = z.infer<typeof corsConfigSchema>;
export type AuthConfig = z.infer<typeof authConfigSchema>;
export type OAuthConfig = z.infer<typeof oauthConfigSchema>;
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
export type BillingConfig = z.infer<typeof billingConfigSchema>;
export type PaymentsConfig = z.infer<typeof paymentsConfigSchema>;
export type TokenConfig = z.infer<typeof tokenConfigSchema>;
export type SessionConfig = z.infer<typeof sessionConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type RecorderConfig = z.infer<typeof recorderConfigSchema>;
export type DocsConfig = z.infer<typeof docsConfigSchema>;
export type SupportConfig = z.infer<typeof supportConfigSchema>;
export type EmailInboxes = z.infer<typeof emailInboxesSchema>;
export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;
export type RedisConfig = z.infer<typeof redisConfigSchema>;
export type CacheConfig = z.infer<typeof cacheConfigSchema>;
export type InngestConfig = z.infer<typeof inngestConfigSchema>;
export type RestorationConfig = z.infer<typeof restorationConfigSchema>;
export type BucketCredentials = z.infer<typeof bucketCredentialsSchema>;
export type StorageConfig = z.infer<typeof storageConfigSchema>;
export type PostHogConfig = z.infer<typeof posthogConfigSchema>;
export type AdminConfig = z.infer<typeof adminConfigSchema>;
export type EnvConfig = z.infer<typeof envConfigSchema>;
