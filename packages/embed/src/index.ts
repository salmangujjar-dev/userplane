/**
 * Userplane Embed - Auto-initializing Script
 *
 * Auto-initializes on import for CDN/script tag usage.
 * For npm installs, use @userplane/sdk instead.
 * For just metadata, use @userplane/metadata.
 *
 * @example
 * ```html
 * <meta name="userplane:workspace" content="ws_xxx" />
 * <script type="module" src="https://cdn.userplane.io/embed/script.js"></script>
 * ```
 */

// Re-export everything from sdk
export type {
  ActionType,
  InitializeOptions,
  MetadataFunction,
  RecordingContext,
  RecordingState,
  SerializableUserplaneData,
} from '@userplane/sdk';
export {
  clearMetadata,
  clearTabRef,
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
  unmount,
} from '@userplane/sdk';

// Re-export metadata types
export type { Serializable, SerializableObject } from '@userplane/metadata';

// Auto-initialize on import
import { initialize } from '@userplane/sdk';

if (typeof window !== 'undefined') {
  initialize();
}

// Expose to window for script tag usage
import * as sdk from '@userplane/sdk';

declare global {
  interface Window {
    userplane?: typeof sdk;
    __userplaneTabRef?: string;
  }
}

if (typeof window !== 'undefined') {
  window.userplane = sdk;
}
