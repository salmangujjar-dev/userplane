import { createLogger, type CreateLoggerOptions } from './index';

/**
 * Creates a logger with environment-aware defaults.
 * Automatically configures pretty printing and log level based on NODE_ENV.
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
