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
  invite: {
    secret: string;
    appUrl: string;
    expiresIn: number;
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
    url: string;
    secret: string;
    expiresIn: number;
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
  trigger: {
    secretKey?: string;
    sweepGracePeriodSeconds: number;
    sweepCronSchedule: string;
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
    invite: {
      secret: process.env.INVITE_TOKEN_SECRET || 'dev-invite-secret-change-in-production',
      appUrl: process.env.INVITE_APP_URL || 'http://localhost:3000',
      expiresIn: parseInteger(process.env.INVITE_TOKEN_EXPIRES_IN, 30 * 24 * 60 * 60), // 30 days
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
      url: process.env.RECORDER_URL || 'http://localhost:4322',
      secret: process.env.RECORDER_TOKEN_SECRET || 'dev-recorder-secret-change-in-production',
      expiresIn: parseInteger(process.env.RECORDER_TOKEN_EXPIRES_IN, 180 * 24 * 60 * 60), // 180 days
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
    trigger: {
      secretKey: process.env.TRIGGER_SECRET_KEY,
      sweepGracePeriodSeconds: parseInteger(
        process.env.SWEEP_GRACE_PERIOD_SECONDS,
        7 * 24 * 60 * 60
      ), // 7 days
      sweepCronSchedule: process.env.SWEEP_CRON_SCHEDULE || '0 0 */3 * *', // Every 3 days at midnight UTC
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
  if (env.invite.secret === 'dev-invite-secret-change-in-production') {
    throw new Error('INVITE_TOKEN_SECRET must be set in production');
  }
  if (env.session.tokenSecret === 'dev-session-secret-change-in-production') {
    throw new Error('SESSION_TOKEN_SECRET must be set in production');
  }
  if (env.session.uploadTokenSecret === 'dev-upload-secret-change-in-production') {
    throw new Error('UPLOAD_TOKEN_SECRET must be set in production');
  }
  if (env.recorder.secret === 'dev-recorder-secret-change-in-production') {
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
      inviteAppUrl: env.invite.appUrl,
      inviteTokenExpiry: `${env.invite.expiresIn}s`,
      recorderUrl: env.recorder.url,
      recorderTokenExpiry: `${env.recorder.expiresIn}s`,
      session: {
        tokenExpiry: `${env.session.tokenExpiry}s`,
        uploadTokenExpiry: `${env.session.uploadTokenExpiry}s`,
        presignedUrlExpiry: `${env.session.presignedUrlExpiry}s`,
      },
      database: env.database.url ? 'Connected' : 'Not configured',
      googleOAuth: env.google.clientId ? 'Configured' : 'Not configured',
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
        sweepGracePeriod: `${env.trigger.sweepGracePeriodSeconds}s`,
        sweepCronSchedule: env.trigger.sweepCronSchedule,
      },
    },
    'Environment configuration loaded'
  );
}
