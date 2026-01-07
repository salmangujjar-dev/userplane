/**
 * Bridge Types
 * Type definitions for postbridge communication between SDK (host) and recorder (guest)
 */

import type { SerializableObject } from '../metadata';

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
 * Methods exposed by the SDK (host/parent) to the recorder (guest/iframe)
 */
export interface HostSchema {
  /**
   * Get the unique tab reference from the parent
   * Used to identify which tab the recording came from
   */
  getTabRef: () => string;

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
