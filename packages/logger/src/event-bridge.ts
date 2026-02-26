import { CUSTOM_EVENT_NAME } from './constants';
import type { LogEvent } from './types';

let _active = true;

const TEARDOWN_EVENT_NAME = '__userplane_logger_teardown';

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

/**
 * Registers a one-shot listener for the teardown event.
 * Called by the patcher to register its unpatch closure.
 */
export function onTeardown(fn: () => void): void {
  document.addEventListener(TEARDOWN_EVENT_NAME, fn as EventListener, { once: true });
}

/**
 * Dispatches the teardown event.
 * Called by LogProcessor to signal the patcher to unpatch.
 */
export function requestTeardown(): void {
  document.dispatchEvent(new CustomEvent(TEARDOWN_EVENT_NAME));
}
