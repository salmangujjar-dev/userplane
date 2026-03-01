/**
 * patcher.ts
 *
 * Low-level browser API patcher that intercepts and captures:
 * - Console output (log, info, warn, error, debug, trace)
 * - Network requests (fetch, XMLHttpRequest)
 * - Navigation events (pushState, replaceState, popstate, hashchange, Navigation API)
 * - User interactions (clicks, pointer events)
 * - Focus/visibility changes
 * - Resource loading (via PerformanceObserver)
 * - Resource load errors (script, img, link, iframe, video, audio, source)
 * - Content Security Policy violations
 * - Unhandled promise rejections
 * - Global JS errors
 * - Page unload events
 *
 * All captured events are dispatched as CustomEvents on `document` with the
 * event name `__userplane_logger`. The LoggerManager class listens for these events.
 *
 * This module also provides a full unpatch mechanism to restore all original
 * browser APIs to their pristine state.
 */

import { createLogger } from '@userplane/console-logger';

import { CONSOLE_PATCHED_FLAG, TAB_REF_PREFIX } from './constants';
import { disableDispatch, onTeardown } from './event-bridge';

declare const __DEV__: boolean;
import {
  getRepeatTracker,
  initFocusState,
  observeResources,
  patchBeforeUnload,
  patchClicks,
  patchConsole,
  patchCSP,
  patchFetch,
  patchFocus,
  patchGlobalErrors,
  patchNavigation,
  patchResourceErrors,
  patchUnhandledRejection,
  patchXHR,
} from './interceptors';
import type { PristineNatives } from './types';

const log = createLogger('userplane-logger', {
  level: typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn',
});

/**
 * Initializes the logger by patching all browser APIs.
 *
 * Prerequisites:
 * - `window.__userplane_pristine_natives` must be set before calling this
 *   (contains references to the original, unpatched browser APIs)
 */
