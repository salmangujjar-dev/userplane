import pino, { type LoggerOptions } from 'pino';
import pretty from 'pino-pretty';

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
    const stream = pretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    });
    return pino(pinoOptions, stream);
  }

  return pino(pinoOptions);
}

export { createAppLogger } from './factory';
export { createBrowserLogger } from './browser';
export { createUniversalLogger, createServerLogger } from './universal';
export default createLogger;
