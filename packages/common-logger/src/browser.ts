/**
 * Client-side logger using Pino's native browser support
 *
 * Uses pino's built-in browser build which maps to console.* methods.
 * Returns the same pino.Logger type as the server logger -- consistent API everywhere.
 * Callers own policy: log level and base metadata.
 */
import pino, { type Logger as PinoLogger } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Re-exported pino Logger type so consumers can annotate without depending on pino directly */
export type Logger = PinoLogger;

export interface ClientLoggerOptions {
  /** Log level -- caller decides based on their env */
  level: LogLevel;
  /** Additional base fields included in every log line */
  base?: Record<string, unknown>;
}

/**
 * Create a structured client-side logger.
 *
 * Uses pino's browser build which outputs structured objects via console methods.
 * Does NOT read environment variables -- caller provides level and base fields.
 */
export function createClientLogger(context: string, options: ClientLoggerOptions) {
  return pino({
    browser: { asObject: true },
    level: options.level,
    base: { context, ...options.base },
    formatters: {
      level: (label) => ({ level: label }),
    },
  });
}
