import { createServerLogger, type Logger } from '@workspace/common-logger';

const isDev = process.env.NODE_ENV !== 'production';

export const log: Logger = createServerLogger('ramp', {
  level: isDev ? 'debug' : 'info',
  pretty: isDev,
});
