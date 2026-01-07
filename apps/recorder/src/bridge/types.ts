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
 * Serializable object type for custom metadata
 * Matches the SDK's SerializableObject type
 */
type SerializablePrimitive = string | number | boolean | null | undefined;
type SerializableArray = Serializable[];
export interface SerializableObject extends Record<string | number, Serializable> {}
type Serializable = SerializablePrimitive | SerializableArray | SerializableObject;

/**
 * Custom metadata from the host application
 */
export type CustomMetadata = SerializableObject | null;

/**
 * Methods exposed by the SDK (host/parent) that the recorder can call
 */
export interface HostSchema {
  getTabRef: () => string;
  getCustomMetadata: () => CustomMetadata;
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
