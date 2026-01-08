/**
 * Userplane SDK - Namespace-style API
 *
 * Provides a clean namespace interface for the Userplane Recorder SDK.
 * Supports both auto-initialization and manual control.
 *
 * @example
 * ```typescript
 * import * as userplane from '@userplane/sdk';
 *
 * // Initialize with options
 * userplane.initialize({
 *   workspaceId: 'ws_xxx',
 *   openImmediately: false
 * });
 *
 * // Open recorder manually
 * userplane.open('token-from-url');
 *
 * // Set metadata
 * userplane.metadata(() => ({
 *   userId: getCurrentUser().id,
 *   plan: 'enterprise'
 * }));
 * ```
 */

import type {
  ActionType,
  InitializeOptions,
  RecorderParams,
  RecordingState,
  RecordingContext,
  SerializableUserplaneData,
} from './types';
import { FrameManager } from './frame/manager';
import { parseUrlParams } from './utils/url';
import { readWorkspaceIds } from './utils/meta';
import { getOrCreateTabRef, clearTabRef as clearTabRefUtil } from './utils/tab';
import type { BridgeCallbacks, RecordingSessionInfo } from './bridge';
import {
  metadata as setMetadataFn,
  clearMetadata as clearMetadataFn,
  type MetadataFunction,
} from '@workspace/metadata';

// Internal state
let frameManager: FrameManager | null = null;
let recorderBaseUrl = 'http://localhost:4322';
let verificationBaseUrl = 'http://localhost:3001/api/v1';
let initialized = false;
let pendingParams: RecorderParams | null = null;
let tabRef: string | null = null;
let initOptions: InitializeOptions = {};

/**
 * Path mappings for different action types
 */
const ACTION_PATHS: Record<ActionType, string> = {
  recording: '/r',
  verify: '/verify',
  capture: '/r', // Fallback to recording path
};

/**
 * Get the full URL for a given action type
 */
