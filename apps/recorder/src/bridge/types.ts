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
  /**
   * Request domain verification from parent
   * Parent makes the API call so the request origin is the parent's domain
   */
  requestVerification: (token: string, workspaceIds: string[]) => Promise<VerificationResult>;
}

/**
 * Methods exposed by the recorder (guest) to the SDK (host)
 */
export interface GuestSchema {
  getRecordingState: () => RecordingState;
  getSessionInfo: () => RecordingSessionInfo | null;
  getTabRef: () => string | null;
}
