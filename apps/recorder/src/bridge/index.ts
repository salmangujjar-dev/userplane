/**
 * Bridge module barrel export
 */

export { RecorderBridgeConnection, getRecorderBridge, resetRecorderBridge } from './connection';

export {
  VerificationBridgeConnection,
  getVerificationBridge,
  resetVerificationBridge,
  type VerificationResult,
} from './verification-connection';

export {
  CrossTabCoordinator,
  getCrossTabCoordinator,
  resetCrossTabCoordinator,
  type AcquireLockResult,
  type CrossTabCoordinatorCallbacks,
  type CrossTabCoordinatorConfig,
} from './cross-tab';

export {
  type RecordingState,
  type RecordingSessionInfo,
  type RecorderHostSchema,
  type VerificationHostSchema,
  type GuestSchema,
  type CustomMetadata,
  type SerializableObject,
  type VerificationData,
} from './types';
