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
  CaptureBridgeConnection,
  getCaptureBridge,
  resetCaptureBridge,
  type CaptureBridgeCallbacks,
} from './capture-connection';

export {
  CrossTabCoordinator,
  getCrossTabCoordinator,
  resetCrossTabCoordinator,
  type AcquireLockResult,
  type CrossTabCoordinatorCallbacks,
  type CrossTabCoordinatorConfig,
} from './cross-tab';

export {
  CONNECTION_PREFIXES,
  generateRequestId,
  isCaptureTab,
  isRecorderTab,
  isVerificationTab,
} from './constants';

export {
  type RecordingState,
  type RecordingSessionInfo,
  type RecorderHostSchema,
  type VerificationHostSchema,
  type CaptureHostSchema,
  type CaptureGuestSchema,
  type TabMetadata,
  type CaptureRecorderState,
  type GuestSchema,
  type CustomMetadata,
  type SerializableObject,
  type VerificationData,
  type TabMetadataEntry,
  type AggregatedMetadata,
  type MetadataRequest,
  type MetadataResponse,
} from './types';
