/**
 * Bridge module barrel export
 */

export {
  type CaptureBridgeCallbacks,
  CaptureBridgeConnection,
  getCaptureBridge,
  resetCaptureBridge,
} from './capture-connection';
export { getRecorderBridge, RecorderBridgeConnection, resetRecorderBridge } from './connection';
export {
  CONNECTION_PREFIXES,
  generateRequestId,
  isCaptureTab,
  isRecorderTab,
  isVerificationTab,
} from './constants';
export {
  type AcquireLockResult,
  CrossTabCoordinator,
  type CrossTabCoordinatorCallbacks,
  type CrossTabCoordinatorConfig,
  getCrossTabCoordinator,
  resetCrossTabCoordinator,
} from './cross-tab';
export {
  type AggregatedMetadata,
  type CaptureGuestSchema,
  type CaptureHostSchema,
  type CaptureRecorderState,
  type CustomMetadata,
  type GuestSchema,
  type MetadataRequest,
  type MetadataResponse,
  type RecorderHostSchema,
  type RecordingSessionInfo,
  type RecordingState,
  type SerializableObject,
  type TabMetadata,
  type TabMetadataEntry,
  type VerificationData,
  type VerificationHostSchema,
} from './types';
export {
  getVerificationBridge,
  resetVerificationBridge,
  VerificationBridgeConnection,
  type VerificationResult,
} from './verification-connection';
