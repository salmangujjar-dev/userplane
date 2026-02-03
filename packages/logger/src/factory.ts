import { createLogger, type CreateLoggerOptions } from './index';

/**
 * Creates a logger with environment-aware defaults.
 * Automatically configures pretty printing and log level based on NODE_ENV.
 * Includes both NODE_ENV (runtime mode) and APP_ENV (deployment stage) in log context.
 *
 * NOTE: This function uses pino which requires Node.js built-ins.
 * For Next.js middleware (Edge runtime) or browser environments, use createBrowserLogger instead.
 */
export function createAppLogger(context: string, options: Partial<CreateLoggerOptions> = {}) {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const appEnv = process.env.APP_ENV || 'development';
  const isDevelopment = nodeEnv !== 'production';

  return createLogger(context, {
    level:
      (process.env.LOG_LEVEL as
        | 'trace'
        | 'debug'
        | 'info'
        | 'warn'
        | 'error'
        | 'fatal'
        | undefined) || (isDevelopment ? 'debug' : 'info'),
    pretty: isDevelopment,
    base: { env: nodeEnv, appEnv },
    ...options,
  });
}
