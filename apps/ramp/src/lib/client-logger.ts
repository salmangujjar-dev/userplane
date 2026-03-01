import { createClientLogger, type Logger } from '@userplane/common-logger/browser';

const isDev = process.env.NODE_ENV !== 'production';

export const log: Logger = createClientLogger('ramp', {
  level: isDev ? 'debug' : 'info',
});
