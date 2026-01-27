/**
 * Environment configuration and validation
 * Centralizes all environment variable access with type safety and validation
 */
import { createAppLogger } from '@workspace/logger';

interface BucketCredentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

interface StorageConfig {
  profile: 'development' | 'staging' | 'production';
  assetsDomain?: string;
  dev?: BucketCredentials;
  cdn?: BucketCredentials;
  assets?: BucketCredentials;
  reports?: BucketCredentials;
}

interface DodoPaymentsConfig {
  apiKey?: string;
  webhookSecret?: string;
  environment: 'test_mode' | 'live_mode';
}

interface RedisConfig {
  url?: string;
  token?: string;
}

interface EnvConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production' | 'test';
  jwtIssuer: string;
  cors: {
    origins: string[];
    credentials: boolean;
    maxAge: number;
  };
  auth: {
    secret: string;
    url: string;
    cookiePrefix: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  intercom: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  dashboard: {
    baseUrl: string;
  };
  dodoPayments: DodoPaymentsConfig;
  token: {
    inviteSecret: string;
    inviteExpiresIn: number;
    domainVerificationExpiresIn: number;
    accessRequestExpiresIn: number;
    workspaceCreateInviteExpiresIn: number;
    billingEmailVerificationExpiresIn: number;
    recordingSecret: string;
    recordingTokenExpiresIn: number;
  };
  session: {
    tokenSecret: string;
    uploadTokenSecret: string;
    tokenExpiry: number;
    uploadTokenExpiry: number;
    presignedUrlExpiry: number;
  };
  database: {
    url: string;
  };
  recorder: {
    baseUrl: string;
  };
  support: {
    docsUrl: string;
    supportEmail: string;
    calendarUrl: string;
  };
  email: {
    provider: 'localhost' | 'resend';
    providerApiKey?: string;
    inboxes: {
      onboarding: string;
      notification: string;
      billing: string;
      invite: string;
      auth: string;
    };
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  redis: RedisConfig;
  cache: {
    enabled: boolean;
  };
  rateLimitEnabled: boolean;
  trigger: {
    secretKey?: string;
    workspaceSweepLookbackDays: number;
    workspaceSweepCronSchedule: string;
    projectSweepLookbackDays: number;
    projectSweepCronSchedule: string;
    recordingSweepLookbackDays: number;
    recordingSweepCronSchedule: string;
    workspaceRestorationWindowDays: number;
    projectRestorationWindowDays: number;
  };
  restoration: {
    gracePeriodDays: number;
    maxWindowDays: number;
  };
  storage: StorageConfig;
  admin: {
    userIds: string[];
  };
}

/**
 * Parse comma-separated string into array
 */
function parseCommaSeparated(value: string | undefined, defaultValue: string[]): string[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Parse integer with fallback
 */
function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse boolean with fallback
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];

  const config: EnvConfig = {
    port: parseInteger(process.env.PORT, 3001),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv,
    jwtIssuer: process.env.JWT_ISSUER || 'userplane',
    cors: {
      origins: parseCommaSeparated(process.env.CORS_ORIGINS, [
        'http://localhost:3000',
        'http://localhost:4321',
        'http://localhost:4322',
      ]),
      credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
      maxAge: parseInteger(process.env.CORS_MAX_AGE, 86400),
    },
    auth: {
      secret: process.env.BETTER_AUTH_SECRET || 'dev-auth-secret-change-in-production',
      url: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
      cookiePrefix: process.env.BETTER_AUTH_COOKIE_PREFIX || 'userplane',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/google',
    },
    intercom: {
      clientId: process.env.INTERCOM_CLIENT_ID || '',
      clientSecret: process.env.INTERCOM_CLIENT_SECRET || '',
      redirectUri:
        process.env.INTERCOM_REDIRECT_URI ||
        'http://localhost:3000/workspace/connect/intercom/callback',
    },
    dashboard: {
      baseUrl: process.env.INVITE_APP_URL || 'http://localhost:3000',
    },
    dodoPayments: {
      apiKey: process.env.DODO_PAYMENTS_API_KEY,
      webhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
      environment: (process.env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode') as
        | 'test_mode'
        | 'live_mode',
    },
    token: {
      inviteSecret: process.env.INVITE_TOKEN_SECRET || 'dev-invite-secret-change-in-production',
      inviteExpiresIn: parseInteger(process.env.INVITE_TOKEN_EXPIRES_IN, 30 * 24 * 60 * 60), // 30 days
      domainVerificationExpiresIn: parseInteger(
        process.env.DOMAIN_VERIFICATION_TOKEN_EXPIRES_IN,
        300
      ), // 5 minutes
      accessRequestExpiresIn: parseInteger(
        process.env.ACCESS_REQUEST_TOKEN_EXPIRES_IN,
        7 * 24 * 60 * 60
      ), // 7 days
      workspaceCreateInviteExpiresIn: parseInteger(
        process.env.WORKSPACE_CREATE_INVITE_TOKEN_EXPIRES_IN,
        90 * 24 * 60 * 60
      ), // 90 days
      billingEmailVerificationExpiresIn: parseInteger(
        process.env.BILLING_EMAIL_VERIFICATION_TOKEN_EXPIRES_IN,
        10 * 60
      ), // 10 minutes
      recordingSecret:
        process.env.RECORDER_TOKEN_SECRET || 'dev-recorder-secret-change-in-production',
      recordingTokenExpiresIn: parseInteger(
        process.env.RECORDER_TOKEN_EXPIRES_IN,
        180 * 24 * 60 * 60
      ), // 180 days
    },
    session: {
      tokenSecret: process.env.SESSION_TOKEN_SECRET || 'dev-session-secret-change-in-production',
      uploadTokenSecret:
        process.env.UPLOAD_TOKEN_SECRET || 'dev-upload-secret-change-in-production',
      tokenExpiry: parseInteger(process.env.SESSION_TOKEN_EXPIRY, 180 * 60), // 180 minutes
      uploadTokenExpiry: parseInteger(process.env.UPLOAD_TOKEN_EXPIRY, 120 * 60), // 120 minutes
      presignedUrlExpiry: parseInteger(process.env.PRESIGNED_URL_EXPIRY, 90 * 60), // 90 minutes
    },
    database: {
      url: process.env.DATABASE_URL || '',
    },
    recorder: {
      baseUrl: process.env.RECORDER_URL || 'http://localhost:4322',
    },
    support: {
      docsUrl: process.env.DOCS_URL || 'https://userplane.com/docs',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@userplane.io',
      calendarUrl: process.env.CALENDAR_URL || 'https://cal.com/userplane/intro',
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER as 'localhost' | 'resend') || 'localhost',
      providerApiKey: process.env.EMAIL_PROVIDER_API_KEY,
      inboxes: {
        onboarding: process.env.EMAIL_ONBOARDING_INBOX || 'onboarding@userplane.io',
        notification: process.env.EMAIL_NOTIFICATION_INBOX || 'notifications@userplane.io',
        billing: process.env.EMAIL_BILLING_INBOX || 'billing@userplane.io',
        invite: process.env.EMAIL_INVITE_INBOX || 'invites@userplane.io',
        auth: process.env.EMAIL_AUTH_INBOX || 'auth@userplane.io',
      },
    },
    rateLimit: {
      windowMs: parseInteger(process.env.RATE_LIMIT_WINDOW, 60000),
      maxRequests: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    },
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    cache: {
      enabled: parseBoolean(process.env.CACHE_ENABLED, true),
    },
    rateLimitEnabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, true),
    trigger: {
      secretKey: process.env.TRIGGER_SECRET_KEY,
      workspaceSweepLookbackDays: parseInteger(process.env.WORKSPACE_SWEEP_LOOKBACK_DAYS, 7), // 7 days
      workspaceSweepCronSchedule: process.env.WORKSPACE_SWEEP_CRON_SCHEDULE || '0 0 * * *', // Daily at midnight UTC
      projectSweepLookbackDays: parseInteger(process.env.PROJECT_SWEEP_LOOKBACK_DAYS, 3), // 3 days
      projectSweepCronSchedule: process.env.PROJECT_SWEEP_CRON_SCHEDULE || '0 0 * * *', // Daily at midnight UTC
      recordingSweepLookbackDays: parseInteger(process.env.RECORDING_SWEEP_LOOKBACK_DAYS, 3), // 3 days
      recordingSweepCronSchedule: process.env.RECORDING_SWEEP_CRON_SCHEDULE || '0 0 * * *', // Daily at midnight UTC
      workspaceRestorationWindowDays: parseInteger(
        process.env.WORKSPACE_RESTORATION_WINDOW_DAYS,
        2
      ), // 2 days
      projectRestorationWindowDays: parseInteger(process.env.PROJECT_RESTORATION_WINDOW_DAYS, 2), // 2 days
    },
    restoration: {
      gracePeriodDays: parseInteger(process.env.RESTORATION_GRACE_PERIOD_DAYS, 3), // Full restoration within 3 days
      maxWindowDays: parseInteger(process.env.RESTORATION_MAX_WINDOW_DAYS, 30), // Partial restoration until 30 days
    },
    storage: {
      profile: (process.env.STORAGE_PROFILE || 'development') as StorageConfig['profile'],
      assetsDomain: process.env.ASSETS_DOMAIN,
      dev: process.env.R2_DEV_ACCOUNT_ID
        ? {
            accountId: process.env.R2_DEV_ACCOUNT_ID,
            accessKeyId: process.env.R2_DEV_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_DEV_SECRET_ACCESS_KEY || '',
            bucketName: process.env.R2_DEV_BUCKET_NAME || '',
          }
        : undefined,
      cdn: process.env.R2_CDN_ACCOUNT_ID
        ? {
            accountId: process.env.R2_CDN_ACCOUNT_ID,
            accessKeyId: process.env.R2_CDN_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_CDN_SECRET_ACCESS_KEY || '',
            bucketName: process.env.R2_CDN_BUCKET_NAME || '',
          }
        : undefined,
      assets: process.env.R2_ASSETS_ACCOUNT_ID
        ? {
            accountId: process.env.R2_ASSETS_ACCOUNT_ID,
            accessKeyId: process.env.R2_ASSETS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_ASSETS_SECRET_ACCESS_KEY || '',
            bucketName: process.env.R2_ASSETS_BUCKET_NAME || '',
          }
        : undefined,
      reports: process.env.R2_REPORTS_ACCOUNT_ID
        ? {
            accountId: process.env.R2_REPORTS_ACCOUNT_ID,
            accessKeyId: process.env.R2_REPORTS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_REPORTS_SECRET_ACCESS_KEY || '',
            bucketName: process.env.R2_REPORTS_BUCKET_NAME || '',
          }
        : undefined,
    },
    admin: {
      userIds: parseCommaSeparated(process.env.ADMIN_USER_IDS, []),
    },
  };

  return config;
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();

