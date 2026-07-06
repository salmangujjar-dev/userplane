// ─── Global Window Extensions ───────────────────────────────────────────────

export interface PristineNatives {
  fetch?: typeof fetch;
  xhr?: {
    open: typeof XMLHttpRequest.prototype.open;
    send: typeof XMLHttpRequest.prototype.send;
    setRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader;
  };
  console?: Record<string, (...args: unknown[]) => void>;
  history?: {
    pushState: typeof history.pushState;
    replaceState: typeof history.replaceState;
  };
}

export interface LoggerOriginals {
  native: {
    fetch?: typeof fetch;
    xhrOpen?: typeof XMLHttpRequest.prototype.open;
    xhrSend?: typeof XMLHttpRequest.prototype.send;
    xhrSetHeader?: typeof XMLHttpRequest.prototype.setRequestHeader;
  };
  current: {
    fetch: typeof fetch;
    xhrOpen: typeof XMLHttpRequest.prototype.open;
    xhrSend: typeof XMLHttpRequest.prototype.send;
    xhrSetRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader;
  };
  console: Record<string, (...args: unknown[]) => void>;
  history: {
    pushState: typeof history.pushState;
    replaceState: typeof history.replaceState;
  };
}

// ─── Augmented Window ───────────────────────────────────────────────────────

declare global {
  interface Window {
    __userplane_logger_loaded?: boolean;
    __userplane_logger_originals?: LoggerOriginals;
    __userplane_pristine_natives?: PristineNatives;
    __userplane_has_focus?: boolean;
    __userplane_removeNavigationApiHook?: () => void;
    // `navigation` (Navigation API) is provided by the DOM lib; do not redeclare it here.
  }

  var __userplane_has_focus: boolean;

  interface Navigation extends EventTarget {
    addEventListener(
      type: 'currententrychange',
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
      type: 'currententrychange',
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ): void;
  }
}

// ─── Performance Data ───────────────────────────────────────────────────────

export interface PerformanceData {
  nextHopProtocol: string;
  encodedBodySize: number;
  decodedBodySize: number;
  transferSize: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  startTime: number;
  duration: number;
}

// ─── Parsed Body ────────────────────────────────────────────────────────────

export interface ParsedBody {
  type:
    | 'text'
    | 'json'
    | 'string'
    | 'FormData'
    | 'Blob'
    | 'ArrayBuffer'
    | 'URLSearchParams'
    | 'other'
    | 'unknown';
  body: unknown;
}

// ─── Truncation Meta ────────────────────────────────────────────────────────

export interface TruncationMeta {
  trace?: boolean;
  args?: boolean;
  dropped?: boolean;
}

// ─── Serialized Element ─────────────────────────────────────────────────────

export interface SerializedElement {
  type: 'element';
  tag?: string;
  id?: string;
  class?: string;
  role?: string;
  ariaLabel?: string;
  text?: string;
  selector?: string;
}

export interface SerializedFunction {
  type: 'function';
  name: string;
  toString: string;
}

export interface SerializedError {
  type: 'error';
  name: string;
  message: string;
  stack?: string;
}

export type SerializedValue =
  | string
  | number
  | boolean
  | null
  | SerializedElement
  | SerializedFunction
  | SerializedError
  | Record<string, unknown>
  | unknown[];

// ─── Stack Trace ────────────────────────────────────────────────────────────

export interface ParsedStack {
  top: string;
  stackLines: string[];
}

// ─── Log Event (dispatched via CustomEvent) ─────────────────────────────────

export type ConsoleLogEventType = 'console';
export type NetworkLogEventType =
  | 'network'
  | 'fetch-error'
  | 'network-error'
  | 'resource'
  | 'resource-error';
export type ActionLogEventType = 'user-action';

export type LogEventType = ConsoleLogEventType | NetworkLogEventType | ActionLogEventType;

export interface BaseLogEvent extends Record<string, unknown> {
  source: 'userplane-logger';
  has_focus?: boolean;
  tabId?: string;
  timestamp: number;
  type: LogEventType;
}

export interface ConsoleLogEvent extends BaseLogEvent {
  type: 'console';
  subtype: string;
  level: string;
  args: SerializedValue[];
  trace?: string[];
  repeatCount?: number;
  meta?: { truncated?: TruncationMeta };
  // CSP violation fields
  directive?: string;
  blockedURI?: string;
  effectiveType?: string;
  disposition?: string;
  originalPolicy?: string;
  statusCode?: number;
}

export interface NetworkRequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: ParsedBody | null;
  startTime: number;
  timestamp: number;
  async?: boolean;
  user?: string | null;
  pass?: string | null;
}

export interface NetworkResponseInfo {
  status: number;
  statusText?: string;
  ok?: boolean;
  duration?: number;
  headers: Record<string, string>;
  body: unknown;
  url?: string;
  endTime?: number;
  totalTime?: number;
  truncated?: boolean;
  performance?: PerformanceData;
  nextHopProtocol?: string;
}

export interface NetworkLogEvent extends BaseLogEvent {
  type: 'network';
  initiatorType: 'fetch' | 'xhr';
  request?: NetworkRequestInfo;
  response?: NetworkResponseInfo;
  requestDetails?: {
    type: 'xhr';
    request: NetworkRequestInfo;
    response: NetworkResponseInfo;
  };
}

