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
 * <script type="module" src="https://cdn.userplane.com/embed.js"></script>
 * ```
 */

// Re-export everything from sdk
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
} from '@workspace/sdk';

export type {
  ActionType,
  InitializeOptions,
  RecordingState,
  RecordingContext,
  SerializableUserplaneData,
  MetadataFunction,
} from '@workspace/sdk';

// Re-export metadata types
export type { SerializableObject, Serializable } from '@workspace/metadata';

// Auto-initialize on import
import { initialize } from '@workspace/sdk';

if (typeof window !== 'undefined') {
  initialize();
}

// Expose to window for script tag usage
import * as sdk from '@workspace/sdk';

declare global {
  interface Window {
    userplane?: typeof sdk;
    __userplaneTabRef?: string;
  }
}

if (typeof window !== 'undefined') {
  window.userplane = sdk;
}
