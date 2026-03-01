/**
 * Bridge Types for Recorder
 * Type definitions for postbridge communication between recorder (guest) and SDK (host)
 */

import type { ProcessedLogEntry } from '@workspace/logger';

/**
 * Recording state as exposed to the parent
 */
export type RecordingState = 'inactive' | 'active' | 'retained';

/**
 * Session information sent to the parent
 */
export interface RecordingSessionInfo {
  workspaceId: string;
  sessionId: string;
  linkId?: string;
}

/**
 * Serializable object type for custom metadata
 * Matches the SDK's SerializableObject type
 */
type SerializablePrimitive = string | number | boolean | null | undefined;
type SerializableArray = Serializable[];
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializableObject extends Record<string | number, Serializable> {}
type Serializable = SerializablePrimitive | SerializableArray | SerializableObject;

/**
 * Custom metadata from the host application
 */
export type CustomMetadata = SerializableObject | null;

/**
 * Verification result data returned on success
 */
export interface VerificationData {
  domainStatus: string;
  workspaceId: string;
  domainId: string;
  domainUrl: string;
}

/**
 * Raw verification result from parent SDK (wire format)
 */
export interface ParentVerificationResult {
  success: boolean;
  data?: VerificationData;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Methods exposed by the SDK (host/parent) for recording functionality
 */
export interface RecorderHostSchema {
  getTabRef: () => string;
  getPageUrl: () => string;
  getCustomMetadata: () => CustomMetadata;
  initSession: (info: RecordingSessionInfo, title: string) => void;
  finishSession: () => void;
  recordingActive: () => void;
  recordingRetained: () => void;
  recordingInactive: () => void;
}

/**
 * Methods exposed by the SDK (host/parent) for domain verification
 */
export interface VerificationHostSchema {
  /**
   * Request domain verification from parent
   * Parent makes the API call so the request origin is the parent's domain
   */
  requestVerification: (token: string, workspaceIds: string[]) => Promise<ParentVerificationResult>;

  /**
   * Request the parent to close the verification iframe
   * Called when verification is complete (success or user wants to close)
   */
  requestClose: () => void;
}

/**
 * Methods exposed by the recorder (guest) to the SDK (host)
 */
export interface GuestSchema {
  getRecordingState: () => RecordingState;
  getSessionInfo: () => RecordingSessionInfo | null;
  getTabRef: () => string | null;
}

// ---------------------------------------------------------------------------
// Capture Types (for /capture page - lightweight metadata extraction)
// ---------------------------------------------------------------------------

/**
 * Metadata collected from a tab (recorder or capture iframe)
 * Flattened structure - system keys prefixed with underscore, custom metadata keys at top level
 */
export interface TabMetadata {
  /** Page URL (system key) */
  _pageUrl: string;
  /** Page title (system key) */
  _pageTitle: string;
  /** Custom metadata keys are spread at this level */
  [key: string]: unknown;
}

/**
 * Recorder state tracked by the capture iframe
 * Used for cross-tab awareness
 */
export interface CaptureRecorderState {
  /** Tab ID of the active recorder (null if no recording) */
  recorderTabId: string | null;
  /** Current recording state: inactive/active/retained */
  recorderState: RecordingState;
  /** Timestamp of last state update */
  lastStateUpdate: number;
}

/**
 * Blurr state indicating whether privacy blur is enabled or disabled
 */
export type BlurrState = 'enabled' | 'disabled';

/**
 * Methods exposed by the SDK (host/parent) for capture functionality
 * Lightweight schema for the hidden 1x1 capture iframe
 */
export interface CaptureHostSchema {
  /**
   * Get the unique tab reference for this page
   */
  getTabRef: () => string;

  /**
   * Get the current page URL
   */
  getPageUrl: () => string;

  /**
   * Get the current page title
   */
  getPageTitle: () => string;

  /**
   * Extract custom metadata registered by the host application
   */
  extractMetadata: () => CustomMetadata;

  /**
   * Start privacy blur on the parent page
   * Called by capture iframe when recording becomes active
   */
  startBlurr: () => void;

  /**
   * Stop privacy blur on the parent page
   * Called by capture iframe when recording becomes inactive
   */
  stopBlurr: () => void;

  /**
   * Get the current blur state
   * Returns 'enabled' if blur is active, 'disabled' otherwise
   */
  getBlurrState: () => BlurrState;

  /**
   * Start log capture on the parent page
   */
  startLogCapture: (
    preferences: LogCapturePreferences,
    sessionId: string,
    tabId: string,
    workspaceId: string,
    internalEndpoints?: string[]
  ) => Promise<void>;

  /**
   * Stop log capture on the parent page
   */
  stopLogCapture: () => void;

  /**
   * Get the current log capture state
   */
  getLogCaptureState: () => LogCaptureState;

  /**
   * Get all captured log entries from IndexedDB
   */
  getLogEntries: () => Promise<LogEntries>;

  /**
   * Clear all stored log entries
   */
  clearLogStore: () => Promise<void>;
}

/**
 * Methods exposed by the capture iframe (guest) to the SDK (host)
 * Used for scatter-gather metadata collection
 */
export interface CaptureGuestSchema {
  /**
   * Extract metadata from this capture iframe
   * Called by recorder during scatter-gather
   */
  extractMetadata: () => TabMetadata;

