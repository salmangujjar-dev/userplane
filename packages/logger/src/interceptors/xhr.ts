import { LOGGER_NAME } from '../constants';
import { dispatch } from '../event-bridge';
import type {
  ConsoleLogEvent,
  NetworkErrorLogEvent,
  NetworkLogEvent,
  XHRTrackingData,
} from '../types';
import { parseXHRBody } from '../utils/body-parser';
import { isTextContentType } from '../utils/content-type';
import { parseResponseHeaders } from '../utils/headers';
import { HTTP_STATUS_TEXT } from '../utils/http-status';
import { enrichWithPerformance } from '../utils/performance';
import { shouldLogNetwork } from '../utils/throttle';
import { truncatePayload } from '../utils/truncation';

const BODY_LIMIT = 131072; // 128KB
const BODY_TRUNCATION_MSG = '\n\n[Body truncated over the 128KB limit]';
const xhrMetadata = new WeakMap<XMLHttpRequest, XHRTrackingData>();

function now(serverDeltaMs: number): number {
  return Date.now() + serverDeltaMs;
}

function logNetworkErrorToConsole(
  method: string,
  url: string,
  status: number | null,
  statusText: string | null,
  fallbackText: string | null,
  serverDeltaMs: number
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
        has_focus: typeof __userplane_has_focus === 'undefined' || __userplane_has_focus,
        type: 'console',
        subtype: level,
        level,
        args: [message],
        timestamp: now(serverDeltaMs),
      } as ConsoleLogEvent)
    );
    // eslint-disable-next-line no-empty -- intentional: header parsing is best-effort
  } catch {}
}

/**
 * Creates a wrapper for XMLHttpRequest.prototype.open that tracks request metadata.
 */
function createOpenWrapper(
  _original: typeof XMLHttpRequest.prototype.open,
  nativeOpen: typeof XMLHttpRequest.prototype.open,
  serverDeltaMs: number
): typeof XMLHttpRequest.prototype.open {
  return function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async: boolean = true,
    user: string | null = null,
    password: string | null = null
  ) {
    const tracking: XHRTrackingData = {
      type: 'xhr',
      request: {
        method,
        url: String(url),
        async,
        user,
        pass: password,
        headers: {},
        body: null,
        startTime: performance.now(),
        timestamp: now(serverDeltaMs),
      },
      response: {
        status: 0,
        headers: {},
        body: null,
        endTime: 0,
        totalTime: 0,
      },
    };

    xhrMetadata.set(this, tracking);
    return nativeOpen.apply(this, [method, url, async, user, password]);
  };
}

/**
 * Creates a wrapper for XMLHttpRequest.prototype.setRequestHeader that captures headers.
 */
function createSetRequestHeaderWrapper(
  _original: typeof XMLHttpRequest.prototype.setRequestHeader,
  nativeSetHeader: typeof XMLHttpRequest.prototype.setRequestHeader
): typeof XMLHttpRequest.prototype.setRequestHeader {
  return function (this: XMLHttpRequest, name: string, value: string) {
    const tracking = xhrMetadata.get(this);
    if (tracking) {
      tracking.request.headers[name] = value;
    }
    return nativeSetHeader.call(this, name, value);
  };
}

/**
 * Creates a wrapper for XMLHttpRequest.prototype.send that intercepts and logs requests.
 */
