import pino, { type LoggerOptions } from 'pino';

export interface CreateLoggerOptions {
  level?: pino.Level;
  pretty?: boolean;
  base?: Record<string, unknown>;
}

export function createLogger(context: string, options: CreateLoggerOptions = {}) {
  const { level = 'info', pretty: usePretty = false, base = {} } = options;

  const pinoOptions: LoggerOptions = {
    level,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    base: {
      context,
      ...base,
    },
  };

  if (usePretty) {
    // Lazy load pino-pretty only when needed
    // This prevents bundling it in browser/edge environments
    const pretty = require('pino-pretty');
    const stream = pretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    });
    return pino(pinoOptions, stream);
  }

  return pino(pinoOptions);
}

export { createBrowserLogger } from './browser';
export { createAppLogger } from './factory';
export { createServerLogger, createUniversalLogger } from './universal';
export default createLogger;
