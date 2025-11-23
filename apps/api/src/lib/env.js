/**
 * Environment configuration and validation
 * Centralizes all environment variable access with type safety and validation
 */
/**
 * Parse comma-separated string into array
 */
function parseCommaSeparated(value, defaultValue) {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
/**
 * Parse integer with fallback
 */
function parseInteger(value, defaultValue) {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
/**
 * Parse boolean with fallback
 */
function parseBoolean(value, defaultValue) {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}
/**
 * Load and validate environment configuration
 */
export function loadEnvConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const config = {
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
    rateLimit: {
      windowMs: parseInteger(process.env.RATE_LIMIT_WINDOW, 60000),
      maxRequests: parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    },
  };
  // Validate critical configuration in production
  if (config.nodeEnv === 'production') {
    if (config.auth.secret === 'dev-auth-secret-change-in-production') {
      throw new Error('BETTER_AUTH_SECRET must be set in production');
    }
    if (!config.database.url) {
      throw new Error('DATABASE_URL must be set in production');
    }
    if (!config.google.clientId || !config.google.clientSecret) {
      console.warn(
        'Warning: Google OAuth credentials not set. Google authentication will not work.'
      );
    }
  }
  return config;
}
/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();
/**
 * Log configuration on startup
 */
export function logConfig() {
  console.log('Environment Configuration:');
  console.log(`  - Mode: ${env.nodeEnv}`);
  console.log(`  - Port: ${env.port}`);
  console.log(`  - Host: ${env.host}`);
  console.log(`  - CORS Origins: ${env.cors.origins.join(', ')}`);
  console.log(`  - CORS Credentials: ${env.cors.credentials}`);
  console.log(`  - Auth URL: ${env.auth.url}`);
  console.log(`  - Database: ${env.database.url ? 'Connected' : 'Not configured'}`);
  console.log(`  - Google OAuth: ${env.google.clientId ? 'Configured' : 'Not configured'}`);
}
