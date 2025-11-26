/**
 * Environment configuration and validation
 * Centralizes all environment variable access with type safety and validation
 */
import { createAppLogger } from '@workspace/logger';

interface EnvConfig {
  port: number;
  host: string;
  nodeEnv: 'development' | 'production' | 'test';
  cors: {
    origins: string[];
    credentials: boolean;
    maxAge: number;
  };
  auth: {
    secret: string;
    url: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  database: {
    url: string;
  };
  email: {
    provider: 'localhost' | 'resend';
    resendApiKey?: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  defaultStore: {
    provider: 'r2' | 's3';
    url: string;
    region: string;
    bucket: string;
    accessId: string;
    accessKey: string;
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
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/google',
    },
    database: {
      url: process.env.DATABASE_URL || '',
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER as 'localhost' | 'resend') || 'localhost',
      resendApiKey: process.env.RESEND_API_KEY,
    },
    rateLimit: {
      windowMs: parseInteger(process.env.RATE_LIMIT_WINDOW, 60000),
      maxRequests: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    },
    defaultStore: {
      provider: (process.env.DEFAULT_STORE_PROVIDER as 'r2' | 's3') || 'r2',
      url: process.env.DEFAULT_STORE_URL || '',
      region: process.env.DEFAULT_STORE_REGION || 'auto',
      bucket: process.env.DEFAULT_STORE_BUCKET || '',
      accessId: process.env.DEFAULT_STORE_ACCESS_ID || '',
      accessKey: process.env.DEFAULT_STORE_ACCESS_KEY || '',
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
  if (!env.database.url) {
    throw new Error('DATABASE_URL must be set in production');
  }
  if (!env.google.clientId || !env.google.clientSecret) {
    logger.warn('Google OAuth credentials not set. Google authentication will not work.');
  }
  if (env.email.provider === 'resend' && !env.email.resendApiKey) {
    throw new Error('RESEND_API_KEY must be set when using resend email provider');
  }
  if (
    !env.defaultStore.url ||
    !env.defaultStore.region ||
    !env.defaultStore.bucket ||
    !env.defaultStore.accessId ||
    !env.defaultStore.accessKey
  ) {
    throw new Error(
      'Default store configuration (URL, Region, Bucket, Access ID, Access Key) must be set in production'
    );
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
      database: env.database.url ? 'Connected' : 'Not configured',
      googleOAuth: env.google.clientId ? 'Configured' : 'Not configured',
      emailProvider: env.email.provider,
      resendConfigured: env.email.provider === 'resend' ? !!env.email.resendApiKey : 'N/A',
      defaultStoreProvider: env.defaultStore.provider,
      defaultStoreConfigured:
        !!env.defaultStore.url &&
        !!env.defaultStore.region &&
        !!env.defaultStore.bucket &&
        !!env.defaultStore.accessId &&
        !!env.defaultStore.accessKey,
    },
    'Environment configuration loaded'
  );
}
