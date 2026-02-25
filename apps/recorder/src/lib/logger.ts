import { createClientLogger, type Logger } from '@workspace/common-logger/browser';

export function createLogger(context: string): Logger {
  return createClientLogger(context, {
    level: import.meta.env.DEV ? 'debug' : 'warn',
  });
}