function createSendWrapper(
  _original: typeof XMLHttpRequest.prototype.send,
  nativeSend: typeof XMLHttpRequest.prototype.send,
  serverDeltaMs: number
): typeof XMLHttpRequest.prototype.send {
  return function (
    this: XMLHttpRequest,
    ...args: Parameters<typeof XMLHttpRequest.prototype.send>
  ) {
    const [body] = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- XHR patching needs this reference for async callbacks
    const xhr = this;
    const tracking = xhrMetadata.get(xhr);

    if (tracking) {
      tracking.request.body = body ? parseXHRBody(body) : null;
    }

    let handled = false;

    // readystatechange handler
    this.addEventListener('readystatechange', function () {
      if (xhr.readyState !== XMLHttpRequest.DONE || handled) return;

      const endTime = performance.now();
      let rawHeaders = '';
      try {
        rawHeaders = xhr.getAllResponseHeaders() || '';
        // eslint-disable-next-line no-empty -- intentional: response header parsing is best-effort
      } catch {}

      const headers = parseResponseHeaders(rawHeaders);
      const contentType = headers['Content-Type'] || headers['content-type'] || '';
      const isTextType = !contentType || isTextContentType(contentType);
      const isTextResponse = xhr.responseType === '' || xhr.responseType === 'text';

      if (tracking) {
        tracking.response = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers,
          body: null,
          endTime,
          totalTime: endTime - tracking.request.startTime,
          url: tracking.request.url,
        };

        // Enrich with performance timing
        enrichWithPerformance(tracking.request.url, 'xmlhttprequest', tracking.response);
        if (tracking.response.performance?.duration) {
          tracking.response.totalTime = tracking.response.performance.duration;
          tracking.response.duration = tracking.response.performance.duration;
        }
        if (tracking.response.performance?.nextHopProtocol) {
          tracking.response.nextHopProtocol = tracking.response.performance.nextHopProtocol;
        }

        if (handled) return;
        handled = true;

        queueMicrotask(() => {
          try {
            // Capture response body
            if (isTextType && isTextResponse && typeof xhr.responseText === 'string') {
              const text = xhr.responseText;
              let captured = text.slice(0, BODY_LIMIT);
              if (text.length > BODY_LIMIT) {
                captured += BODY_TRUNCATION_MSG;
                tracking.response.truncated = true;
              }
              tracking.response.body = captured;
            }

            // Emit network event
            try {
              const isError = tracking.response.status >= 400;
              const key = `xhr|${tracking.request.method}|${tracking.request.url}|${isError ? tracking.response.status : 200}`;
              if (!shouldLogNetwork(key)) return;

              dispatch({
                source: LOGGER_NAME,
                has_focus: __userplane_has_focus,
                type: isError ? 'network-error' : 'network',
                initiatorType: 'xhr',
                requestDetails: tracking,
                timestamp: now(serverDeltaMs),
              } as NetworkLogEvent);

              if (isError) {
                logNetworkErrorToConsole(
                  tracking.request.method,
                  tracking.response.url || tracking.request.url || '',
                  tracking.response.status,
                  tracking.response.statusText || null,
                  null,
                  serverDeltaMs
                );
              }
              // eslint-disable-next-line no-empty -- intentional: network event dispatch is best-effort
            } catch {}
            // eslint-disable-next-line no-empty -- intentional: XHR response processing must not throw
          } catch {}
        });
      }
    });

    // Error handler
    this.addEventListener(
      'error',
      function () {
        if (handled) return;
        handled = true;
        if (!tracking) return;

        dispatch({
          source: LOGGER_NAME,
          has_focus: __userplane_has_focus,
          type: 'network-error',
          initiatorType: 'xhr',
          url: tracking.request.url,
          method: tracking.request.method,
          error: 'error',
          timestamp: now(serverDeltaMs),
        } as NetworkErrorLogEvent);

        logNetworkErrorToConsole(
          tracking.request.method,
          tracking.request.url,
          null,
          null,
          '(Network error)',
          serverDeltaMs
        );
      },
      { once: true }
    );

    // Abort handler
    this.addEventListener(
      'abort',
      function () {
        if (handled) return;
        handled = true;
        if (!tracking) return;

        dispatch({
          source: LOGGER_NAME,
          has_focus: __userplane_has_focus,
          type: 'network-error',
          initiatorType: 'xhr',
          url: tracking.request.url,
          method: tracking.request.method,
          error: 'abort',
          timestamp: now(serverDeltaMs),
        } as NetworkErrorLogEvent);

        logNetworkErrorToConsole(
          tracking.request.method,
          tracking.request.url,
          null,
          null,
          '(Abort)',
          serverDeltaMs
        );
      },
      { once: true }
    );

    // Timeout handler
    this.addEventListener(
      'timeout',
      function () {
        if (handled) return;
        handled = true;
        if (!tracking) return;

        dispatch({
          source: LOGGER_NAME,
          has_focus: __userplane_has_focus,
          type: 'network-error',
          initiatorType: 'xhr',
          url: tracking.request.url,
          method: tracking.request.method,
          error: 'timeout',
          timestamp: now(serverDeltaMs),
        } as NetworkErrorLogEvent);

        logNetworkErrorToConsole(
          tracking.request.method,
          tracking.request.url,
          null,
          null,
          '(Timeout)',
          serverDeltaMs
        );
      },
      { once: true }
    );

    return nativeSend.apply(this, args);
  };
}

/**
 * Patches XMLHttpRequest.prototype.open, .setRequestHeader, and .send
 * to intercept and log all XHR requests.
 *
 * Uses defineProperty to re-wrap if other code overwrites XHR methods.
 */
export function patchXHR(serverDeltaMs: number): void {
  const originals = window.__userplane_logger_originals!.native;
  const nativeOpen = originals.xhrOpen!;
  const nativeSend = originals.xhrSend!;
  const nativeSetHeader = originals.xhrSetHeader!;

  const proto = XMLHttpRequest.prototype;

  // Patch open
  let currentOpen = createOpenWrapper(proto.open, nativeOpen, serverDeltaMs);
  try {
    Object.defineProperty(proto, 'open', {
      configurable: true,
      get: () => currentOpen,
      set(fn) {
        currentOpen = createOpenWrapper(fn, nativeOpen, serverDeltaMs);
      },
    });
  } catch {
    // Fallback to direct assignment if prototype is frozen/non-configurable
    proto.open = currentOpen;
  }

  // Patch setRequestHeader
  let currentSetHeader = createSetRequestHeaderWrapper(proto.setRequestHeader, nativeSetHeader);
  try {
    Object.defineProperty(proto, 'setRequestHeader', {
      configurable: true,
      get: () => currentSetHeader,
      set(fn) {
        currentSetHeader = createSetRequestHeaderWrapper(fn, nativeSetHeader);
      },
    });
  } catch {
    // Fallback to direct assignment if prototype is frozen/non-configurable
    proto.setRequestHeader = currentSetHeader;
  }

  // Patch send
  let currentSend = createSendWrapper(proto.send, nativeSend, serverDeltaMs);
  try {
    Object.defineProperty(proto, 'send', {
      configurable: true,
      get: () => currentSend,
      set(fn) {
        currentSend = createSendWrapper(fn, nativeSend, serverDeltaMs);
      },
    });
  } catch {
    // Fallback to direct assignment if prototype is frozen/non-configurable
    proto.send = currentSend;
  }
}
