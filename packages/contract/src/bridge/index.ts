/**
 * Bridge Types
 * Shared type definitions for postbridge communication between SDK (host) and recorder (guest).
 * Pure TypeScript types — no Zod, no oRPC, no runtime dependencies.
 */

import type { ProcessedLogEntry } from '@workspace/logger';

// ─── Serializable Types ──────────────────────────────────────────────────────

type SerializablePrimitive = string | number | boolean | null | undefined;
type SerializableArray = Serializable[];
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializableObject extends Record<string | number, Serializable> {}
type Serializable = SerializablePrimitive | SerializableArray | SerializableObject;

// ─── Recording Types ─────────────────────────────────────────────────────────

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
  serverDeltaMs?: number;
}

/**
 * Custom metadata from the host application
 */
export type CustomMetadata = SerializableObject | null;

// ─── Verification Types ──────────────────────────────────────────────────────

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

// ─── Capture Types ───────────────────────────────────────────────────────────

/**
 * Blurr state indicating whether privacy blur is enabled or disabled
 */
export type BlurrState = 'enabled' | 'disabled';

/**
 * Log capture state indicating whether log capture is enabled or disabled
 */
export type LogCaptureState = 'enabled' | 'disabled' | 'paused';

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
  action: ProcessedLogEntry[];
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
