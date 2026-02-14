import { createLogger } from '@workspace/console-logger';

export const logger = createLogger('Cache');

export function createCacheLogger(module: string) {
  return logger.child({ module });
}
