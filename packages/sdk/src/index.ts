/**
 * Userplane Recorder SDK
 * Auto-mounts recorder iframe when userplane-action=recording is detected
 *
 * Usage (auto-open):
 *   <meta name="userplane:workspace" content="ws_xxx" />
 *   <script type="module" src="https://cdn.userplane.com/recorder.js"></script>
 *
 * Usage (manual control):
 *   <script type="module">
 *     import Userplane from './recorder.js';
 *     Userplane.initialize({ openImmediately: false });
 *     // Later...
 *     Userplane.open('token-from-url');
 *   </script>
 *
 * Note: Multiple workspace meta tags can be specified. At least one must match
 * the workspace ID in the recording session for validation to succeed.
 */

import type { RecorderParams, InitializeOptions, RecordingState, RecordingContext } from './types';
import { FrameManager } from './frame/manager';
import { parseUrlParams } from './utils/url';
import { readWorkspaceIds } from './utils/meta';
import { getOrCreateTabRef, clearTabRef } from './utils/tab';
import type { BridgeCallbacks, RecordingSessionInfo } from './bridge';
import {
  metadata as setMetadata,
  clearMetadata,
  type MetadataFunction,
  type SerializableObject,
} from './metadata';

/**
 * Event callbacks for SDK consumers
 */
export interface UserplaneCallbacks {
  /** Called when the recorder session is ready with session info */
  onSessionReady?: (info: RecordingSessionInfo) => void;
  /** Called when the recording state changes */
  onRecordingStateChange?: (state: RecordingState) => void;
  /** Called when the recorder is closed */
  onRecorderClose?: () => void;
}

/**
 * Main orchestrator for the Userplane Recorder SDK
 * Collects data (workspace IDs, URL params) and delegates frame management to FrameManager
 */
class UserplaneRecorder {
  private static instance: UserplaneRecorder | null = null;
  private frameManager: FrameManager;
  private recorderBaseUrl: string = 'http://localhost:4322/r';
  private isInitialized: boolean = false;
  private pendingParams: RecorderParams | null = null;
  private tabRef: string;
  private callbacks: UserplaneCallbacks = {};

  private constructor() {
    this.frameManager = new FrameManager();
    this.tabRef = getOrCreateTabRef();
    console.log('[Userplane] Tab Ref:', this.tabRef);

    // Set tab ref on frame manager for bridge
    this.frameManager.setTabRef(this.tabRef);

    // Set up bridge callbacks
    this.setupBridgeCallbacks();
  }

  /**
   * Configure bridge callbacks to forward events to SDK consumers
   */
  private setupBridgeCallbacks(): void {
    const bridgeCallbacks: BridgeCallbacks = {
      onSessionReady: (info) => {
        console.log('[Userplane] Session ready:', info);
        this.callbacks.onSessionReady?.(info);
      },
      onRecordingStateChange: (state) => {
        console.log('[Userplane] Recording state changed:', state);
        this.callbacks.onRecordingStateChange?.(state);
      },
      onRequestClose: () => {
        console.log('[Userplane] Recorder requested close');
        this.callbacks.onRecorderClose?.();
      },
    };

    this.frameManager.setBridgeCallbacks(bridgeCallbacks);
  }

