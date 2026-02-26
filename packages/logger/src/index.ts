// ─── Core Modules ───────────────────────────────────────────────────────────

export { LogProcessor } from './log-processor';
export { initPatches } from './patcher';

// ─── Dispatch ───────────────────────────────────────────────────────────────

export type { BatchedDispatcherOptions } from './dispatch-strategy';
export { BatchedDispatcher, ImmediateDispatcher } from './dispatch-strategy';
export { disableDispatch, dispatch, enableDispatch, isDispatchActive } from './event-bridge';

// ─── Constants ──────────────────────────────────────────────────────────────

export {
  buildEndpointMatchers,
  CONSOLE_PATCHED_FLAG,
  CUSTOM_EVENT_NAME,
  DEFAULT_INTERNAL_ENDPOINTS,
  EXTENSION_TAG,
  LOGGER_FILE_PATTERNS,
  LOGGER_NAME,
  LOGGER_PREFIX,
} from './constants';

// ─── Interceptors (for granular usage) ──────────────────────────────────────

export {
  getLastHref,
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

// ─── Utilities (for advanced usage) ─────────────────────────────────────────

export {
  buildSelector,
  cleanPayload,
  enrichWithPerformance,
  extractDomain,
  extractPerformanceData,
  HTTP_STATUS_TEXT,
  inferContentType,
  isCrossOrigin,
  isLocalhost,
  isSameSite,
  isTextContentType,
  parseFetchBody,
  parseResponseHeaders,
  parseStack,
  parseXHRBody,
  serializeValue,
  shouldLogNavigation,
  shouldLogNetwork,
  truncatePayload,
} from './utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export type {
  BaseLogEvent,
  BatchSavePayload,
  ConsoleLogEvent,
  DispatchContext,
  DispatchMode,
  DispatchStrategy,
  FlushFunction,
  LastNavigation,
  LogEvent,
  LogEventType,
  LoggerOriginals,
  NetworkErrorLogEvent,
  NetworkLogEvent,
  NetworkRequestInfo,
  NetworkResponseInfo,
  ParsedBody,
  ParsedStack,
  PerformanceData,
  PristineNatives,
  ProcessedConsoleEntry,
  ProcessedLogEntry,
  ProcessedNetworkEntry,
  ProcessedUserStepEntry,
  RepeatEntry,
  ResourceErrorLogEvent,
  ResourceLogEvent,
  SaveFunction,
  SavePayload,
  SerializedElement,
  SerializedError,
  SerializedFunction,
  SerializedValue,
  TabInfo,
  TrackingStepData,
  TrackingStepLogEvent,
  TruncationMeta,
  XHRTrackingData,
} from './types';
export { TabState } from './types';
