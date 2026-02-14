import { createLogger } from '@workspace/console-logger';

export const logger = createLogger('Payments');

export function createPaymentsLogger(module: string) {
  return logger.child({ module });
}
