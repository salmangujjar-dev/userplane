import { createLogger } from '@userplane/console-logger';

export const logger = createLogger('Postbridge', {
  level: typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn',
});

declare const __DEV__: boolean;
