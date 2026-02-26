import { LOGGER_FILE_PATTERNS, LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type { ConsoleLogEvent } from '../types';
import { serializeValue } from '../utils/serialization';

/**
 * Creates and registers the unhandled promise rejection handler.
 * Returns the handler function for later removal.
 */
export function patchUnhandledRejection(serverDeltaMs: number): (e: PromiseRejectionEvent) => void {
  const handler = (e: PromiseRejectionEvent): void => {
    const reason = e.reason;
    // Skip errors originating from the logger itself
    if (reason?.stack && LOGGER_FILE_PATTERNS.some((p) => reason.stack.includes(p))) return;

    try {
      dispatch({
        source: LOGGER_NAME,
        has_focus: __userplane_has_focus,
        type: 'console',
        subtype: 'error',
        level: 'error',
        args: [
          'Unhandled Promise Rejection:',
          reason instanceof Error
            ? { name: reason.name, message: reason.message, stack: reason.stack }
            : serializeValue(reason)!,
        ],
        timestamp: Date.now() + serverDeltaMs,
      } as ConsoleLogEvent);
      // eslint-disable-next-line no-empty -- intentional: rejection handler must not throw
    } catch {}
  };

  window.addEventListener('unhandledrejection', handler);
  return handler;
}

/**
 * Checks if an error originates from logger scripts.
 */
function isLoggerError(filename: string | undefined): boolean {
  return !!filename && LOGGER_FILE_PATTERNS.some((p) => filename.includes(p));
}

/**
 * Creates and registers the global error handler for JS errors.
 * Returns the handler function for later removal.
 */
export function patchGlobalErrors(serverDeltaMs: number): (e: ErrorEvent) => void {
  const handler = (e: ErrorEvent): void => {
    // Skip logger's own errors and resource load errors (handled separately)
    if (isLoggerError(e.filename) || e.target instanceof HTMLElement) return;

    try {
      dispatch({
        source: LOGGER_NAME,
        has_focus: __userplane_has_focus,
        type: 'console',
        subtype: 'error',
        level: 'error',
        args: [`JS Error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`],
        timestamp: Date.now() + serverDeltaMs,
      } as ConsoleLogEvent);
      // eslint-disable-next-line no-empty -- intentional: global error handler must not throw
    } catch {}
  };

  window.addEventListener('error', handler, true);
  return handler;
}
