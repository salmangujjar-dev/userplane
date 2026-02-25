/**
 * Server-side logger using Pino
 *
 * This package standardizes log structure (formatters, base fields, pretty-print config).
 * Callers own policy: log level, pretty-printing, and base metadata like env/appEnv.
 * The package does not read process.env -- each app passes config explicitly.
 */
import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';
import pinoPretty from 'pino-pretty';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Re-exported pino Logger type so consumers can annotate without depending on pino directly */
export type Logger = PinoLogger;

export interface ServerLoggerOptions {
  /** Log level -- caller decides based on their env */
  level: LogLevel;
  /** Enable pretty-printed output -- caller decides based on their env */
  pretty?: boolean;
  /** Additional base fields included in every log line (e.g. env, appEnv) */
  base?: Record<string, unknown>;
}

/**
 * Create a structured server-side logger.
 *
 * Standardizes: level-as-label formatter, context in base fields, pino-pretty stream.
 * Does NOT read environment variables -- caller provides level, pretty, and base fields.
 *
 * Uses pino-pretty as a stream (not a transport) because pino's transport system
 * resolves modules via worker threads from the CWD, which fails in monorepos where
 * pino-pretty is installed in the logger package, not the consuming app.
 */
export function createServerLogger(context: string, options: ServerLoggerOptions) {
  const config: LoggerOptions = {
    level: options.level,
    base: { context, ...options.base },
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  if (options.pretty) {
    const stream = pinoPretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    });
    return pino(config, stream);
  }

  return pino(config);
}
