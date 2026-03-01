import { LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type { LastNavigation, UserActionLogEvent } from '../types';
import { shouldLogNavigation } from '../utils/throttle';

let lastHref = window.location.href;
let lastNav: LastNavigation = { from: null, to: lastHref, method: null };

type RouteChangeHandler = (
  method: string,
  from: string | null,
  to: string | null,
  extra?: Record<string, unknown>
) => void;

let routeChangeHandler: RouteChangeHandler;
let tabId: string | undefined;

/**
 * Throttled version of routeChangeHandler that deduplicates rapid navigation events.
 */
function throttledRouteChange(
  method: string,
  from: string,
  to: string,
  extra?: Record<string, unknown>
): void {
  if (!shouldLogNavigation(method, from, to)) return;
  routeChangeHandler(method, from, to, extra);
}

/**
 * Creates a wrapper for history.pushState that intercepts and re-wraps any value set to it.
 */
function createPushStateWrapper(
  original: typeof history.pushState,
  nativeOriginals: {
    pushState: typeof history.pushState;
    replaceState: typeof history.replaceState;
  }
): typeof history.pushState {
  return function (this: History, ...args: Parameters<typeof history.pushState>) {
    const [, title, url] = args;
    const beforeUrl = window.location.href;
    const result =
      typeof original === 'function'
        ? original.apply(this, args)
        : nativeOriginals.pushState.apply(this, args);
    const afterUrl = new URL(url ?? window.location.href, window.location.origin).href;

    if (typeof routeChangeHandler === 'function') {
      queueMicrotask(() =>
        throttledRouteChange('pushState', beforeUrl, afterUrl, {
          method: 'pushState',
          title,
          url: afterUrl,
        })
      );
    }

    return result;
  };
}

/**
 * Creates a wrapper for history.replaceState that intercepts and re-wraps any value set to it.
 */
function createReplaceStateWrapper(
  original: typeof history.replaceState,
  nativeOriginals: {
    pushState: typeof history.pushState;
    replaceState: typeof history.replaceState;
  }
): typeof history.replaceState {
  return function (this: History, ...args: Parameters<typeof history.replaceState>) {
    const [, title, url] = args;
    const beforeUrl = window.location.href;
    const result =
      typeof original === 'function'
        ? original.apply(this, args)
        : nativeOriginals.replaceState.apply(this, args);
    const afterUrl = new URL(url ?? window.location.href, window.location.origin).href;

    if (typeof routeChangeHandler === 'function') {
      queueMicrotask(() =>
        throttledRouteChange('replaceState', beforeUrl, afterUrl, {
          method: 'replaceState',
          title,
          url: afterUrl,
        })
      );
    }

    return result;
  };
}

function onPopState(): void {
  throttledRouteChange('popstate', lastHref, window.location.href, {});
}

function onHashChange(): void {
  throttledRouteChange('hashchange', lastHref, window.location.href, {});
}

/**
 * Patches history.pushState, history.replaceState, popstate, hashchange,
 * and the Navigation API to track SPA route changes.
 *
 * Returns cleanup functions for popstate/hashchange listeners.
 */
export function patchNavigation(_tabId: string | undefined): {
  routeChangeHandler: RouteChangeHandler;
  onPopState: () => void;
  onHashChange: () => void;
} {
  tabId = _tabId;

  const nativeOriginals = window.__userplane_logger_originals?.history ?? {
    pushState: history.pushState,
    replaceState: history.replaceState,
  };

  // Set up the route change handler
  routeChangeHandler = (
    method: string = 'event',
    from: string | null = null,
    to: string | null = null,
    extra: Record<string, unknown> = {}
  ) => {
    const fromUrl = from || lastHref;
    const toUrl = to || window.location.href;
    const triggeredBy = (extra.method as string) || method;

    const isDuplicate = lastNav.from === fromUrl && lastNav.to === toUrl;
    const isNonTrivialReplace = method !== 'replaceState' || lastNav.to !== toUrl;

    if (!isDuplicate && isNonTrivialReplace) {
      dispatch({
        source: LOGGER_NAME,
        has_focus: window.__userplane_has_focus,
        tabId,
        type: 'user-action',
        data: {
          action: 'spa_route',
          from: fromUrl,
          to: toUrl,
          triggeredBy: method,
          ...extra,
        },
      } as UserActionLogEvent);

      lastHref = toUrl;
      lastNav = { from: fromUrl, to: toUrl, method: triggeredBy };
    }
  };

  // Wrap pushState and replaceState
  let currentPushState = history.pushState;
  let currentReplaceState = history.replaceState;

  history.pushState = createPushStateWrapper(currentPushState, nativeOriginals);
  history.replaceState = createReplaceStateWrapper(currentReplaceState, nativeOriginals);

  // Use defineProperty to intercept future overwrites
  Object.defineProperty(history, 'pushState', {
    configurable: true,
    get: () => currentPushState,
    set(fn) {
      currentPushState = createPushStateWrapper(fn, nativeOriginals);
    },
  });

  Object.defineProperty(history, 'replaceState', {
    configurable: true,
    get: () => currentReplaceState,
    set(fn) {
      currentReplaceState = createReplaceStateWrapper(fn, nativeOriginals);
    },
  });

  // Listen for popstate and hashchange
  window.addEventListener('popstate', onPopState);
  window.addEventListener('hashchange', onHashChange);

  // Hook into the Navigation API if available
  if ('navigation' in window) {
    try {
      const navHandler = () => {
        try {
          const from = lastHref || window.location.href;
          const to = window.location.href;
          if (typeof routeChangeHandler === 'function') {
            routeChangeHandler('navigation-api', from, to, { method: 'navigation-api' });
          }
          // eslint-disable-next-line no-empty -- intentional: Navigation API handler is best-effort
        } catch {}
      };
      window.navigation!.addEventListener('currententrychange', navHandler);
      window.__userplane_removeNavigationApiHook = () => {
        try {
          window.navigation!.removeEventListener('currententrychange', navHandler);
          // eslint-disable-next-line no-empty -- intentional: Navigation API cleanup is best-effort
        } catch {}
      };
      // eslint-disable-next-line no-empty -- intentional: Navigation API setup is best-effort
    } catch {}
  }

  return { routeChangeHandler, onPopState, onHashChange };
}

/**
 * Returns the current last known href (for use by other interceptors).
 */
export function getLastHref(): string {
  return lastHref;
}
