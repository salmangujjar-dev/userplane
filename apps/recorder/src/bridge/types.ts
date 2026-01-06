/**
 * Bridge Types for Recorder
 * Type definitions for postbridge communication between recorder (guest) and SDK (host)
 */

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
 * Methods exposed by the SDK (host/parent) that the recorder can call
 */
export interface HostSchema {
  getTabRef: () => string;
  initSession: (info: RecordingSessionInfo, title: string) => void;
  finishSession: () => void;
  recordingActive: () => void;
  recordingRetained: () => void;
  recordingInactive: () => void;
}

/**
 * Methods exposed by the recorder (guest) to the SDK (host)
 */
export interface GuestSchema {
  getRecordingState: () => RecordingState;
  getSessionInfo: () => RecordingSessionInfo | null;
  getTabRef: () => string | null;
}