  /**
   * Set callbacks for SDK events
   * Can be called at any time to update callbacks
   */
  public setCallbacks(callbacks: UserplaneCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Initialize the SDK with options
   *
   * @param options - Configuration options
   * @returns UserplaneRecorder instance
   */
  public static initialize(options: InitializeOptions = {}): UserplaneRecorder {
    if (!UserplaneRecorder.instance) {
      UserplaneRecorder.instance = new UserplaneRecorder();
    }

    const instance = UserplaneRecorder.instance;

    if (options.recorderBaseUrl) {
      instance.recorderBaseUrl = options.recorderBaseUrl;
    }

    const openImmediately = options.openImmediately !== false;

    instance.performInitialization(openImmediately);

    return instance;
  }

  /**
   * Internal initialization logic
   * Collects workspace IDs and URL params, optionally opens immediately
   *
   * @param openImmediately - Whether to auto-open when URL params are detected
   */
  private performInitialization(openImmediately: boolean): void {
    if (this.isInitialized) {
      console.warn('[Userplane] Already initialized');
      return;
    }

    console.log('[Userplane] Initializing SDK');
    this.isInitialized = true;

    const urlParams = parseUrlParams();
    if (!urlParams) {
      console.log('[Userplane] No recording action in URL');
      return;
    }

    console.log('[Userplane] Recording action detected');
    console.log('[Userplane] Token:', urlParams.token.substring(0, 20) + '...');
    console.log('[Userplane] Action:', urlParams.action);

    const workspaceIds = readWorkspaceIds();

    const params: RecorderParams = {
      baseUrl: this.recorderBaseUrl,
      workspaceIds,
      token: urlParams.token,
      action: urlParams.action,
    };

    if (openImmediately) {
      this.frameManager.tryMount(params);
    } else {
      console.log('[Userplane] Deferring recorder mount (openImmediately: false)');
      this.pendingParams = params;
    }
  }

  /**
   * Manually open the recorder with a token
   * Useful when openImmediately is false or for programmatic control
   *
   * @param token - Recording token (optional, will use token from URL if not provided)
   * @returns true if recorder was opened, false otherwise
   */
  public open(token?: string): boolean {
    if (!this.isInitialized) {
      console.error('[Userplane] Not initialized. Call initialize() first.');
      return false;
    }

    if (this.frameManager.isMounted()) {
      console.warn('[Userplane] Recorder is already open');
      return false;
    }

    let params: RecorderParams;

    if (token) {
      const workspaceIds = readWorkspaceIds();
      params = {
        baseUrl: this.recorderBaseUrl,
        workspaceIds,
        token,
        action: 'recording',
      };
    } else if (this.pendingParams) {
      params = this.pendingParams;
    } else {
      const urlParams = parseUrlParams();
      if (!urlParams) {
        console.error('[Userplane] No token provided and no recording action in URL');
        return false;
      }

      const workspaceIds = readWorkspaceIds();
      params = {
        baseUrl: this.recorderBaseUrl,
        workspaceIds,
        token: urlParams.token,
        action: urlParams.action,
      };
    }

    console.log('[Userplane] Opening recorder manually');
    return this.frameManager.tryMount(params);
  }

  /**
   * Unmount the recorder iframe
   */
  public unmount(): void {
    this.frameManager.unmount();
    console.log('[Userplane] Recorder unmounted');
  }

  /**
   * Check if the recorder is currently mounted
   *
   * @returns true if recorder is mounted and visible
   */
  public isRecorderMounted(): boolean {
    return this.frameManager.isMounted();
  }

  /**
   * Check if the SDK has been initialized
   *
   * @returns true if initialized
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the unique tab reference for this browser tab
   * This reference persists in sessionStorage for the lifetime of the tab
   *
   * @returns Unique tab reference
   */
  public getTabRef(): string {
    return this.tabRef;
  }

  /**
   * Clear the tab reference from sessionStorage and window
   * Useful for testing or when you want to generate a new tab ref
   * Note: A new tab ref will be generated on next initialization
   */
  public static clearTabRef(): void {
    clearTabRef();
    console.log('[Userplane] Tab Ref cleared');
  }

  /**
   * Register a metadata function for recordings (static version)
   *
   * The provided function will be called when a recording is being submitted,
   * and the returned data will be attached as custom metadata to the recording.
   *
   * @param metadataFunction - A function that returns a serializable object
   *
   * @example
   * ```typescript
   * Userplane.metadata(() => ({
   *   userId: getCurrentUser().id,
   *   plan: 'enterprise',
   *   version: APP_VERSION
   * }));
   *
   * // React integration
   * useEffect(() => {
   *   Userplane.metadata(() => ({
   *     userId: user?.id,
   *     route: location.pathname
   *   }));
   * }, [user, location]);
   * ```
   */
  public static metadata(metadataFunction: MetadataFunction): void {
    setMetadata(metadataFunction);
  }

  /**
   * Clear the registered metadata function (static version)
   * Useful for cleanup or testing
   */
  public static clearMetadata(): void {
    clearMetadata();
  }

  /**
   * Register a metadata function for recordings (instance version)
   * Delegates to static method for convenience when using window.Userplane
   *
   * @param metadataFunction - A function that returns a serializable object
   */
  public metadata(metadataFunction: MetadataFunction): void {
    setMetadata(metadataFunction);
  }

  /**
   * Clear the registered metadata function (instance version)
   * Delegates to static method for convenience when using window.Userplane
   */
  public clearMetadata(): void {
    clearMetadata();
  }

  /**
   * Get the current recording state
   * Returns 'inactive' if recorder is not mounted or bridge is not connected
   */
  public getRecordingState(): RecordingState {
    const context = this.frameManager.getRecordingContext();
    return context?.state ?? 'inactive';
  }

  /**
   * Get the full recording context including session info
   * Returns null if recorder is not mounted or bridge is not connected
   */
  public getRecordingContext(): RecordingContext | null {
    return this.frameManager.getRecordingContext();
  }

  /**
   * Check if the bridge connection to the recorder is established
   */
  public isBridgeConnected(): boolean {
    return this.frameManager.isBridgeConnected();
  }

  /**
   * Get the current session ID from the recording
   * Returns null if no active recording session
   */
  public getSessionId(): string | null {
    return this.frameManager.getSessionId();
  }

  /**
   * Get the current link ID from the recording
   * Returns null if no active recording session
   */
  public getLinkId(): string | null {
    return this.frameManager.getLinkId();
  }
}

// Auto-initialize when script loads (with default openImmediately: true)
if (typeof window !== 'undefined') {
  UserplaneRecorder.initialize();
}

// Expose to window for programmatic access
declare global {
  interface Window {
    Userplane?: UserplaneRecorder;
    __userplaneTabRef?: string;
  }
}

if (typeof window !== 'undefined') {
  window.Userplane = UserplaneRecorder.initialize();
}

export default UserplaneRecorder;

// Export metadata types for consumers who need them
export type { MetadataFunction, SerializableObject };

// Named export for namespace-style usage: import { userplane } from '@userplane/sdk'
export * as userplane from './metadata';