export interface NetworkErrorLogEvent extends BaseLogEvent {
  type: 'network-error';
  initiatorType: 'fetch' | 'xhr';
  url?: string;
  method?: string;
  error?: string;
  message?: string;
  request?: NetworkRequestInfo;
  response?: NetworkResponseInfo;
  requestDetails?: {
    type: 'xhr';
    request: NetworkRequestInfo;
    response: NetworkResponseInfo;
  };
}

export interface FetchErrorLogEvent extends BaseLogEvent {
  type: 'fetch-error';
  initiatorType: 'fetch' | 'xhr';
  url?: string;
  method?: string;
  error?: string;
  message?: string;
  request?: NetworkRequestInfo;
  response?: NetworkResponseInfo;
  requestDetails?: {
    type: 'xhr';
    request: NetworkRequestInfo;
    response: NetworkResponseInfo;
  };
}

export interface ResourceLogEvent extends BaseLogEvent {
  type: 'resource';
  url: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  nextHopProtocol: string;
  encodedBodySize: number;
  decodedBodySize: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  headers: { contentType: string };
}

export interface ResourceErrorLogEvent extends BaseLogEvent {
  type: 'resource-error';
  tag: string;
  url: string;
  headers: { contentType: string };
  performance?: PerformanceData;
}

export type UserActionType =
  | 'click'
  | 'spa_route'
  | 'tab_activated'
  | 'tab_deactivated'
  | 'init_page'
  | 'page_unload'
  | 'recorder-pause'
  | 'recorder-resume'
  | 'tab_switch'
  | 'navigate';

export interface UserActionData {
  action: UserActionType;
  url?: string;
  title?: string;
  from?: string;
  to?: string;
  triggeredBy?: string;
  method?: string;
  tabId?: string;
  info?: {
    tagName: string;
    id: string;
    classList: string[];
  };
  [key: string]: unknown;
}

export interface UserActionLogEvent extends BaseLogEvent {
  type: 'user-action';
  data: UserActionData;
}

export type LogEvent =
  | ConsoleLogEvent
  | NetworkLogEvent
  | NetworkErrorLogEvent
  | FetchErrorLogEvent
  | ResourceLogEvent
  | ResourceErrorLogEvent
  | UserActionLogEvent;

// ─── Repeat Tracker Entry ───────────────────────────────────────────────────

export interface RepeatEntry {
  count: number;
  timer: ReturnType<typeof setTimeout> | null;
  payload: LogEvent | null;
}

// ─── XHR Tracking Metadata ──────────────────────────────────────────────────

export interface XHRTrackingData {
  type: 'xhr';
  request: NetworkRequestInfo;
  response: NetworkResponseInfo;
}

// ─── Navigation State ───────────────────────────────────────────────────────

export interface LastNavigation {
  from: string | null;
  to: string | null;
  method: string | null;
}

// ─── LoggerManager Types ────────────────────────────────────────────────────

export enum TabState {
  UNKNOWN = 0,
  BACKGROUND = 1,
  ACTIVE = 2,
}

export interface TabInfo {
  state: TabState;
  url: string | null;
  lastUnloadTs: number;
}

export interface SavePayload {
  event: 'log_console' | 'log_network';
  tabId: string;
  data: ProcessedLogEntry;
  is_single_log: boolean;
  timestamp: number;
  has_focus: boolean;
  tab_details: {
    location: string;
    title: string;
    window_width: number;
    window_height: number;
  };
}

export interface CaptureOptions {
  console?: boolean;
  network?: boolean;
  action?: boolean;
}

export type DispatchMode = 'immediate' | 'batched';

export interface BatchSavePayload {
  event: 'log_batch';
  tabId: string;
  data: ProcessedLogEntry[];
  is_single_log: false;
  timestamp: number;
  has_focus: boolean;
  tab_details: {
    location: string;
    title: string;
    window_width: number;
    window_height: number;
  };
}

export type SaveFunction = (payload: SavePayload | BatchSavePayload) => void;

export type FlushFunction = (payload: BatchSavePayload) => void;

export interface ProcessedLogEntry {
  log_type: 'console' | 'network' | 'action';
  [key: string]: unknown;
}

export interface ProcessedNetworkEntry extends ProcessedLogEntry {
  log_type: 'network';
  requestId: string;
  startedDateTime: number;
  timestamp: number;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: ParsedBody | null;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  mimeType: string;
  responseBody: unknown;
  isContentAllowed: boolean;
  duration: number | string;
  type: string;
  protocol: string;
  has_focus?: boolean;
}

export interface ProcessedConsoleEntry extends ProcessedLogEntry {
  log_type: 'console';
  type: string;
  args: SerializedValue[];
  trace?: string[];
  timestamp: number;
  url: string;
  isInitialConsoleLog?: boolean;
}

export interface ProcessedUserActionEntry extends ProcessedLogEntry {
  log_type: 'action';
  type: 'action';
  timestamp: number;
  data: UserActionData;
}

// ─── Dispatch Strategy ─────────────────────────────────────────────────────

export interface DispatchContext {
  readonly tabId: string;
  serverNow(): number;
  saveFunction: SaveFunction | undefined;
}

export interface DispatchStrategy {
  emit(entry: ProcessedLogEntry): void;
  start(): void;
  pause(): void;
  stop(): void;
  destroy(): void;
}
