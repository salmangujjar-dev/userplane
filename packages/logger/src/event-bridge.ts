import { CUSTOM_EVENT_NAME } from './constants';
import type { LogEvent } from './types';

let _active = true;

/**
 * Dispatches a log event via a CustomEvent on document.
 * The LoggerManager listens for these events.
 */
export function dispatch(event: LogEvent): void {
  if (_active) {
    document.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: event }));
  }
}

/**
 * Enables event dispatching.
 */
export function enableDispatch(): void {
  _active = true;
}

/**
 * Disables event dispatching (used during unpatch).
 */
export function disableDispatch(): void {
  _active = false;
}

/**
 * Returns whether dispatching is currently active.
 */
export function isDispatchActive(): boolean {
  return _active;
}
