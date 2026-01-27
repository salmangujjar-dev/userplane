/**
 * Bridge module barrel export
 */

export {
  type CaptureBridgeCallbacks,
  CaptureBridgeConnection,
  type CaptureBridgeConnectionOptions,
} from './capture-connection';
export {
  type RecorderBridgeCallbacks,
  RecorderBridgeConnection,
  type RecorderBridgeConnectionOptions,
} from './recorder-connection';
export type {
  BlurrState,
  CaptureGuestSchema,
  CaptureHostSchema,
  CaptureRecorderState,
  CustomMetadata,
  GuestSchema,
  RecorderHostSchema,
  RecordingContext,
  RecordingSessionInfo,
  RecordingState,
  TabMetadata,
  VerificationHostSchema,
} from './types';
export {
  type VerificationBridgeCallbacks,
  VerificationBridgeConnection,
  type VerificationBridgeConnectionOptions,
} from './verification-connection';
