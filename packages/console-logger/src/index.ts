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

function isErrorLike(value: unknown): value is Error | DOMException {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tag = Object.prototype.toString.call(value);

  return (
    value instanceof Error ||
    (typeof DOMException !== 'undefined' && value instanceof DOMException) ||
    tag === '[object Error]' ||
    tag === '[object DOMException]'
  );
}

function serializeError(
  error: Error | DOMException,
  seen: WeakSet<object>
): Record<string, unknown> {
  const serialized: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  if ('stack' in error && typeof error.stack === 'string') {
    serialized.stack = error.stack;
  }

  for (const [key, value] of Object.entries(error as unknown as Record<string, unknown>)) {
    if (!(key in serialized)) {
      serialized[key] = normalizeLogValue(value, seen);
    }
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause !== undefined) {
    serialized.cause = normalizeLogValue(cause, seen);
  }

  return serialized;
}

function normalizeLogValue(value: unknown, seen: WeakSet<object>): unknown {
  if (isErrorLike(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    return serializeError(value, seen);
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    return value.map((item) => normalizeLogValue(item, seen));
  }

  if (value && typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return value;
    }

    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeLogValue(item, seen),
      ])
    );
  }

  return value;
}

function normalizeLogRecord(record: Record<string, unknown>): Record<string, unknown> {
  const seen = new WeakSet<object>();

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, normalizeLogValue(value, seen)])
  );
}

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
    const rawEntry: Record<string, unknown> = {
      level,
      ...base,
      time: Date.now(),
    };

    if (typeof objOrMsg === 'string') {
      rawEntry.msg = objOrMsg;
    } else {
      Object.assign(rawEntry, objOrMsg);
      if (msg !== undefined) {
        rawEntry.msg = msg;
      }
    }

    const entry = normalizeLogRecord(rawEntry);
    if (typeof entry.msg === 'string') {
      console[consoleMethod](entry.msg, entry);
    } else {
      console[consoleMethod](entry);
    }
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
