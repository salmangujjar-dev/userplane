/**
 * Bridge module barrel export
 */

export { RecorderBridgeConnection, getRecorderBridge, resetRecorderBridge } from './connection';

export {
  type RecordingState,
  type RecordingSessionInfo,
  type HostSchema,
  type GuestSchema,
  type CustomMetadata,
  type SerializableObject,
} from './types';
