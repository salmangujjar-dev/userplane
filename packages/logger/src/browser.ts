/**
 * Browser-compatible logger
 * Falls back to console methods with structured formatting
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export interface LogData {
  [key: string]: unknown;
}

export class BrowserLogger {
  public context: string;
  public level: LogLevel;
  public baseData: LogData;

  constructor(context: string, level: LogLevel = 'info', baseData: LogData = {}) {
    this.context = context;
    this.level = level;
    this.baseData = baseData;
  }

  private log(level: LogLevel, data: LogData | string, message?: string) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) {
      return;
    }

    const logData = typeof data === 'string' ? { message: data } : data;
    const logMessage = message || logData.message || '';

    const output = {
      level,
      time: new Date().toISOString(),
      context: this.context,
      ...this.baseData,
      ...logData,
      ...(logMessage && { msg: logMessage }),
    };

    const consoleMethod = level === 'fatal' ? 'error' : level;

    if (typeof console[consoleMethod] === 'function') {
      // eslint-disable-next-line no-console
      console[consoleMethod](`[${level.toUpperCase()}]`, output);
    }
  }

  trace(data: LogData | string, message?: string) {
    this.log('trace', data, message);
  }

  debug(data: LogData | string, message?: string) {
    this.log('debug', data, message);
  }

  info(data: LogData | string, message?: string) {
    this.log('info', data, message);
  }

  warn(data: LogData | string, message?: string) {
    this.log('warn', data, message);
  }

  error(data: LogData | string, message?: string) {
    this.log('error', data, message);
  }

  fatal(data: LogData | string, message?: string) {
    this.log('fatal', data, message);
  }

  child(data: LogData) {
    return new BrowserLogger(this.context, this.level, { ...this.baseData, ...data });
  }
}

export function createBrowserLogger(context: string, level: LogLevel = 'info') {
  return new BrowserLogger(context, level, { env: 'browser' });
}

/**
 * Creates a browser logger with environment-aware defaults.
 * Dev → 'debug' level, Prod → 'warn' level.
 * Supports LOG_LEVEL overrides via common env var patterns.
 */
export function createBrowserAppLogger(context: string): BrowserLogger {
  let level: LogLevel = 'warn';

  try {
    // Check for explicit overrides first
    const envLevel =
      (typeof process !== 'undefined' &&
        (process.env?.PUBLIC_LOG_LEVEL ||
          process.env?.NEXT_PUBLIC_LOG_LEVEL ||
          process.env?.LOG_LEVEL)) ||
      (typeof import.meta !== 'undefined' &&
        (import.meta as Record<string, Record<string, string>>).env?.VITE_LOG_LEVEL);

    if (envLevel && envLevel in LEVEL_ORDER) {
      level = envLevel as LogLevel;
    } else {
      // Default based on environment
      const isDev =
        (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
        (typeof import.meta !== 'undefined' &&
          (import.meta as Record<string, Record<string, boolean>>).env?.DEV);
      if (isDev) {
        level = 'debug';
      }
    }
  } catch {
    // Fallback to 'warn' if env detection fails
  }

  return new BrowserLogger(context, level, { env: 'browser' });
}
