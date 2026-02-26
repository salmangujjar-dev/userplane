import { CONSOLE_PATCHED_FLAG, LOGGER_NAME, LOGGER_PREFIX } from '../constants';
import { dispatch } from '../event-bridge';
import type { ConsoleLogEvent, LogEvent, RepeatEntry } from '../types';
import { cleanPayload } from '../utils/clean';
import { parseStack, serializeValue } from '../utils/serialization';
import { truncatePayload } from '../utils/truncation';

type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';
const CONSOLE_LEVELS: ConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug', 'trace'];

const repeatTracker = new Map<string, RepeatEntry>();
const REPEAT_FLUSH_MS = 100;

/**
 * Returns the adjusted timestamp using server delta.
 */
function now(serverDeltaMs: number): number {
  return Date.now() + serverDeltaMs;
}

/**
 * Checks if args are "empty" (null, undefined, or single empty value).
 */
function isEmptyArgs(args: unknown[]): boolean {
  if (!args || !args.length) return true;
  if (args.length === 1) {
    const first = args[0];
    return first == null || first === '';
  }
  return false;
}

/**
 * Tries to batch identical empty-arg console calls from the same call site.
 * Returns true if the call was batched (deferred), false if it should be sent immediately.
 */
function tryBatchRepeat(
  level: string,
  args: unknown[],
  stackTop: string,
  buildPayload: (count: number) => LogEvent
): boolean {
  if (!isEmptyArgs(args) || !stackTop) return false;

  const key = `${level}|${stackTop}`;
  const existing = repeatTracker.get(key);

  if (existing) {
    existing.count++;
    return true;
  }

  const entry: RepeatEntry = { count: 1, timer: null, payload: null };
  entry.timer = setTimeout(() => {
    try {
      const payload = buildPayload(entry.count);
      repeatTracker.delete(key);
      try {
        dispatch(payload);
        // eslint-disable-next-line no-empty -- intentional: swallow dispatch failures in patched console
      } catch {}
    } catch {
      repeatTracker.delete(key);
    }
  }, REPEAT_FLUSH_MS);

  repeatTracker.set(key, entry);
  return true;
}

/**
 * Creates a console wrapper for the given level that intercepts and logs calls.
 */
function createConsoleWrapper(
  level: ConsoleLevel,
  serverDeltaMs: number
): (...args: unknown[]) => void {
  return function (...rawArgs: unknown[]) {
    // Capture and serialize args
    try {
      const serializedArgs = rawArgs.map(serializeValue).filter((v) => v !== undefined);

      let trace: string[] = [];
      let stackTop = '';
      try {
        const parsed = parseStack(new Error().stack || '');
        stackTop = parsed.top;
        trace = parsed.stackLines;
        // eslint-disable-next-line no-empty -- intentional: stack parsing is best-effort
      } catch {}

      const batched = tryBatchRepeat(level, serializedArgs, stackTop, (count) => {
        const event: ConsoleLogEvent = {
          source: LOGGER_NAME,
          has_focus: typeof __userplane_has_focus === 'undefined' || __userplane_has_focus,
          type: 'console',
          subtype: level,
          level,
          args: serializedArgs,
          trace,
          timestamp: now(serverDeltaMs),
        };
        if (count > 1) {
          event.repeatCount = count - 1;
        }
        return truncatePayload(cleanPayload(event));
      });

      if (!batched) {
        const event: ConsoleLogEvent = {
          source: LOGGER_NAME,
          has_focus: typeof __userplane_has_focus === 'undefined' || __userplane_has_focus,
          type: 'console',
          subtype: level,
          level,
          args: serializedArgs,
          trace,
          timestamp: now(serverDeltaMs),
        };
        try {
          dispatch(truncatePayload(cleanPayload(event)));
          // eslint-disable-next-line no-empty -- intentional: dispatch failure must not break console
        } catch {}
      }
      // eslint-disable-next-line no-empty -- intentional: console patching must never throw
    } catch {}

    // Forward to original console
    try {
      const originals = window.__userplane_logger_originals;
      const pristine = window.__userplane_pristine_natives;
      const originalFn = originals?.console?.[level];
      const pristineFn = pristine?.console?.[level];
      const args = Array.isArray(rawArgs) ? rawArgs : [rawArgs];

      if (typeof originalFn === 'function') {
        return Reflect.apply(originalFn, console, args);
      }
      if (typeof pristineFn === 'function') {
        return Reflect.apply(pristineFn, console, args);
      }
    } catch (err) {
      try {
        dispatch({
          source: LOGGER_NAME,
          has_focus: typeof __userplane_has_focus === 'undefined' || __userplane_has_focus,
          type: 'console',
          subtype: 'error',
          level: 'error',
          args: [
            `${LOGGER_PREFIX} console forward failed: ${(err as Error)?.message || String(err)}`,
          ],
          timestamp: now(serverDeltaMs),
        } as ConsoleLogEvent);
        // eslint-disable-next-line no-empty -- intentional: error reporting must not throw
      } catch {}
    }
  };
}

/**
 * Patches all console methods to intercept and log calls.
 *
 * Uses defineProperty to re-wrap if other code overwrites console methods.
 */
export function patchConsole(serverDeltaMs: number): void {
  // `console` has no index signature in TypeScript, so dynamic property access
  // (e.g. console[level], console[CONSOLE_PATCHED_FLAG]) is a type error.
  // One cast here; all dynamic accesses below go through this alias.
  const consoleRecord = console as unknown as Record<string, unknown>;
  const patchedFlags = (consoleRecord[CONSOLE_PATCHED_FLAG] =
    (consoleRecord[CONSOLE_PATCHED_FLAG] as Record<string, boolean>) || {}) as Record<
    string,
    boolean
  >;

  CONSOLE_LEVELS.forEach((level) => {
    if (patchedFlags[level]) return;
    patchedFlags[level] = true;

    let currentWrapper = createConsoleWrapper(level, serverDeltaMs);

    try {
      Object.defineProperty(console, level, {
        configurable: true,
        get: () => currentWrapper,
        set(fn) {
          // Update originals store so wrapper delegates to the new function
          if (window.__userplane_logger_originals?.console) {
            window.__userplane_logger_originals.console[level] = fn;
          }
          currentWrapper = createConsoleWrapper(level, serverDeltaMs);
        },
      });
    } catch {
      // Fallback to direct assignment for non-configurable console methods
      consoleRecord[level] = currentWrapper;
    }
  });
}

/**
 * Returns the repeat tracker map (for cleanup during unpatch).
 */
export function getRepeatTracker(): Map<string, RepeatEntry> {
  return repeatTracker;
}
