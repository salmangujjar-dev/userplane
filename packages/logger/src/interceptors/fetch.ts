import { LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type {
  ConsoleLogEvent,
  NetworkErrorLogEvent,
  NetworkLogEvent,
  NetworkResponseInfo,
} from '../types';
import { parseFetchBody } from '../utils/body-parser';
import { isTextContentType } from '../utils/content-type';
import { HTTP_STATUS_TEXT } from '../utils/http-status';
import { enrichWithPerformance } from '../utils/performance';
import { shouldLogNetwork } from '../utils/throttle';
import { now } from '../utils/time';
import { truncatePayload } from '../utils/truncation';
import { isSameSite } from '../utils/url';
import { isCrossOrigin } from '../utils/url';

const BODY_LIMIT = 131072; // 128KB
const BODY_TRUNCATION_MSG = '\n\n[Body truncated over the 128KB limit]';

/**
 * Logs a network error to the console log stream (as the original code does).
 */
function logNetworkErrorToConsole(
  method: string,
  url: string,
  status: number | null,
  statusText: string | null,
  fallbackText: string | null
): void {
  try {
    const level = 'error';
    const resolvedText =
      (statusText && String(statusText).trim()) ||
      (status ? HTTP_STATUS_TEXT[status] : undefined) ||
      undefined;
    const parts: string[] = [method || 'GET', url];

    if (status) {
      parts.push(String(status));
      if (resolvedText) parts.push(`(${resolvedText})`);
    } else if (fallbackText) {
      parts.push(fallbackText);
    }

    const message = parts.filter(Boolean).join(' ');
    dispatch(
      truncatePayload({
        source: LOGGER_NAME,
        has_focus: window.__userplane_has_focus ?? true,
        type: 'console',
        subtype: level,
        level,
        args: [message],
        timestamp: now(),
      } as ConsoleLogEvent)
    );
    // eslint-disable-next-line no-empty -- intentional: network error console logging is best-effort
  } catch {}
}

/**
 * Creates a fetch wrapper that intercepts and logs network requests.
 */
function createFetchWrapper(originalFetch: typeof fetch): typeof fetch {
  return function (this: unknown, ...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
    const startTime = performance.now();
    const fetchFn =
      typeof originalFetch === 'function'
        ? originalFetch
        : window.__userplane_logger_originals?.current?.fetch || fetch;

    // Build requestInfo before the fetch call so it's accessible in both .then() and .catch()
    const method =
      args[0] instanceof Request ? args[0].method : (args[1] as RequestInit)?.method || 'GET';
    const url = args[0] instanceof Request ? args[0].url : String(args[0]);

    const requestInfo = {
      method,
      url,
      headers: {} as Record<string, string>,
      body: null as ReturnType<typeof parseFetchBody> | null,
      startTime,
      timestamp: now(),
    };

    // Extract request headers and body
    try {
      if (args[0] instanceof Request) {
        const cloned = args[0].clone();
        cloned.headers.forEach((v, k) => (requestInfo.headers[k] = v));
        if (!cloned.body?.locked) {
          cloned
            .text()
            .then((text) => {
              requestInfo.body = parseFetchBody(text);
            })
            .catch(() => {});
        }
      }
      const init = args[1] as RequestInit | undefined;
      if (init?.headers) {
        const headers =
          init.headers instanceof Headers ? init.headers : new Headers(init.headers as HeadersInit);
        headers.forEach((v, k) => (requestInfo.headers[k] = v));
      }
      if (init?.body) {
        requestInfo.body = parseFetchBody(init.body);
      }
      // eslint-disable-next-line no-empty -- intentional: request header extraction is best-effort
    } catch {}

    const promise = fetchFn.apply(this, args);

    promise
      .then((response) => {
        try {
          const responseInfo: NetworkResponseInfo = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            duration: performance.now() - startTime,
            headers: {},
            body: null,
          };
          response.headers.forEach((v, k) => (responseInfo.headers[k] = v));

          // Clone immediately while the body stream is still unlocked
          const responseClone = response.clone();

          // Deferred processing (match original's setTimeout(..., 0))
          setTimeout(() => {
            try {
              responseInfo.url = response.url || requestInfo.url || '';

              // Enrich with performance timing data
              try {
                enrichWithPerformance(requestInfo.url, 'fetch', responseInfo);
                if (responseInfo.performance?.duration) {
                  responseInfo.duration = responseInfo.performance.duration;
                }
                if (responseInfo.performance?.nextHopProtocol) {
                  responseInfo.nextHopProtocol = responseInfo.performance.nextHopProtocol;
                }
                // eslint-disable-next-line no-empty -- intentional: performance enrichment is optional
              } catch {}

              // Skip .js files
              if (/\.(js)(\?|$)/i.test(requestInfo.url || '')) {
                emitNetworkEvent();
                return;
              }

              const contentType = response.headers.get('content-type') || '';

              // Check if we should capture the body (same-site, text content)
              let shouldSkipBody = false;
              try {
                const pageUrl = new URL(location.href);
                const reqUrl = new URL(
                  responseInfo.url || requestInfo.url || response.url || '',
                  location.href
                );

                const sameSite = isSameSite(pageUrl, reqUrl);
                if (
                  !sameSite ||
                  response.type === 'opaque' ||
                  !isTextContentType(response.headers.get('content-type') || '')
                ) {
                  shouldSkipBody = true;
                }
              } catch {
                shouldSkipBody = true;
              }

              if (shouldSkipBody) {
                emitNetworkEvent();
                return;
              }

              if (isTextContentType(contentType)) {
                try {
                  responseClone
                    .text()
                    .then((text) => {
                      let captured = text.slice(0, BODY_LIMIT);
                      if (text.length > BODY_LIMIT) {
                        captured += BODY_TRUNCATION_MSG;
                        responseInfo.truncated = true;
                      }
                      responseInfo.body = { type: 'text', body: captured };
                      emitNetworkEvent();
                    })
                    .catch(emitNetworkEvent);
                } catch {
                  emitNetworkEvent();
                }
              } else {
                emitNetworkEvent();
              }

              function emitNetworkEvent(): void {
                try {
                  const key = `fetch|${requestInfo.method}|${requestInfo.url}|${responseInfo.status}`;
                  if (!shouldLogNetwork(key)) return;

                  const isError = responseInfo.status >= 400 || responseInfo.ok === false;
                  dispatch({
                    source: LOGGER_NAME,
                    has_focus: window.__userplane_has_focus,
                    type: isError ? 'network-error' : 'network',
                    initiatorType: 'fetch',
                    request: requestInfo,
                    response: responseInfo,
                    timestamp: now(),
                  } as NetworkLogEvent);

                  if (isError) {
                    logNetworkErrorToConsole(
                      requestInfo.method,
                      responseInfo.url || requestInfo.url || '',
                      responseInfo.status,
                      responseInfo.statusText || null,
                      null
                    );
                  }
                  // eslint-disable-next-line no-empty -- intentional: response body read is best-effort
                } catch {}
              }
              // eslint-disable-next-line no-empty -- intentional: deferred processing must not throw
            } catch {}
          }, 0);
          // eslint-disable-next-line no-empty -- intentional: fetch interception must not break response
        } catch {}

        return response;
      })
      .catch((error) => {
        try {
          let errorType: string;
          if (error && error.name === 'AbortError') {
            errorType = 'abort';
          } else if (error && error.name === 'TypeError' && isCrossOrigin(requestInfo.url)) {
            errorType = 'cors';
          } else {
            errorType = 'network';
          }

          dispatch({
            source: LOGGER_NAME,
            has_focus: window.__userplane_has_focus,
            type: 'network-error',
            initiatorType: 'fetch',
            request: requestInfo,
            url: requestInfo.url,
            method: requestInfo.method,
            error: errorType,
            message: error?.message || undefined,
            timestamp: now(),
          } as NetworkErrorLogEvent);

          logNetworkErrorToConsole(
            requestInfo.method,
            requestInfo.url,
            null,
            null,
            '(Network error)'
          );
          // eslint-disable-next-line no-empty -- intentional: catch handler logging must not suppress the original error
        } catch {}

        throw error;
      });

    return promise;
  } as typeof fetch;
}

/**
 * Patches window.fetch to intercept and log all fetch requests.
 * Uses defineProperty to re-wrap if other code overwrites fetch.
 */
export function patchFetch(): void {
  let currentFetch = createFetchWrapper(window.fetch);

  Object.defineProperty(window, 'fetch', {
    configurable: true,
    get: () => currentFetch,
    set(fn: typeof fetch) {
      currentFetch = createFetchWrapper(fn);
    },
  });
}