/**
 * Logger instance for environment configuration
 */
const logger = createAppLogger('env');

// Validate critical configuration in production
if (env.nodeEnv === 'production') {
  if (env.auth.secret === 'dev-auth-secret-change-in-production') {
    throw new Error('BETTER_AUTH_SECRET must be set in production');
  }
  if (env.token.inviteSecret === 'dev-invite-secret-change-in-production') {
    throw new Error('INVITE_TOKEN_SECRET must be set in production');
  }
  if (env.session.tokenSecret === 'dev-session-secret-change-in-production') {
    throw new Error('SESSION_TOKEN_SECRET must be set in production');
  }
  if (env.session.uploadTokenSecret === 'dev-upload-secret-change-in-production') {
    throw new Error('UPLOAD_TOKEN_SECRET must be set in production');
  }
  if (env.token.recordingSecret === 'dev-recorder-secret-change-in-production') {
    throw new Error('RECORDER_TOKEN_SECRET must be set in production');
  }
  if (!env.database.url) {
    throw new Error('DATABASE_URL must be set in production');
  }
  if (!env.trigger.secretKey) {
    throw new Error('TRIGGER_SECRET_KEY must be set in production');
  }
  if (!env.google.clientId || !env.google.clientSecret) {
    logger.warn('Google OAuth credentials not set. Google authentication will not work.');
  }
  if (env.email.provider !== 'localhost' && !env.email.providerApiKey) {
    throw new Error('EMAIL_PROVIDER_API_KEY must be set when email provider is not localhost');
  }
  if (
    !env.email.inboxes.onboarding ||
    !env.email.inboxes.notification ||
    !env.email.inboxes.billing ||
    !env.email.inboxes.invite
  ) {
    throw new Error('All email inbox addresses must be configured in production');
  }
}

