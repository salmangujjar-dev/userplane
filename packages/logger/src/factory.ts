import { createLogger, type CreateLoggerOptions } from './index';

/**
 * Creates a logger with environment-aware defaults.
 * Automatically configures pretty printing and log level based on NODE_ENV.
 *
 * NOTE: This function uses pino which requires Node.js built-ins.
 * For Next.js middleware (Edge runtime) or browser environments, use createBrowserLogger instead.
 */
export function createAppLogger(context: string, options: Partial<CreateLoggerOptions> = {}) {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv !== 'production';

  return createLogger(context, {
    level: (process.env.LOG_LEVEL as any) || (isDevelopment ? 'debug' : 'info'),
    pretty: isDevelopment,
    base: { env: nodeEnv },
    ...options,
  });
}
