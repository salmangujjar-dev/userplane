/**
 * Userplane SDK
 *
 * Tree-shakeable, SSR-safe SDK with no side effects.
 * Install via npm for Next.js, SSR apps, or full control.
 *
 * @example
 * ```typescript
 * import * as userplane from '@userplane/sdk';
 *
 * // Initialize when ready (client-side only)
 * if (typeof window !== 'undefined') {
 *   userplane.initialize({
 *     workspaceId: 'ws_xxx',
 *     openImmediately: false
 *   });
 * }
 *
 * // Open recorder manually
 * userplane.open('recording-token');
 * ```
 */

export {
  initialize,
  isInitialized,
  open,
  unmount,
  isRecorderMounted,
  isBridgeConnected,
  getRecordingState,
  getRecordingContext,
  getSessionId,
  getLinkId,
  getTabRef,
  clearTabRef,
  metadata,
  clearMetadata,
} from './sdk';

export type {
  ActionType,
  InitializeOptions,
  RecordingState,
  RecordingContext,
  SerializableUserplaneData,
  MetadataFunction,
} from './sdk';

// Re-export metadata package
export {
  metadata as setMetadata,
  clearMetadata as clearMetadataFn,
  getCustomMetadata,
} from '@workspace/metadata';

export type {
  SerializableObject,
  Serializable,
  MetadataFunction as MetadataFn,
} from '@workspace/metadata';
