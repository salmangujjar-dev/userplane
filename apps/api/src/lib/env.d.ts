/**
 * Environment configuration and validation
 * Centralizes all environment variable access with type safety and validation
 */
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
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
/**
 * Load and validate environment configuration
 */
export declare function loadEnvConfig(): EnvConfig;
/**
 * Global environment configuration instance
 */
export declare const env: EnvConfig;
/**
 * Log configuration on startup
 */
export declare function logConfig(): void;
export {};
//# sourceMappingURL=env.d.ts.map
