/**
 * Environment configuration and validation
 * Centralizes all environment variable access with type safety and validation
 *
 * Types are inferred from Zod schemas in schema.ts to ensure consistency.
 */
import { createServerLogger, type LogLevel } from '@userplane/common-logger';
import { parseAppEnv } from '@userplane/shared/env';
import { ZodError } from 'zod';

import { DEV_SECRETS } from './defaults';
import {
  type AdminConfig,
  type AuthConfig,
  type BillingConfig,
  type BodyLimitConfig,
  type BucketCredentials,
  type CacheConfig,
  type CorsConfig,
  type DashboardConfig,
  type DatabaseConfig,
  type DocsConfig,
  type EmailConfig,
  type EmailInboxes,
  type EnvConfig,
  type InngestConfig,
  type McpConfig,
  type OAuthConfig,
  type PaymentsConfig,
  type PostHogConfig,
  type RateLimitConfig,
  type RawEnvConfig,
  rawEnvSchema,
  type RecorderConfig,
  type RedisConfig,
  type RestorationConfig,
  type ServerConfig,
  type SessionConfig,
  type StorageConfig,
  type SupportConfig,
  type TokenConfig,
  type UnkeyConfig,
} from './schema';

// Re-export types for external use
export type {
  AdminConfig,
  AuthConfig,
  BillingConfig,
  BodyLimitConfig,
  BucketCredentials,
  CacheConfig,
  CorsConfig,
  DashboardConfig,
  DatabaseConfig,
  DocsConfig,
  EmailConfig,
  EmailInboxes,
  EnvConfig,
  InngestConfig,
  McpConfig,
  OAuthConfig,
  PaymentsConfig,
  PostHogConfig,
  RateLimitConfig,
  RecorderConfig,
  RedisConfig,
  RestorationConfig,
  ServerConfig,
  SessionConfig,
  StorageConfig,
  SupportConfig,
  TokenConfig,
  UnkeyConfig,
};

// =============================================================================
// Environment Parsing and Transformation
// =============================================================================

/**
 * Parse raw environment variables using Zod schema
 */
function parseEnv(): RawEnvConfig {
  const result = rawEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = formatZodErrors(result.error);
    throw new Error(`Environment configuration errors:\n${errors}`);
  }

  return result.data;
}

/**
 * Format Zod errors into readable messages
 */
