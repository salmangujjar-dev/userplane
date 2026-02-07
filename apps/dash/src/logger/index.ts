import { createClientLogger, type Logger } from '@workspace/logger/browser';

// Client-side logger for the dash app
export const logger: Logger = createClientLogger('dash', { level: 'info' });

export default logger;
