/**
 * App-local logger factory for the API server.
 * Wraps the shared logger package with API-specific env configuration.
 */
import { createServerLogger, type LogLevel } from '@workspace/common-logger';

import { env } from '@/api/env';

const isDev = env.server.nodeEnv !== 'production';

export function createLogger(context: string) {
  return createServerLogger(context, {
    level: (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'info'),
    pretty: isDev,
    base: { env: env.server.nodeEnv, appEnv: env.server.appEnv },
  });
}
