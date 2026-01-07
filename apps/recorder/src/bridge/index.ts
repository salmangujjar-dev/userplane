/**
 * Bridge module barrel export
 */

export { RecorderBridgeConnection, getRecorderBridge, resetRecorderBridge } from './connection';

export {
  CrossTabCoordinator,
  getCrossTabCoordinator,
  resetCrossTabCoordinator,
  type CrossTabRecorderState,
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
} from './types';
