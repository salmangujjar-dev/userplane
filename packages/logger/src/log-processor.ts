/**
 * log-processor.ts
 *
 * High-level log processor that:
 * - Listens for `__userplane_logger` CustomEvents from the low-level patcher
 * - Processes and normalizes raw events into structured log entries
 * - Routes entries through a save function callback
 * - Manages tab state (active/background/unknown)
 * - Handles start/stop/pause/resume lifecycle
 * - Filters internal endpoints
 * - Formats protocol names for display
 * - Optionally masks response bodies for privacy
 */

import { createLogger } from '@workspace/console-logger';

import {
  buildEndpointMatchers,
  CUSTOM_EVENT_NAME,
  DEFAULT_INTERNAL_ENDPOINTS,
  LOGGER_PREFIX,
} from './constants';
import { BatchedDispatcher, ImmediateDispatcher } from './dispatch-strategy';
import type {
  ConsoleLogEvent,
  DispatchContext,
  DispatchMode,
  DispatchStrategy,
  FlushFunction,
  LogEvent,
  ProcessedConsoleEntry,
  ProcessedLogEntry,
  ProcessedNetworkEntry,
  ProcessedUserStepEntry,
  SaveFunction,
  TabInfo,
  TrackingStepData,
  TrackingStepLogEvent,
} from './types';

declare const __DEV__: boolean;

const log = createLogger('userplane-logger', {
  level: typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn',
});

const TAB_STATE = {
  UNKNOWN: 0 as const,
  BACKGROUND: 1 as const,
  ACTIVE: 2 as const,
};

const ALLOWED_RESPONSE_CONTENT_TYPES = [
  'application/json',
  'application/xml',
  'application/x-www-form-urlencoded',
  'text/plain',
];

export class LogProcessor {
  // ─── Configuration ──────────────────────────────────────────────

  private _tabId: string;
  private _saveFunction: SaveFunction | undefined;
  private _isFocused: boolean = false;
  private _isSending: boolean = false;
  private _isPaused: boolean = false;
  private _workspaceId: string;
  private _loggingEnabled: boolean;
  private _maskResponseBody: boolean = false;
  private _scriptUrl: string;
  private _initialLogCaptured: boolean = false;
  private _serverDeltaMs: number;
  private _internalEndpointMatchers: RegExp[];

  // ─── Dispatch ──────────────────────────────────────────────────

  private readonly _dispatcher: DispatchStrategy;

  // ─── Tab Management ─────────────────────────────────────────────

  readonly tabs = new Map<string, TabInfo>();
  private currentActive: string | null = null;

  // ─── Event Listener Reference ───────────────────────────────────

  private readonly loggerRelayListener = (e: CustomEvent<LogEvent>): void => {
    this.processLogEvent(e.detail);
  };

  constructor(
    tabId: string,
    saveFunction: SaveFunction,
    workspaceId: string,
    loggingEnabled: boolean,
    scriptUrl: string,
    serverDeltaMs: number,
    internalEndpoints?: string[],
    options?: {
      dispatchMode?: DispatchMode;
      flushInterval?: number;
      maxBufferSize?: number;
      flushFunction?: FlushFunction;
    }
  ) {
    this._workspaceId = workspaceId;
    this._loggingEnabled = loggingEnabled;
    this._scriptUrl = scriptUrl;
    this._serverDeltaMs = serverDeltaMs;
    this._tabId = tabId;
    this._saveFunction = saveFunction;
    this._internalEndpointMatchers = buildEndpointMatchers(
      internalEndpoints ?? DEFAULT_INTERNAL_ENDPOINTS
    );

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- ctx getters need stable `self` reference
    const self = this;
    const ctx: DispatchContext = {
      get tabId() {
        return self._tabId;
      },
      serverNow: () => this.serverNow(),
      get saveFunction() {
        return self._saveFunction;
      },
    };

    this._dispatcher =
      (options?.dispatchMode ?? 'immediate') === 'batched'
        ? new BatchedDispatcher(ctx, {
            flushInterval: options?.flushInterval,
            maxBufferSize: options?.maxBufferSize,
            flushFunction: options?.flushFunction,
          })
        : new ImmediateDispatcher(ctx);
  }

  // ─── Time ───────────────────────────────────────────────────────