export function initPatches(): void {
  // Guard against double-initialization
  if (window.__userplane_logger_loaded) return;
  window.__userplane_logger_loaded = true;

  // Server time delta is now applied centrally at upload time, not in interceptors

  // ─── Handler references (for cleanup during unpatch) ──────────────

  let unhandledRejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null;
  let globalErrorHandler: ((e: ErrorEvent) => void) | null = null;
  let resourceErrorHandler: ((e: Event) => void) | null = null;
  let performanceObserver: PerformanceObserver | null = null;
  let cspHandler: ((e: SecurityPolicyViolationEvent) => void) | null = null;
  let navigationHandlers: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- navigation handler type is intentionally generic
    routeChangeHandler: Function;
    onPopState: () => void;
    onHashChange: () => void;
  } | null = null;
  let clickHandler: ((e: Event) => void) | null = null;
  let focusHandler: ((e: Event) => void) | null = null;
  let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

  // ─── Unpatch function ─────────────────────────────────────────────

  function unpatch(): void {
    disableDispatch();

    const originals = window.__userplane_logger_originals;
    const pristine = window.__userplane_pristine_natives;

    if (!originals) return;

    // Restore fetch
    try {
      Reflect.deleteProperty(window, 'fetch');
    } catch {
      /* best-effort */
    }

    // Restore history methods
    try {
      Reflect.deleteProperty(history, 'pushState');
    } catch {
      /* best-effort */
    }
    try {
      Reflect.deleteProperty(history, 'replaceState');
    } catch {
      /* best-effort */
    }

    // Restore XHR methods
    try {
      Reflect.deleteProperty(XMLHttpRequest.prototype, 'open');
    } catch {
      /* best-effort */
    }
    try {
      Reflect.deleteProperty(XMLHttpRequest.prototype, 'setRequestHeader');
    } catch {
      /* best-effort */
    }
    try {
      Reflect.deleteProperty(XMLHttpRequest.prototype, 'send');
    } catch {
      /* best-effort */
    }

    if (originals.current) {
      const { fetch: origFetch, xhrOpen, xhrSend, xhrSetRequestHeader } = originals.current;
      if (origFetch) window.fetch = origFetch;
      if (xhrOpen) XMLHttpRequest.prototype.open = xhrOpen;
      if (xhrSend) XMLHttpRequest.prototype.send = xhrSend;
      if (xhrSetRequestHeader) XMLHttpRequest.prototype.setRequestHeader = xhrSetRequestHeader;
    }

    // Restore console methods
    ['log', 'info', 'warn', 'error', 'debug', 'trace'].forEach((method) => {
      try {
        Reflect.deleteProperty(console, method);
      } catch {
        /* best-effort */
      }
    });
    const consoleSources = (pristine?.console || originals.console || {}) as Record<
      string,
      (...args: unknown[]) => void
    >;
    ['log', 'info', 'warn', 'error', 'debug', 'trace'].forEach((method) => {
      if (consoleSources[method]) {
        Reflect.set(console, method, consoleSources[method]);
      }
    });

    // Restore history
    if (originals.history.pushState) {
      history.pushState = originals.history.pushState;
    }
    if (originals.history.replaceState) {
      history.replaceState = originals.history.replaceState;
    }

    // Remove event listeners
    if (typeof unhandledRejectionHandler === 'function') {
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler as EventListener);
    }
    if (typeof globalErrorHandler === 'function') {
      window.removeEventListener('error', globalErrorHandler as EventListener, true);
    }
    if (typeof resourceErrorHandler === 'function') {
      window.removeEventListener('error', resourceErrorHandler as EventListener, true);
    }
    if (typeof cspHandler === 'function') {
      window.removeEventListener('securitypolicyviolation', cspHandler as EventListener, true);
    }

    if (navigationHandlers) {
      window.removeEventListener('popstate', navigationHandlers.onPopState);
      window.removeEventListener('hashchange', navigationHandlers.onHashChange);
    }

    if (typeof clickHandler === 'function') {
      const opts: EventListenerOptions = { capture: true };
      document.removeEventListener('click', clickHandler, opts);
      document.removeEventListener('pointerdown', clickHandler, opts);
    }

    if (typeof focusHandler === 'function') {
      window.removeEventListener('blur', focusHandler, true);
      window.removeEventListener('focus', focusHandler, true);
      document.removeEventListener('visibilitychange', focusHandler, true);
    }

    if (typeof beforeUnloadHandler === 'function') {
      window.removeEventListener('beforeunload', beforeUnloadHandler as EventListener, true);
    }

    // Clean up Navigation API hook
    try {
      window.__userplane_removeNavigationApiHook?.();
      delete window.__userplane_removeNavigationApiHook;
      // eslint-disable-next-line no-empty -- intentional: Navigation API cleanup is best-effort
    } catch {}

    // Disconnect performance observer
    if (performanceObserver) {
      performanceObserver.disconnect();
    }

    // Null out all references
    unhandledRejectionHandler = null;
    globalErrorHandler = null;
    resourceErrorHandler = null;
    cspHandler = null;
    navigationHandlers = null;
    clickHandler = null;
    focusHandler = null;
    beforeUnloadHandler = null;
    performanceObserver = null;
    window.__userplane_logger_loaded = false;

    // Clear repeat tracker timers
    try {
      const tracker = getRepeatTracker();
      for (const entry of tracker.values()) {
        if (entry?.timer) clearTimeout(entry.timer);
      }
      tracker.clear();
      // eslint-disable-next-line no-empty -- intentional: repeat tracker cleanup is best-effort
    } catch {}

    // Clear patched flags
    try {
      Reflect.deleteProperty(console, CONSOLE_PATCHED_FLAG);
    } catch {
      /* best-effort */
    }
  }

  onTeardown(unpatch);

  // ─── Validate pristine natives ────────────────────────────────────

  const pristine: PristineNatives | undefined = window.__userplane_pristine_natives;
  if (!pristine) {
    log.warn('no pristine natives found');
    return;
  }

  const tabId =
    typeof window.name === 'string' && window.name.startsWith(TAB_REF_PREFIX)
      ? window.name
      : undefined;

  // ─── Store original references ────────────────────────────────────

  window.__userplane_logger_originals = {
    native: {
      fetch: pristine.fetch,
      xhrOpen: pristine.xhr?.open,
      xhrSend: pristine.xhr?.send,
      xhrSetHeader: pristine.xhr?.setRequestHeader,
    },
    current: {
      fetch: window.fetch,
      xhrOpen: XMLHttpRequest.prototype.open,
      xhrSend: XMLHttpRequest.prototype.send,
      xhrSetRequestHeader: XMLHttpRequest.prototype.setRequestHeader,
    },
    console: pristine.console || {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    },
    history: pristine.history || {
      pushState: history.pushState,
      replaceState: history.replaceState,
    },
  };

  // ─── Patch all browser APIs ───────────────────────────────────────

  // 1. Console interception
  patchConsole();

  // 2. Unhandled promise rejections
  unhandledRejectionHandler = patchUnhandledRejection();

  // 3. Global JS errors
  globalErrorHandler = patchGlobalErrors();

  // 4. Navigation (history API, popstate, hashchange, Navigation API)
  navigationHandlers = patchNavigation(tabId);

  // 5. Click/pointer tracking
  clickHandler = patchClicks(tabId);

  // 6. Focus/visibility tracking
  focusHandler = patchFocus(tabId);
  initFocusState(tabId);

  // 7. Page unload
  beforeUnloadHandler = patchBeforeUnload(tabId);

  // 8. Fetch interception
  patchFetch();

  // 9. XHR interception
  patchXHR();

  // 10. Resource loading (PerformanceObserver)
  performanceObserver = observeResources();

  // 11. Resource load errors
  resourceErrorHandler = patchResourceErrors();

  // 12. CSP violations
  cspHandler = patchCSP();
}
