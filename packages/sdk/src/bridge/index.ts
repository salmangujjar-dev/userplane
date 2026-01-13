/**
 * Bridge module barrel export
 */

export {
  RecorderBridgeConnection,
  type RecorderBridgeCallbacks,
  type RecorderBridgeConnectionOptions,
} from './recorder-connection';

export {
  VerificationBridgeConnection,
  type VerificationBridgeCallbacks,
  type VerificationBridgeConnectionOptions,
} from './verification-connection';

export {
  CaptureBridgeConnection,
  type CaptureBridgeCallbacks,
  type CaptureBridgeConnectionOptions,
} from './capture-connection';

export type {
  RecordingState,
  RecordingSessionInfo,
  RecordingContext,
  RecorderHostSchema,
  VerificationHostSchema,
  CaptureHostSchema,
  CaptureGuestSchema,
  TabMetadata,
  CaptureRecorderState,
  GuestSchema,
  CustomMetadata,
  BlurrState,
} from './types';