  /**
   * Get the current recorder state being tracked
   */
  getRecorderState: () => CaptureRecorderState;

  /**
   * Update the recorder state (called when recorder in another tab changes state)
   */
  setRecorderState: (state: CaptureRecorderState) => void;

  /**
   * Check if this capture is alive/responsive
   * Used for health checks during scatter-gather
   */
  ping: () => boolean;

  /**
   * Start privacy blur on the parent page
   * Called by recorder when recording becomes active
   * Relays to parent SDK's startBlurr
   */
  startBlurr: () => void;

  /**
   * Stop privacy blur on the parent page
   * Called by recorder when recording becomes inactive
   * Relays to parent SDK's stopBlurr
   */
  stopBlurr: () => void;

  /**
   * Get the current blur state from the parent
   * Returns 'enabled' if blur is active, 'disabled' otherwise
   */
  getBlurrState: () => BlurrState;

  /**
   * Start log capture on the parent page
   * Relays to parent SDK's startLogCapture
   */
  startLogCapture: (
    preferences: LogCapturePreferences,
    sessionId: string,
    tabId: string,
    workspaceId: string,
    internalEndpoints?: string[]
  ) => Promise<void>;

  /**
   * Stop log capture on the parent page
   * Relays to parent SDK's stopLogCapture
   */
  stopLogCapture: () => void;

  /**
   * Get the current log capture state from the parent
   */
  getLogCaptureState: () => LogCaptureState;

  /**
   * Get all captured log entries from the parent
   */
  getLogEntries: () => Promise<LogEntries>;

  /**
   * Clear all stored log entries on the parent
   */
  clearLogStore: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Scatter-Gather Types (for cross-tab metadata aggregation)
// ---------------------------------------------------------------------------

/**
 * Re-export TabMetadata as TabMetadataEntry for backwards compatibility
 * Both recorder and capture iframes use the same structure
 */
export type TabMetadataEntry = TabMetadata;

/**
 * Aggregated metadata from all tabs
 * If all tabs have identical customMetadata, it's stored in `unified`
 * Otherwise, each tab's metadata is stored separately in `perTab`
 */
export interface AggregatedMetadata {
  /**
   * Unified custom metadata (if all tabs returned the same)
   * null if metadata differs across tabs
   */
  unified: CustomMetadata;

  /**
   * Per-tab metadata (if metadata differs)
   * Keyed by tabRef for easy lookup
   * null if all tabs returned the same (use `unified` instead)
   */
  perTab: Record<string, TabMetadataEntry> | null;

  /**
   * Whether all tabs had identical customMetadata
   */
  isUnified: boolean;

  /**
   * List of all tabs that responded
   */
  respondedTabs: string[];

  /**
   * Tabs that were expected but didn't respond (timed out)
   */
  timedOutTabs: string[];

  /**
   * Total tabs contacted
   */
  totalTabs: number;

  /**
   * Timestamp when scatter was initiated
   */
  requestedAt: number;

  /**
   * Timestamp when gather completed
   */
  completedAt: number;
}

/**
 * Scatter-gather request payload
 * Broadcast by recorder to all capture iframes
 */
export interface MetadataRequest {
  /** Unique request ID for correlation */
  requestId: string;
  /** Tab ID of the requester (recorder) */
  requesterTabId: string;
  /** Timestamp of request */
  requestedAt: number;
}

/**
 * Scatter-gather response payload
 * Sent by each capture iframe back to the recorder
 */
export interface MetadataResponse {
  /** Request ID for correlation */
  requestId: string;
  /** Tab ID of the responder (capture) */
  responderTabId: string;
  /** The extracted metadata */
  metadata: TabMetadata;
  /** Timestamp of response */
  respondedAt: number;
}

// ---------------------------------------------------------------------------
// Log Capture Types
// ---------------------------------------------------------------------------

/**
 * Preferences for what types of logs to capture
 */
export interface LogCapturePreferences {
  captureConsole: boolean;
  captureNetwork: boolean;
  captureAction: boolean;
}

/**
 * Log capture state
 */
export type LogCaptureState = 'enabled' | 'disabled';

/**
 * Aggregated log entries from a tab
 */
export interface LogEntries {
  network: ProcessedLogEntry[];
  console: ProcessedLogEntry[];
  activity: ProcessedLogEntry[];
}

/**
 * Scatter-gather request for logs
 * Broadcast by recorder to all capture iframes
 */
export interface LogsRequest {
  requestId: string;
  requesterTabId: string;
  requestedAt: number;
}

/**
 * Scatter-gather response for logs
 * Sent by each capture iframe back to the recorder
 */
export interface LogsResponse {
  requestId: string;
  responderTabId: string;
  logs: LogEntries;
  respondedAt: number;
}

/**
 * Aggregated logs from all tabs
 */
export interface AggregatedLogs {
  perTab: Record<string, LogEntries>;
  respondedTabs: string[];
  timedOutTabs: string[];
  totalTabs: number;
  requestedAt: number;
  completedAt: number;
}