  serverNow(): number {
    return Date.now() + this._serverDeltaMs;
  }

  // ─── Configuration Setters ──────────────────────────────────────

  initialize(tabId: string, saveFunction: SaveFunction): void {
    this._tabId = tabId;
    this._saveFunction = saveFunction;
    this._initialLogCaptured = false;
  }

  setLoggingEnabled(enabled: boolean): void {
    this._loggingEnabled = enabled;
  }

  setMaskResponseBody(mask: boolean): void {
    this._maskResponseBody = mask;
  }

  setFocus(focused: boolean): void {
    this._isFocused = focused;
  }

  isSending(): boolean {
    return this._isSending;
  }

  // ─── Internal Endpoint Filtering ────────────────────────────────

  isInternalRequest(url: string): boolean {
    try {
      const resolved = new URL(url, window.location.origin);
      return this._internalEndpointMatchers.some((pattern) => pattern.test(resolved.href));
    } catch {
      return false;
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  /**
   * Starts the logger. If `isResume` is false, injects the logger script
   * into the page and sets up the event relay listener.
   */
  start(isResume: boolean = false, pausedFor: number = 0): void {
    if (this._isSending) return;

    if (!isResume) {
      // Remove and re-add the relay listener
      document.removeEventListener(CUSTOM_EVENT_NAME, this.loggerRelayListener as EventListener);
      document.addEventListener(CUSTOM_EVENT_NAME, this.loggerRelayListener as EventListener);

      // Set server delta for the low-level logger
      window.__userplane_server_delta_ms = this._serverDeltaMs;

      // If already loaded, don't inject again
      if (window.__userplane_logger_loaded) return;

      // Inject the logger script
      const script = document.createElement('script');
      script.src = this._scriptUrl;
      let loaded = false;

      const confirmLoad = (): void => {
        if (loaded) {
          log.info('initialization successful - console logs ready');
        }
      };

      script.onload = () => {
        loaded = true;
        script.remove();
        setTimeout(confirmLoad, 1000);
      };

      script.onerror = () => {
        log.error({ scriptUrl: this._scriptUrl }, 'failed to load logger script');
        loaded = false;
        this._saveFunction?.({
          event: 'log_console',
          tabId: this._tabId,
          data: {
            log_type: 'console',
            type: 'console',
            args: [`${LOGGER_PREFIX} logger failed to load`, this._scriptUrl],
            timestamp: this.serverNow(),
            url: '',
          },
          is_single_log: true,
          timestamp: this.serverNow(),
          has_focus: this._isFocused,
          tab_details: {
            location: window.location.href,
            title: document.title,
            window_width: window.innerWidth,
            window_height: window.innerHeight,
          },
        });
      };

      (document.head || document.documentElement).appendChild(script);

      // Warn if tab is hidden (script loading may be delayed)
      if (document.hidden) {
        setTimeout(() => {
          if (!loaded) {
            log.warn('logger script delayed (tab hidden), waiting...');
          }
        }, 5000);
      }
    }

    this._isPaused = false;
    this._isSending = true;

    // Initialize tab state
    if (!this.tabs.has(this._tabId)) {
      this.tabs.set(this._tabId, {
        state: TAB_STATE.UNKNOWN,
        url: window.location.href,
        lastUnloadTs: 0,
      });
    }

    // Start the dispatcher (no-op for immediate, starts interval + listeners for batched)
    this._dispatcher.start();

    // Log resume event
    if (isResume) {
      this._addUserStep(this._tabId, {
        action: 'recorder-resume',
        tabId: this._tabId,
        paused_for: pausedFor,
      } as TrackingStepData);
    }
  }

  /**
   * Pauses the logger (stops sending but keeps hooks in place).
   */
  pause(): void {
    this.stop(true);
  }

  /**
   * Resumes from a paused state.
   */
  resume(pausedFor: number = 0): void {
    this.start(true, pausedFor);
  }

  /**
   * Stops the logger. If `isPause` is true, only pauses (keeps hooks).
   * If false, fully unpatches and removes all hooks.
   */
  stop(isPause: boolean = false): void {
    if (!this._isSending && !this._isPaused) return;

    if (isPause) {
      // Pause: stop interval + flush, but keep unload listeners
      this._dispatcher.pause();
      this._addUserStep(this._tabId, {
        action: 'recorder-pause',
        tabId: this._tabId,
      } as TrackingStepData);
    } else {
      // Full stop: interval + flush + remove listeners
      this._dispatcher.stop();

      // Unpatch everything
      if (typeof window.__userplane_logger_unpatch === 'function') {
        window.__userplane_logger_unpatch();
      }
      this._initialLogCaptured = false;
      try {
        document.removeEventListener(CUSTOM_EVENT_NAME, this.loggerRelayListener as EventListener);
        // eslint-disable-next-line no-empty -- intentional: listener removal is best-effort
      } catch {}
    }

    this._isPaused = isPause;
    this._isSending = false;
  }

  /**
   * Destroys the logger completely.
   */
  destroy(): void {
    try {
      this.stop(false);
      // eslint-disable-next-line no-empty -- intentional: destroy must not throw
    } catch {}
    this._dispatcher.destroy();
    this._saveFunction = undefined;
    this.tabs.clear();
    this.currentActive = null;
  }

  // ─── Protocol Formatting ────────────────────────────────────────

  formatNextHopProtocol(protocol: string): string {
    switch (protocol) {
      case 'http/1.1':
        return 'HTTP/1.1';
      case 'h2':
        return 'HTTP/2';
      case 'h3':
        return 'HTTP/3';
      case 'quic':
        return 'QUIC';
      case 'ws':
        return 'WebSocket';
      case 'wss':
        return 'WebSocket Secure';
      case 'ftp':
        return 'FTP';
      case '':
        return '—';
      default:
        return protocol || '—';
    }
  }

  // ─── Event Emission ────────────────────────────────────────────

  /**
   * Sends a processed log entry through the save function.
   * In immediate mode, dispatches right away. In batched mode, buffers entries.
   */
  private emitEntry(entry: ProcessedLogEntry): void {
    if (!this._isSending || !this._loggingEnabled) return;
    this._dispatcher.emit(entry);
  }

  // ─── Duration Computation ───────────────────────────────────────

  /* eslint-disable @typescript-eslint/no-explicit-any -- event payloads are untyped from the content script */
  private _computeDuration(
    request: Record<string, any> | null,
    response: Record<string, any> | null,
    event: Record<string, any>
  ): number | string {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    if (response && typeof response.totalTime === 'number') return response.totalTime;
    if (response && typeof response.duration === 'number') return response.duration;

    const startTime =
      request && typeof request.timestamp === 'number' && request.timestamp > 0
        ? request.timestamp
        : typeof event.startedDateTime === 'number' && event.startedDateTime > 0
          ? event.startedDateTime
          : null;

    const endTime =
      typeof event.timestamp === 'number' && event.timestamp > 0 ? event.timestamp : null;

    if (startTime != null && endTime != null && endTime >= startTime) {
      return endTime - startTime;
    }

    return '';
  }

  // ─── Event Processing ──────────────────────────────────────────

  /**
   * Resolves initial-log detection and event timestamp.
   */
  private _resolveEventMeta(event: LogEvent): { isInitialLog: boolean; timestamp: number } {
    let isInitialLog = false;

    if (!this._initialLogCaptured) {
      if (event.type === 'console') {
        const { args } = event;
        if (
          args &&
          args.length > 0 &&
          typeof args[0] === 'string' &&
          args[0].includes('initialization successful')
        ) {
          this._initialLogCaptured = true;
          isInitialLog = true;
        }
      }
    }

    return { isInitialLog, timestamp: event.timestamp || this.serverNow() };
  }

  /**
   * Main entry point for processing raw log events from the content script.
   */
  processLogEvent(event: LogEvent): void {
    const { isInitialLog, timestamp } = this._resolveEventMeta(event);

    if (!event.has_focus && event.type !== 'tracking_steps' && !isInitialLog) return;

    switch (event.type) {
      case 'network':
        this._handleNetworkEvent(event, timestamp);
        break;
      case 'fetch-error':
      case 'network-error':
        this._handleNetworkErrorEvent(event, timestamp);
        break;
      case 'resource':
        this._handleResourceEvent(event, timestamp);
        break;
      case 'resource-error':
        this._handleResourceErrorEvent(event, timestamp);
        break;
      case 'console':
        this._handleConsoleEvent(event, timestamp, isInitialLog);
        break;
      case 'tracking_steps':
        this._handleTrackingStepEvent(event);
        break;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any -- event payloads from content script are untyped */
  private _handleNetworkEvent(event: any, timestamp: number): void {
    const request: Record<string, any> = event.requestDetails?.request || event.request || {};
    const response: Record<string, any> = event.requestDetails?.response || event.response || {};
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const url: string = request.url || event.url || '';
    const method: string = request.method || event.method || 'GET';

    if (this.isInternalRequest(url)) return;

    const status = response.status;
    const requestId = `${method}-${url}-${status}`;
    const isStaticAsset = url.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i);
    const isLargeBody = response.body && response.body.length > 1048576;
    const mimeType = response.headers?.['content-type'] || '';

    let isContentAllowed =
      ALLOWED_RESPONSE_CONTENT_TYPES.some((ct) => mimeType.toLowerCase().includes(ct)) &&
      !isStaticAsset &&
      !isLargeBody;

    let responseBody = isContentAllowed ? response.body : '[Content excluded from logs]';
    if (this._maskResponseBody) {
      isContentAllowed = true;
      responseBody = '[Request body not captured - privacy settings]';
    }

    const startedDateTime = request.timestamp || event.startedDateTime || null;

    const entry: ProcessedNetworkEntry = {
      log_type: 'network',
      requestId,
      startedDateTime:
        typeof startedDateTime === 'number' && startedDateTime > 0 ? startedDateTime : status,
      timestamp,
      url,
      method,
      requestHeaders: request.headers,
      requestBody: request.body,
      status: response.status,
      statusText: '',
      responseHeaders: response.headers,
      mimeType,
      responseBody,
      isContentAllowed,
      duration: this._computeDuration(request, response, event),
      type: event.initiatorType || '',
      protocol: this.formatNextHopProtocol(response.nextHopProtocol || ''),
    };

    this.emitEntry(entry);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any -- event payloads from content script are untyped */
  private _handleNetworkErrorEvent(event: any, timestamp: number): void {
    const request: Record<string, any> = event.requestDetails?.request || event.request || {};
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const method: string = event.method || request.method || 'GET';
    const url: string = event.url || request.url || '';

    if (this.isInternalRequest(url)) return;

    const duration = this._computeDuration(request, event.requestDetails?.response || {}, event);
    const requestId = `${method}-${url}-${timestamp}`;
    const startedDateTime = request.timestamp || event.startedDateTime || null;
    const resolvedStart =
      typeof startedDateTime === 'number' && startedDateTime > 0 ? startedDateTime : timestamp;

    let errorBody = event.error || '[Network Error]';
    if (this._maskResponseBody && event.error) {
      errorBody = '[Request body not captured - privacy settings]';
    }

    const entry: ProcessedNetworkEntry = {
      log_type: 'network',
      requestId,
      startedDateTime: resolvedStart,
      timestamp,
      url,
      method,
      requestHeaders: event.requestHeaders || request.headers || {},
      requestBody: event.requestBody || request.body || null,
      status: 0,
      statusText: 'Network Error',
      responseHeaders: {},
      mimeType: '',
      responseBody: errorBody,
      isContentAllowed: true,
      duration,
      type: event.initiatorType || request?.initiatorType || 'fetch',
      protocol: '—',
      has_focus: !!event.has_focus,
    };

    this.emitEntry(entry);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- event payloads from content script are untyped
  private _handleResourceEvent(event: any, timestamp: number): void {
    if (this.isInternalRequest(event.url)) return;

    const entry: ProcessedNetworkEntry = {
      log_type: 'network',
      requestId: `resource-${event.url}-${timestamp}`,
      startedDateTime: timestamp,
      timestamp,
      url: event.url,
      method: 'GET',
      requestHeaders: {},
      requestBody: null,
      status: 200,
      statusText: 'OK',
      responseHeaders: {
        'content-type': event.headers?.contentType || '',
      },
      mimeType: event.headers?.contentType || '',
      type: event.initiatorType || '',
      responseBody: '[Resource loaded]',
      isContentAllowed: false,
      duration: event.duration || '',
      protocol: '',
    };

    this.emitEntry(entry);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- event payloads from content script are untyped
  private _handleResourceErrorEvent(event: any, timestamp: number): void {
    if (this.isInternalRequest(event.url)) return;

    const entry: ProcessedNetworkEntry = {
      log_type: 'network',
      requestId: `res-error-${event.url}-${timestamp}`,
      startedDateTime: timestamp,
      timestamp,
      url: event.url,
      method: 'GET',
      requestHeaders: {},
      requestBody: null,
      status: 0,
      statusText: 'Load Error',
      responseHeaders: {
        'content-type': event.headers?.contentType || '',
      },
      mimeType: event.headers?.contentType || '',
      responseBody: `[failed to load ${event.tag}]`,
      isContentAllowed: false,
      duration: '',
      type: '',
      protocol: '',
    };

    this.emitEntry(entry);
  }

  private _handleConsoleEvent(
    event: ConsoleLogEvent,
    timestamp: number,
    isInitialLog: boolean
  ): void {
    const entry: ProcessedConsoleEntry = {
      isInitialConsoleLog: isInitialLog,
      log_type: 'console',
      type: event.subtype || event.level || 'log',
      args: event.args,
      trace: event.trace,
      timestamp,
      url: '',
    };

    this.emitEntry(entry);
  }

  private _handleTrackingStepEvent(event: TrackingStepLogEvent): void {
    event.data.tabId = this._tabId;
    event.tabId = this._tabId;
    this._handleRawStep(event);
  }

  // ─── Tab/Navigation Step Tracking ───────────────────────────────

  private _logTabSwitch(tabId: string, url?: string, title?: string): void {
    this._addUserStep(tabId, {
      action: 'tab_switch',
      url,
      title,
      tabId,
    } as TrackingStepData);
  }

  private _logNavigation(tabId: string, url?: string, title?: string): void {
    this._addUserStep(tabId, {
      action: 'navigate',
      url,
      title,
      tabId,
    } as TrackingStepData);
  }

  private _logClick(tabId: string, data: TrackingStepData): void {
    this._addUserStep(tabId, data);
  }

  private _handleRawStep(event: TrackingStepLogEvent): void {
    if (event.type !== 'tracking_steps') return;

    const data: TrackingStepData = event.data;
    const action = data.action;
    const url = data.url;
    const title = data.title;
    const tabId: string = event.tabId ?? this._tabId;

    const tab: TabInfo = this.tabs.get(tabId) || {
      state: TAB_STATE.UNKNOWN,
      url: null,
      lastUnloadTs: 0,
    };

    switch (action) {
      case 'click':
        this._logClick(tabId, data);
        break;

      case 'tab_activated':
        this._logTabSwitch(tabId, url, title);
        break;

      case 'init_page': {
        const hadUnload = tab.lastUnloadTs !== 0;
        const isFirstVisit = tab.state === TAB_STATE.UNKNOWN && !hadUnload;
        const wasBackground = tab.state === TAB_STATE.BACKGROUND;

        if (hadUnload && this.currentActive === tabId) {
          this._logNavigation(tabId, url, title);
        } else if (isFirstVisit || wasBackground) {
          this._logTabSwitch(tabId, url, title);
        }

        tab.state = TAB_STATE.ACTIVE;
        tab.url = url || null;
        tab.lastUnloadTs = 0;
        this.currentActive = tabId;
        break;
      }

      case 'spa_route': {
        const toUrl = data.to;
        if (toUrl && toUrl !== tab.url) {
          this._logNavigation(tabId, toUrl, title);
          tab.url = toUrl;
        }
        break;
      }

      case 'page_unload':
        this.currentActive = tabId;
        tab.state = TAB_STATE.UNKNOWN;
        tab.lastUnloadTs = event.timestamp || this.serverNow();
        break;
    }

    this.tabs.set(tabId, tab);
  }

  private _addUserStep(tabId: string, data: TrackingStepData): void {
    if (!this._isSending) return;

    const entry: ProcessedUserStepEntry = {
      log_type: 'console',
      type: 'userStep',
      timestamp: (data.timestamp as number | undefined) || this.serverNow(),
      data,
    };

    this.emitEntry(entry);
  }
}