function getActionUrl(baseUrl: string, action: ActionType): string {
  const path = ACTION_PATHS[action] || ACTION_PATHS.recording;
  // Remove trailing slash from baseUrl if present
  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}${path}`;
}

/**
 * Set up bridge callbacks for internal logging
 */
function setupBridgeCallbacks(): void {
  if (!frameManager) return;

  const bridgeCallbacks: BridgeCallbacks = {
    onSessionReady: (info: RecordingSessionInfo) => {
      console.log('[Userplane] Session ready:', info);
    },
    onRecordingStateChange: (state: RecordingState) => {
      console.log('[Userplane] Recording state changed:', state);
    },
    onRequestClose: () => {
      console.log('[Userplane] Recorder requested close');
    },
  };

  frameManager.setBridgeCallbacks(bridgeCallbacks);
}

/**
 * Parse workspace IDs from options or meta tags
 * Handles string, comma-separated string, or array of strings
 */
function getWorkspaceIds(options: InitializeOptions): string[] {
  if (options.workspaceId) {
    if (Array.isArray(options.workspaceId)) {
      return options.workspaceId.map((id) => id.trim()).filter(Boolean);
    }
    return options.workspaceId
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return readWorkspaceIds();
}

/**
 * Parse URL params using custom parser or default
 */
function parseUserplaneUrl(href: string): SerializableUserplaneData | null {
  if (initOptions.parseUserplaneData) {
    return initOptions.parseUserplaneData(href);
  }

  // Default: use existing parseUrlParams
  const params = parseUrlParams();
  if (!params) return null;

  return {
    token: params.token,
    action: params.action,
  };
}

/**
 * Initialize the Userplane SDK.
 *
 * Must be called before using other SDK functions.
 * Can only be called once - subsequent calls will log a warning.
 *
 * @param options - Configuration options
 * @throws Error if SDK is already initialized (in strict mode)
 *
 * @example
 * ```typescript
 * // Basic initialization (auto-opens from URL params)
 * userplane.initialize();
 *
 * // Manual control
 * userplane.initialize({ openImmediately: false });
 *
 * // With workspace ID
 * userplane.initialize({
 *   workspaceId: 'ws_xxx',
 *   openImmediately: true
 * });
 *
 * // Open specific recording immediately
 * userplane.initialize({
 *   openImmediately: 'recording-token-here'
 * });
 * ```
 */
export function initialize(options: InitializeOptions = {}): void {
  if (initialized) {
    console.warn('[Userplane] SDK is already initialized');
    return;
  }

  console.log('[Userplane] Initializing SDK');
  initialized = true;
  initOptions = options;

  // Set up frame manager
  frameManager = new FrameManager();
  tabRef = getOrCreateTabRef();
  console.log('[Userplane] Tab Ref:', tabRef);

  frameManager.setTabRef(tabRef);
  setupBridgeCallbacks();

  // Set recorder base URL
  if (options.recorderBaseUrl) {
    recorderBaseUrl = options.recorderBaseUrl;
  }

  // Set verification API base URL
  if (options.verificationBaseUrl) {
    verificationBaseUrl = options.verificationBaseUrl;
  }

  // Pass verification URL to frame manager for bridge connections
  frameManager.setVerificationBaseUrl(verificationBaseUrl);

  // Determine open behavior
  const openImmediately = options.openImmediately;

  // If openImmediately is a string, it's a token to open immediately
  if (typeof openImmediately === 'string') {
    const workspaceIds = getWorkspaceIds(options);
    const action: ActionType = 'recording';
    const params: RecorderParams = {
      baseUrl: getActionUrl(recorderBaseUrl, action),
      workspaceIds,
      token: openImmediately,
      action,
    };
    frameManager.tryMount(params);
    return;
  }

  // Check URL for recording/verification params
  const urlData = parseUserplaneUrl(window.location.href);
  if (!urlData || !urlData.token) {
    console.log('[Userplane] No userplane action in URL');
    return;
  }

  const action: ActionType = urlData.action || 'recording';
  console.log('[Userplane] Userplane action detected');
  console.log('[Userplane] Token:', urlData.token.substring(0, 20) + '...');
  console.log('[Userplane] Action:', action);

  // Route to appropriate handler based on action
  if (action === 'verify') {
    // Verification always mounts immediately (no deferred mode)
    console.log('[Userplane] Auto-mounting verification');
    mountVerification(urlData.token);
    return;
  }

  // Recording flow
  const workspaceIds = getWorkspaceIds(options);

  const params: RecorderParams = {
    baseUrl: getActionUrl(recorderBaseUrl, 'recording'),
    workspaceIds,
    token: urlData.token,
    action: 'recording',
  };

  // Auto-open if enabled (default: true)
  if (openImmediately !== false) {
    frameManager.tryMount(params);
  } else {
    console.log('[Userplane] Deferring recorder mount (openImmediately: false)');
    pendingParams = params;
  }
}

/**
 * Check if the SDK has been initialized.
 *
 * @returns true if initialize() has been called
 *
 * @example
 * ```typescript
 * if (!userplane.isInitialized()) {
 *   userplane.initialize();
 * }
 * ```
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Open the recorder with an optional token.
 *
 * If no token is provided, uses the token from URL params or pending params.
 *
 * @param token - Recording token (optional)
 * @returns true if recorder was opened, false otherwise
 *
 * @example
 * ```typescript
 * // Open with token
 * userplane.open('recording-token');
 *
 * // Open from pending params (when openImmediately was false)
 * userplane.open();
 * ```
 */
export function open(token?: string): boolean {
  if (!initialized || !frameManager) {
    console.error('[Userplane] Not initialized. Call initialize() first.');
    return false;
  }

  if (frameManager.isMounted()) {
    console.warn('[Userplane] Recorder is already open');
    return false;
  }

  let params: RecorderParams;

  if (token) {
    const workspaceIds = getWorkspaceIds(initOptions);
    params = {
      baseUrl: getActionUrl(recorderBaseUrl, 'recording'),
      workspaceIds,
      token,
      action: 'recording',
    };
  } else if (pendingParams) {
    // Only allow recording from pending params
    if (pendingParams.action !== 'recording') {
      console.error(
        '[Userplane] open() is only for recording. Pending action:',
        pendingParams.action
      );
      return false;
    }
    params = pendingParams;
  } else {
    const urlData = parseUserplaneUrl(window.location.href);
    if (!urlData || !urlData.token) {
      console.error('[Userplane] No token provided and no recording action in URL');
      return false;
    }

    // Only allow recording via open()
    if (urlData.action && urlData.action !== 'recording') {
      console.error('[Userplane] open() is only for recording. URL action:', urlData.action);
      return false;
    }

    const workspaceIds = getWorkspaceIds(initOptions);
    params = {
      baseUrl: getActionUrl(recorderBaseUrl, 'recording'),
      workspaceIds,
      token: urlData.token,
      action: 'recording',
    };
  }

  console.log('[Userplane] Opening recorder');
  return frameManager.tryMount(params);
}

/**
 * Internal: Mount verification iframe
 * Only triggered automatically from URL params, not exposed publicly
 */
function mountVerification(token: string): boolean {
  if (!initialized || !frameManager) {
    console.error('[Userplane] Not initialized. Call initialize() first.');
    return false;
  }

  if (frameManager.isMounted()) {
    console.warn('[Userplane] Frame is already mounted');
    return false;
  }

  const workspaceIds = getWorkspaceIds(initOptions);
  const params: RecorderParams = {
    baseUrl: getActionUrl(recorderBaseUrl, 'verify'),
    workspaceIds,
    token,
    action: 'verify',
  };

  console.log('[Userplane] Mounting verification');
  return frameManager.tryMount(params);
}

/**
 * Close and unmount the recorder iframe.
 *
 * @example
 * ```typescript
 * userplane.unmount();
 * ```
 */
export function unmount(): void {
  if (frameManager) {
    frameManager.unmount();
    console.log('[Userplane] Recorder unmounted');
  }
}

/**
 * Check if the recorder is currently mounted and visible.
 *
 * @returns true if recorder is mounted
 */
export function isRecorderMounted(): boolean {
  return frameManager?.isMounted() ?? false;
}

/**
 * Check if the bridge connection to the recorder is established.
 *
 * @returns true if bridge is connected
 */
export function isBridgeConnected(): boolean {
  return frameManager?.isBridgeConnected() ?? false;
}

/**
 * Get the current recording state.
 *
 * @returns Current recording state ('inactive', 'recording', 'paused', etc.)
 */
export function getRecordingState(): RecordingState {
  const context = frameManager?.getRecordingContext();
  return context?.state ?? 'inactive';
}

/**
 * Get the full recording context including session info.
 *
 * @returns Recording context or null if not available
 */
export function getRecordingContext(): RecordingContext | null {
  return frameManager?.getRecordingContext() ?? null;
}

/**
 * Get the current session ID from the recording.
 *
 * @returns Session ID or null if no active session
 */
export function getSessionId(): string | null {
  return frameManager?.getSessionId() ?? null;
}

/**
 * Get the current link ID from the recording.
 *
 * @returns Link ID or null if no active session
 */
export function getLinkId(): string | null {
  return frameManager?.getLinkId() ?? null;
}

/**
 * Get the unique tab reference for this browser tab.
 * This reference persists in sessionStorage for the lifetime of the tab.
 *
 * @returns Tab reference string
 */
export function getTabRef(): string | null {
  return tabRef;
}

/**
 * Clear the tab reference from sessionStorage.
 * A new tab ref will be generated on next initialization.
 */
export function clearTabRef(): void {
  clearTabRefUtil();
  tabRef = null;
  console.log('[Userplane] Tab Ref cleared');
}

/**
 * Register a metadata function for recordings.
 *
 * The provided function will be called when a recording is being submitted,
 * and the returned data will be attached as custom metadata.
 *
 * @param metadataFn - A function that returns a serializable object
 *
 * @example
 * ```typescript
 * userplane.metadata(() => ({
 *   userId: getCurrentUser().id,
 *   plan: 'enterprise',
 *   version: APP_VERSION
 * }));
 *
 * // React integration
 * useEffect(() => {
 *   userplane.metadata(() => ({
 *     userId: user?.id,
 *     route: location.pathname
 *   }));
 * }, [user, location]);
 * ```
 */
export function metadata(metadataFn: MetadataFunction): void {
  setMetadataFn(metadataFn);
}

/**
 * Clear the registered metadata function.
 */
export function clearMetadata(): void {
  clearMetadataFn();
}

// Re-export types for consumers
export type {
  ActionType,
  InitializeOptions,
  RecordingState,
  RecordingContext,
  SerializableUserplaneData,
  MetadataFunction,
};
