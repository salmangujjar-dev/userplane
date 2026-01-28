/**
 * Browser-compatible logger
 * Falls back to console methods with structured formatting
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

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
