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

export type {
  ActionType,
  InitializeOptions,
  MetadataFunction,
  RecordingContext,
  RecordingState,
  SerializableUserplaneData,
} from './sdk';
export {
  clearMetadata,
  clearTabRef,
  destroy,
  getLinkId,
  getRecordingContext,
  getRecordingState,
  getSessionId,
  getTabRef,
  initialize,
  isBridgeConnected,
  isInitialized,
  isRecorderMounted,
  metadata,
  open,
  set,
  unmount,
} from './sdk';

// Re-export metadata package
export type {
  MetadataFunction as MetadataFn,
  Serializable,
  SerializableObject,
} from '@workspace/metadata';
export {
  clearMetadata as clearMetadataFn,
  getCustomMetadata,
  metadata as setMetadata,
} from '@workspace/metadata';
