import { createClientLogger, type Logger } from '@userplane/common-logger/browser';

export function createLogger(context: string): Logger {
  return createClientLogger(context, {
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'warn',
  });
}