/**
 * Log configuration on startup
 */
export function logConfig(): void {
  logger.info(
    {
      mode: env.nodeEnv,
      port: env.port,
      host: env.host,
      corsOrigins: env.cors.origins,
      corsCredentials: env.cors.credentials,
      authUrl: env.auth.url,
      authCookiePrefix: env.auth.cookiePrefix,
      dashboardBaseUrl: env.dashboard.baseUrl,
      token: {
        inviteExpiry: `${env.token.inviteExpiresIn}s`,
        domainVerificationExpiry: `${env.token.domainVerificationExpiresIn}s`,
        accessRequestExpiry: `${env.token.accessRequestExpiresIn}s`,
        workspaceCreateInviteExpiry: `${env.token.workspaceCreateInviteExpiresIn}s`,
        billingEmailVerificationExpiry: `${env.token.billingEmailVerificationExpiresIn}s`,
        recordingTokenExpiry: `${env.token.recordingTokenExpiresIn}s`,
      },
      recorderBaseUrl: env.recorder.baseUrl,
      support: {
        docsUrl: env.support.docsUrl,
        supportEmail: env.support.supportEmail,
        calendarUrl: env.support.calendarUrl,
      },
      session: {
        tokenExpiry: `${env.session.tokenExpiry}s`,
        uploadTokenExpiry: `${env.session.uploadTokenExpiry}s`,
        presignedUrlExpiry: `${env.session.presignedUrlExpiry}s`,
      },
      database: env.database.url ? 'Connected' : 'Not configured',
      googleOAuth: env.google.clientId ? 'Configured' : 'Not configured',
      dodoPayments: {
        apiKey: env.dodoPayments.apiKey ? 'Configured' : 'Not configured',
        webhookSecret: env.dodoPayments.webhookSecret ? 'Configured' : 'Not configured',
        environment: env.dodoPayments.environment,
      },
      emailProvider: env.email.provider,
      emailProviderApiKey: env.email.provider !== 'localhost' ? !!env.email.providerApiKey : 'N/A',
      emailInboxes: {
        onboarding: env.email.inboxes.onboarding,
        notification: env.email.inboxes.notification,
        billing: env.email.inboxes.billing,
        invite: env.email.inboxes.invite,
        auth: env.email.inboxes.auth,
      },
      storage: {
        profile: env.storage.profile,
        assetsDomain: env.storage.assetsDomain || 'Not configured',
        dev: env.storage.dev ? 'Configured' : 'Not configured',
        cdn: env.storage.cdn ? 'Configured' : 'Not configured',
        assets: env.storage.assets ? 'Configured' : 'Not configured',
        reports: env.storage.reports ? 'Configured' : 'Not configured',
      },
      trigger: {
        secretKey: env.trigger.secretKey ? 'Configured' : 'Not configured',
        workspaceSweepLookbackDays: `${env.trigger.workspaceSweepLookbackDays} days`,
        workspaceSweepCronSchedule: env.trigger.workspaceSweepCronSchedule,
        projectSweepLookbackDays: `${env.trigger.projectSweepLookbackDays} days`,
        projectSweepCronSchedule: env.trigger.projectSweepCronSchedule,
        recordingSweepLookbackDays: `${env.trigger.recordingSweepLookbackDays} days`,
        recordingSweepCronSchedule: env.trigger.recordingSweepCronSchedule,
        workspaceRestorationWindowDays: `${env.trigger.workspaceRestorationWindowDays} days`,
        projectRestorationWindowDays: `${env.trigger.projectRestorationWindowDays} days`,
      },
      redis: {
        url: env.redis.url ? 'Configured' : 'Not configured',
        token: env.redis.token ? 'Configured' : 'Not configured',
      },
      cache: {
        enabled: env.cache.enabled,
      },
      rateLimitEnabled: env.rateLimitEnabled,
    },
    'Environment configuration loaded'
  );
}