function formatZodErrors(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Transform raw env vars into structured EnvConfig
 */
function transformEnvConfig(raw: RawEnvConfig): EnvConfig {
  return {
    server: {
      port: raw.PORT,
      host: raw.HOST,
      nodeEnv: raw.NODE_ENV,
      appEnv: parseAppEnv(raw.APP_ENV),
      internalApiKey: raw.INTERNAL_API_KEY,
    },
    cors: {
      origins: raw.CORS_ORIGINS,
      credentials: raw.CORS_CREDENTIALS,
      maxAge: raw.CORS_MAX_AGE,
    },
    auth: {
      secret: raw.BETTER_AUTH_SECRET,
      url: raw.BETTER_AUTH_URL,
      cookiePrefix: raw.BETTER_AUTH_COOKIE_PREFIX,
      cookieDomain: raw.BETTER_AUTH_COOKIE_DOMAIN,
      jwtIssuer: raw.JWT_ISSUER,
    },
    google: {
      clientId: raw.GOOGLE_CLIENT_ID,
      clientSecret: raw.GOOGLE_CLIENT_SECRET,
      redirectUri: raw.GOOGLE_REDIRECT_URI,
    },
    intercom: {
      clientId: raw.INTERCOM_CLIENT_ID,
      clientSecret: raw.INTERCOM_CLIENT_SECRET,
      redirectUri: raw.INTERCOM_REDIRECT_URI,
    },
    zendesk: {
      clientId: raw.ZENDESK_CLIENT_ID,
      clientSecret: raw.ZENDESK_CLIENT_SECRET,
      redirectUri: raw.ZENDESK_REDIRECT_URI,
      jwtSecret: raw.ZENDESK_JWT_SECRET,
    },
    slack: {
      clientId: raw.SLACK_CLIENT_ID,
      clientSecret: raw.SLACK_CLIENT_SECRET,
      redirectUri: raw.SLACK_REDIRECT_URI,
      signingSecret: raw.SLACK_SIGNING_SECRET,
    },
    dashboard: {
      baseUrl: raw.INVITE_APP_URL,
    },
    billing: {
      trialPeriodDays: raw.TRIAL_PERIOD_DAYS,
    },
    payments: {
      apiKey: raw.DODO_PAYMENTS_API_KEY,
      webhookSecret: raw.DODO_PAYMENTS_WEBHOOK_SECRET,
      environment: raw.DODO_PAYMENTS_ENVIRONMENT,
      addons: {
        seatsMonthly: raw.DODO_ADD_ON_SEATS_MONTHLY,
        seatsAnnual: raw.DODO_ADD_ON_SEATS_ANNUAL,
      },
    },
    token: {
      inviteSecret: raw.INVITE_TOKEN_SECRET,
      inviteExpiresIn: raw.INVITE_TOKEN_EXPIRES_IN,
      domainVerificationSecret: raw.DOMAIN_VERIFICATION_TOKEN_SECRET,
      domainVerificationExpiresIn: raw.DOMAIN_VERIFICATION_TOKEN_EXPIRES_IN,
      accessRequestExpiresIn: raw.ACCESS_REQUEST_TOKEN_EXPIRES_IN,
      workspaceCreateInviteExpiresIn: raw.WORKSPACE_CREATE_INVITE_TOKEN_EXPIRES_IN,
      recordingSecret: raw.RECORDER_TOKEN_SECRET,
      recordingTokenExpiresIn: raw.RECORDER_TOKEN_EXPIRES_IN,
      shareSecret: raw.SHARE_TOKEN_SECRET,
      shareExpiresIn: raw.SHARE_TOKEN_EXPIRES_IN,
      shareMaxExpiresIn: raw.SHARE_TOKEN_MAX_EXPIRES_IN,
    },
    session: {
      tokenSecret: raw.SESSION_TOKEN_SECRET,
      uploadTokenSecret: raw.UPLOAD_TOKEN_SECRET,
      tokenExpiry: raw.SESSION_TOKEN_EXPIRY,
      uploadTokenExpiry: raw.UPLOAD_TOKEN_EXPIRY,
      presignedUrlExpiry: raw.PRESIGNED_URL_EXPIRY,
    },
    database: {
      url: raw.DATABASE_URL,
    },
    recorder: {
      baseUrl: raw.RECORDER_URL,
    },
    docs: {
      url: raw.DOCS_URL,
    },
    support: {
      supportEmail: raw.SUPPORT_EMAIL,
      calendarUrl: raw.CALENDAR_URL,
    },
    email: {
      provider: raw.EMAIL_PROVIDER,
      providerApiKey: raw.EMAIL_PROVIDER_API_KEY,
      inboxes: {
        onboarding: raw.EMAIL_ONBOARDING_INBOX,
        notification: raw.EMAIL_NOTIFICATION_INBOX,
        billing: raw.EMAIL_BILLING_INBOX,
        invite: raw.EMAIL_INVITE_INBOX,
        auth: raw.EMAIL_AUTH_INBOX,
      },
    },
    rateLimit: {
      enabled: raw.RATE_LIMIT_ENABLED,
    },
    bodyLimit: {
      maxSizeBytes: raw.BODY_LIMIT_MAX_SIZE_BYTES,
      maxSizeLargeBytes: raw.BODY_LIMIT_MAX_SIZE_LARGE_BYTES,
    },
    redis: {
      url: raw.UPSTASH_REDIS_REST_URL,
      token: raw.UPSTASH_REDIS_REST_TOKEN,
    },
    cache: {
      enabled: raw.CACHE_ENABLED,
    },
    inngest: {
      signingKey: raw.INNGEST_SIGNING_KEY,
      eventKey: raw.INNGEST_EVENT_KEY,
      workspaceSweepLookbackDays: raw.WORKSPACE_SWEEP_LOOKBACK_DAYS,
      workspaceSweepCronSchedule: raw.WORKSPACE_SWEEP_CRON_SCHEDULE,
      projectSweepLookbackDays: raw.PROJECT_SWEEP_LOOKBACK_DAYS,
      projectSweepCronSchedule: raw.PROJECT_SWEEP_CRON_SCHEDULE,
      recordingSweepLookbackDays: raw.RECORDING_SWEEP_LOOKBACK_DAYS,
      recordingSweepCronSchedule: raw.RECORDING_SWEEP_CRON_SCHEDULE,
      workspaceRestorationWindowDays: raw.WORKSPACE_RESTORATION_WINDOW_DAYS,
      projectRestorationWindowDays: raw.PROJECT_RESTORATION_WINDOW_DAYS,
      expiredRecordingSweepCronSchedule: raw.EXPIRED_RECORDING_SWEEP_CRON_SCHEDULE,
    },
    restoration: {
      gracePeriodDays: raw.RESTORATION_GRACE_PERIOD_DAYS,
      maxWindowDays: raw.RESTORATION_MAX_WINDOW_DAYS,
    },
    storage: {
      assetsDomain: raw.ASSETS_DOMAIN,
      cdnDomain: raw.CDN_DOMAIN,
      imageZone: raw.CLOUDFLARE_IMAGE_ZONE,
      skipTransform: raw.SKIP_IMAGE_TRANSFORM,
      cdn: {
        accountId: raw.R2_CDN_ACCOUNT_ID,
        accessKeyId: raw.R2_CDN_ACCESS_KEY_ID,
        secretAccessKey: raw.R2_CDN_SECRET_ACCESS_KEY,
        bucketName: raw.R2_CDN_BUCKET_NAME,
      },
      assets: {
        accountId: raw.R2_ASSETS_ACCOUNT_ID,
        accessKeyId: raw.R2_ASSETS_ACCESS_KEY_ID,
        secretAccessKey: raw.R2_ASSETS_SECRET_ACCESS_KEY,
        bucketName: raw.R2_ASSETS_BUCKET_NAME,
      },
      reports: {
        accountId: raw.R2_REPORTS_ACCOUNT_ID,
        accessKeyId: raw.R2_REPORTS_ACCESS_KEY_ID,
        secretAccessKey: raw.R2_REPORTS_SECRET_ACCESS_KEY,
        bucketName: raw.R2_REPORTS_BUCKET_NAME,
      },
    },
    posthog: {
      apiKey: raw.POSTHOG_PROJECT_API_KEY,
      host: raw.POSTHOG_HOST,
      personalApiKey: raw.POSTHOG_PERSONAL_API_KEY,
      projectId: raw.POSTHOG_PROJECT_ID,
      featureFlagsKey: raw.POSTHOG_FEATURE_FLAGS_KEY,
    },
    admin: {
      userIds: raw.ADMIN_USER_IDS,
    },
    unkey: {
      rootKey: raw.UNKEY_ROOT_KEY,
      apiId: raw.UNKEY_API_ID,
      rateLimitPerMinute: raw.UNKEY_RATE_LIMIT_PER_MINUTE,
      rateLimitPerDay: raw.UNKEY_RATE_LIMIT_PER_DAY,
    },
    mcp: {
      rateLimit: {
        perIpPerMinute: raw.MCP_RATE_LIMIT_PER_IP_PER_MINUTE,
        perUserPerMinute: raw.MCP_RATE_LIMIT_PER_USER_PER_MINUTE,
        perUserPerDay: raw.MCP_RATE_LIMIT_PER_USER_PER_DAY,
      },
      openaiVerificationToken: raw.OPENAI_VERIFICATION_TOKEN,
    },
  };
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const raw = parseEnv();
  return transformEnvConfig(raw);
}

// =============================================================================
// Global Configuration Instance
// =============================================================================

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();

/**
 * Logger instance for environment configuration
 */
// Uses createServerLogger directly (not the app-local wrapper) to avoid
// a circular dependency: lib/logger imports env, so env cannot import lib/logger.
const isDev = env.server.nodeEnv !== 'production';
const logger = createServerLogger('env', {
  level: (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info'),
  pretty: isDev,
  base: { env: env.server.nodeEnv, appEnv: env.server.appEnv },
});

// =============================================================================
// Post-load Validation
// =============================================================================

/**
 * Validate secrets are not using development values in production
 */
function validateSecrets(config: EnvConfig): void {
  const isProduction = config.server.nodeEnv === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  const secretChecks = [
    { value: config.auth.secret, devValue: DEV_SECRETS.AUTH, envVar: 'BETTER_AUTH_SECRET' },
    {
      value: config.token.inviteSecret,
      devValue: DEV_SECRETS.INVITE,
      envVar: 'INVITE_TOKEN_SECRET',
    },
    {
      value: config.session.tokenSecret,
      devValue: DEV_SECRETS.SESSION,
      envVar: 'SESSION_TOKEN_SECRET',
    },
    {
      value: config.session.uploadTokenSecret,
      devValue: DEV_SECRETS.UPLOAD,
      envVar: 'UPLOAD_TOKEN_SECRET',
    },
    {
      value: config.token.domainVerificationSecret,
      devValue: DEV_SECRETS.DOMAIN_VERIFICATION,
      envVar: 'DOMAIN_VERIFICATION_TOKEN_SECRET',
    },
    {
      value: config.token.recordingSecret,
      devValue: DEV_SECRETS.RECORDER,
      envVar: 'RECORDER_TOKEN_SECRET',
    },
    {
      value: config.token.shareSecret,
      devValue: DEV_SECRETS.SHARE,
      envVar: 'SHARE_TOKEN_SECRET',
    },
    {
      value: config.zendesk.jwtSecret,
      devValue: DEV_SECRETS.ZENDESK_JWT,
      envVar: 'ZENDESK_JWT_SECRET',
    },
  ];

  for (const check of secretChecks) {
    if (check.value === check.devValue) {
      if (isProduction) {
        errors.push(`${check.envVar} must not use development value in production`);
      } else {
        warnings.push(`Using development secret for ${check.envVar}`);
      }
    }
  }

  // Production-only email validation
  if (isProduction) {
    if (config.email.provider !== 'localhost' && !config.email.providerApiKey) {
      errors.push('EMAIL_PROVIDER_API_KEY must be set when email provider is not localhost');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n  - ${errors.join('\n  - ')}`);
  }

  if (!isProduction && warnings.length > 0) {
    for (const warning of warnings) {
      logger.warn(warning);
    }
  }
}

// Run post-load validation
validateSecrets(env);

// =============================================================================
// Logging
// =============================================================================

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds: number): string {
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    return `${days}d`;
  }
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  }
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Get configuration status summary for logging
 */
function getConfigStatus(): {
  configured: string[];
  notConfigured: string[];
  usingDefaults: string[];
} {
  const configured: string[] = [];
  const notConfigured: string[] = [];
  const usingDefaults: string[] = [];

  // Core services (all required now)
  configured.push('Database');
  configured.push('Redis');
  configured.push('Payments');
  configured.push('Inngest');
  configured.push('Storage (CDN)');
  configured.push('Storage (Assets)');
  configured.push('Storage (Reports)');

  // Optional services
  if (env.google.clientId && env.google.clientSecret) configured.push('Google OAuth');
  else notConfigured.push('Google OAuth');

  if (env.intercom.clientId && env.intercom.clientSecret) configured.push('Intercom');
  else notConfigured.push('Intercom');

  if (env.zendesk.clientId) configured.push('Zendesk');
  else notConfigured.push('Zendesk');

  if (env.slack.clientId && env.slack.clientSecret && env.slack.signingSecret)
    configured.push('Slack');
  else notConfigured.push('Slack');

  if (env.posthog.apiKey) configured.push('PostHog');
  else notConfigured.push('PostHog');

  if (env.posthog.featureFlagsKey) configured.push('PostHog Feature Flags');
  else notConfigured.push('PostHog Feature Flags');

  if (env.unkey.rootKey && env.unkey.apiId) configured.push('Unkey');
  else notConfigured.push('Unkey');

  if (env.email.provider !== 'localhost') configured.push('Email (Resend)');
  else usingDefaults.push('Email (localhost)');

  // Check for development secrets
  if (env.auth.secret === DEV_SECRETS.AUTH) usingDefaults.push('Auth secret');
  if (env.token.inviteSecret === DEV_SECRETS.INVITE) usingDefaults.push('Invite secret');
  if (env.session.tokenSecret === DEV_SECRETS.SESSION) usingDefaults.push('Session secret');
  if (env.token.shareSecret === DEV_SECRETS.SHARE) usingDefaults.push('Share secret');

  return { configured, notConfigured, usingDefaults };
}

/**
 * Log configuration on startup
 */
export function logConfig(): void {
  const status = getConfigStatus();

  logger.debug(
    {
      server: {
        nodeEnv: env.server.nodeEnv,
        appEnv: env.server.appEnv,
        port: env.server.port,
        host: env.server.host,
      },
      cors: {
        origins: env.cors.origins,
        credentials: env.cors.credentials,
        maxAge: formatDuration(env.cors.maxAge),
      },
      auth: {
        url: env.auth.url,
        cookiePrefix: env.auth.cookiePrefix,
        cookieDomain: env.auth.cookieDomain,
        jwtIssuer: env.auth.jwtIssuer,
      },
      urls: {
        dashboard: env.dashboard.baseUrl,
        recorder: env.recorder.baseUrl,
        docs: env.docs.url,
      },
      tokenExpiry: {
        invite: formatDuration(env.token.inviteExpiresIn),
        domainVerification: formatDuration(env.token.domainVerificationExpiresIn),
        accessRequest: formatDuration(env.token.accessRequestExpiresIn),
        workspaceCreateInvite: formatDuration(env.token.workspaceCreateInviteExpiresIn),
        recording: formatDuration(env.token.recordingTokenExpiresIn),
        share: formatDuration(env.token.shareExpiresIn),
        shareMax: formatDuration(env.token.shareMaxExpiresIn),
      },
      sessionExpiry: {
        token: formatDuration(env.session.tokenExpiry),
        uploadToken: formatDuration(env.session.uploadTokenExpiry),
        presignedUrl: formatDuration(env.session.presignedUrlExpiry),
      },
      email: {
        provider: env.email.provider,
        apiKeySet: env.email.provider !== 'localhost' ? !!env.email.providerApiKey : 'N/A',
        inboxes: env.email.inboxes,
      },
      inngest: {
        sweepSchedule: env.inngest.workspaceSweepCronSchedule,
        lookbackDays: {
          workspace: env.inngest.workspaceSweepLookbackDays,
          project: env.inngest.projectSweepLookbackDays,
          recording: env.inngest.recordingSweepLookbackDays,
        },
        restorationWindow: {
          workspace: `${env.inngest.workspaceRestorationWindowDays}d`,
          project: `${env.inngest.projectRestorationWindowDays}d`,
        },
      },
      restoration: {
        gracePeriod: `${env.restoration.gracePeriodDays}d`,
        maxWindow: `${env.restoration.maxWindowDays}d`,
      },
      payments: {
        environment: env.payments.environment,
      },
      storage: {
        assetsDomain: env.storage.assetsDomain,
        cdnDomain: env.storage.cdnDomain,
        imageZone: env.storage.imageZone,
        skipTransform: env.storage.skipTransform,
        buckets: {
          cdn: env.storage.cdn.bucketName,
          assets: env.storage.assets.bucketName,
          reports: env.storage.reports.bucketName,
        },
      },
      rateLimit: {
        enabled: env.rateLimit.enabled,
      },
      bodyLimit: {
        maxSizeBytes: env.bodyLimit.maxSizeBytes,
        maxSizeLargeBytes: env.bodyLimit.maxSizeLargeBytes,
      },
      mcp: {
        rateLimit: {
          perIpPerMinute: env.mcp.rateLimit.perIpPerMinute,
          perUserPerMinute: env.mcp.rateLimit.perUserPerMinute,
          perUserPerDay: env.mcp.rateLimit.perUserPerDay,
        },
      },
      cache: {
        enabled: env.cache.enabled,
      },
      posthog: {
        configured: !!env.posthog.apiKey,
        host: env.posthog.host,
        featureFlags: !!env.posthog.featureFlagsKey,
      },
      status: {
        configured: status.configured,
        notConfigured: status.notConfigured,
        usingDefaults: status.usingDefaults,
      },
    },
    'Environment configuration loaded'
  );
}
