import { createLogger } from '@workspace/console-logger';

declare const __DEV__: boolean;

export const logger = createLogger('SDK', {
  level: typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn',
});

export const createSdkLogger = (module: string) => logger.child({ module });
