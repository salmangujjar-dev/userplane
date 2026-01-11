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

export type {
  RecordingState,
  RecordingSessionInfo,
  RecordingContext,
  RecorderHostSchema,
  VerificationHostSchema,
  GuestSchema,
} from './types';
