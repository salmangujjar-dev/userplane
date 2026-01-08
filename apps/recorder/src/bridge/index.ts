/**
 * Bridge module barrel export
 */

export { RecorderBridgeConnection, getRecorderBridge, resetRecorderBridge } from './connection';

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
  type HostSchema,
  type GuestSchema,
  type CustomMetadata,
  type SerializableObject,
  type VerificationData,
} from './types';

export { type VerificationResult } from './connection';
