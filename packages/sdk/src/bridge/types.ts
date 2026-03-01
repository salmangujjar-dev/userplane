/**
 * Bridge Types
 * Type definitions for postbridge communication between SDK (host) and recorder (guest)
 */

import type { ProcessedLogEntry } from '@workspace/logger';
import type { SerializableObject } from '@workspace/metadata';

/**
 * Custom metadata from the host application
 * Re-export for convenience
 */
export type CustomMetadata = SerializableObject | null;

/**
 * Recording state as exposed to the parent
 * Maps internal flow states to public-facing states:
 * - inactive: No recording in progress (loading, setup, error without blob)
 * - active: Recording is happening (countdown, recording)
 * - retained: Recording exists but not yet submitted (review, uploading, success, error with blob)
 */
export type RecordingState = 'inactive' | 'active' | 'retained';

/**
 * Session information from the recorder
 */
export interface RecordingSessionInfo {
  workspaceId: string;
  sessionId: string;
  linkId?: string;
}

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
 * Verification error information
 */
export interface VerificationError {
  code: string;
  message: string;
}

/**
 * Result of a verification request
 * The parent SDK makes the API call and returns this to the iframe
 */
export interface VerificationResult {
  success: boolean;
  data?: VerificationData;
  error?: VerificationError;
}

/**
 * Methods exposed by the SDK (host/parent) for recording functionality
 */
export interface RecorderHostSchema {
  /**
   * Get the unique tab reference from the parent
   * Used to identify which tab the recording came from
   */
  getTabRef: () => string;

  /**
   * Get the current page URL from the parent
   * Used for metadata collection - avoids cross-origin issues
   */
  getPageUrl: () => string;

  /**
   * Get custom metadata registered by the host application
   * Returns null if no metadata function is registered or it fails
   *
   * The host app can register metadata via:
   * ```
   * userplane.metadata(() => ({ userId: '123', plan: 'pro' }));
   * ```
   */
  getCustomMetadata: () => SerializableObject | null;

  /**
   * Initialize the recording session
   * Sets parent title, stores session info, sets state to inactive
   *
   * @param info - Session information
   * @param title - Title to set on parent tab
   */
  initSession: (info: RecordingSessionInfo, title: string) => void;

  /**
   * Finish the recording session and cleanup
   * Resets title, clears URL params, sets state to inactive, and closes recorder
   */
  finishSession: () => void;

  /**
   * Notify parent that recording is now active (countdown/recording in progress)
   * Parent will enable tab unload protection
   */
  recordingActive: () => void;

  /**
   * Notify parent that recording is retained (review/uploading)
   * Parent will keep tab unload protection enabled
   */
  recordingRetained: () => void;

  /**
   * Notify parent that recording is inactive (setup/success/error without blob)
   * Parent will disable tab unload protection
   */
  recordingInactive: () => void;
}

/**
 * Methods exposed by the SDK (host/parent) for domain verification
 */
export interface VerificationHostSchema {
  /**
   * Request domain verification from parent
   * Parent makes the API call so the request origin is the parent's domain
   * This is required because the API validates the origin against registered domains
   *
   * @param token - Verification JWT token
   * @param workspaceIds - Workspace IDs from the SDK/meta tags
   * @returns Verification result with success/error status
   */
  requestVerification: (token: string, workspaceIds: string[]) => Promise<VerificationResult>;

  /**
   * Request the parent to close the verification iframe
   * Called when verification is complete (success or user wants to close)
   */
  requestClose: () => void;
}

/**
 * Blurr state indicating whether privacy blur is enabled or disabled
 */
export type BlurrState = 'enabled' | 'disabled';

/**
 * Log capture state indicating whether log capture is enabled or disabled
 */
export type LogCaptureState = 'enabled' | 'disabled';

/**
 * Preferences for what types of logs to capture
 */
export interface LogCapturePreferences {
  captureConsole: boolean;
  captureNetwork: boolean;
  captureAction: boolean;
}

/**
 * Aggregated log entries from a tab
 */
export interface LogEntries {
  network: ProcessedLogEntry[];
  console: ProcessedLogEntry[];
  activity: ProcessedLogEntry[];
}

/**
 * Methods exposed by the SDK (host/parent) for capture iframe
 * The capture iframe is a lightweight hidden 1x1 iframe that:
 * - Extracts metadata from the parent page
 * - Tracks recorder state for cross-tab coordination
 * - Responds to scatter-gather requests from the recorder
 * - Manages privacy blur state via BlurManager
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
   * Returns null if no metadata registered or extraction fails
   */
  extractMetadata: () => SerializableObject | null;

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
   * Called by capture iframe when recording becomes active
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
   * Called by capture iframe when recording becomes inactive
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
 * Metadata extracted from a tab (recorder or capture iframe)
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
 * Methods exposed by the capture iframe (guest) to the SDK (host)
 */
export interface CaptureGuestSchema {
  /**
   * Get the current recorder state being tracked
   * Used by the capture iframe to know if a recording is active
   */
  getRecorderState: () => CaptureRecorderState;

  /**
   * Extract metadata from this capture
   * Called by recorder during scatter-gather operation
   */
  extractMetadata: () => TabMetadata;

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
   * Called by recorder when recording becomes active
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

/**
 * Recorder state tracked by capture iframes
 * Captures use this to know if a recording is active and who owns it
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
 * Methods exposed by the recorder (guest/iframe) to the SDK (host/parent)
 */
export interface GuestSchema {
  /**
   * Get the current recording state
   */
  getRecordingState: () => RecordingState;

  /**
   * Get session information if available
   */
  getSessionInfo: () => RecordingSessionInfo | null;

  /**
   * Get the tab reference from the parent
   * Returns null if not connected or not available
   */
  getTabRef: () => string | null;
}

/**
 * State tracked by the SDK about the recording
 */
export interface RecordingContext {
  /** Current recording state */
  state: RecordingState;
  /** Session information from the recorder */
  sessionInfo: RecordingSessionInfo | null;
  /** Whether tab unload protection is active */
  tabUnloadEnabled: boolean;
}
