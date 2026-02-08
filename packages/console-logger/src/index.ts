type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LoggerOptions {
  level?: LogLevel;
  base?: Record<string, unknown>;
}

interface Logger {
  level: LogLevel;
  trace(obj: Record<string, unknown>, msg?: string): void;
  trace(msg: string): void;
  debug(obj: Record<string, unknown>, msg?: string): void;
  debug(msg: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  info(msg: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  warn(msg: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
  error(msg: string): void;
  fatal(obj: Record<string, unknown>, msg?: string): void;
  fatal(msg: string): void;
  child(bindings: Record<string, unknown>): Logger;
}

const LEVEL_VALUES: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const LEVEL_CONSOLE: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  trace: 'debug',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

function createLogMethod(
  level: LogLevel,
  threshold: LogLevel,
  base: Record<string, unknown>
): Logger[LogLevel] {
  const numericLevel = LEVEL_VALUES[level];
  const numericThreshold = LEVEL_VALUES[threshold];
  const consoleMethod = LEVEL_CONSOLE[level];

  if (numericLevel < numericThreshold) {
    return (() => {}) as Logger[LogLevel];
  }

  return ((objOrMsg: Record<string, unknown> | string, msg?: string) => {
    const entry: Record<string, unknown> = {
      level,
      ...base,
      time: Date.now(),
    };

    if (typeof objOrMsg === 'string') {
      entry.msg = objOrMsg;
    } else {
      Object.assign(entry, objOrMsg);
      if (msg !== undefined) {
        entry.msg = msg;
      }
    }

    console[consoleMethod](entry);
  }) as Logger[LogLevel];
}

function createLogger(context: string, options?: LoggerOptions): Logger {
  const level = options?.level ?? 'info';
  const base: Record<string, unknown> = { context, ...options?.base };

  const logger: Logger = {
    level,
    trace: createLogMethod('trace', level, base),
    debug: createLogMethod('debug', level, base),
    info: createLogMethod('info', level, base),
    warn: createLogMethod('warn', level, base),
    error: createLogMethod('error', level, base),
    fatal: createLogMethod('fatal', level, base),
    child(bindings: Record<string, unknown>): Logger {
      return createLogger(context, {
        level,
        base: { ...options?.base, ...bindings },
      });
    },
  };

  return logger;
}

export { createLogger };
export type { Logger, LoggerOptions, LogLevel };
