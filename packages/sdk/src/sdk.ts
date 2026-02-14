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

import {
  clearMetadata as clearMetadataFn,
  metadata as setMetadataFn,
  type MetadataFunction,
  type Serializable,
  set as setMetadataValue,
} from '@workspace/metadata';

import type { RecordingSessionInfo } from './bridge';
import { FrameManagerFactory } from './frame/factory';
import type { IFrameManager, IRecordingFrameManager } from './frame/types';
import { logger } from './logger';
import type {
  ActionType,
  InitializeOptions,
  RecorderParams,
  RecordingContext,
  RecordingState,
  SerializableUserplaneData,
} from './types';
import { readWorkspaceIds } from './utils/meta';
import { clearTabRef as clearTabRefUtil, getOrCreateTabRef } from './utils/tab';
import { parseUrlParams } from './utils/url';

// Compile-time constants injected by Vite define (see vite.config.ts).
// When consumed from source by other bundlers (e.g. Next.js/Turbopack in dev),
// the defines don't exist, so we guard with typeof and fall back to production defaults.
declare const __RECORDER_BASE_URL__: string;
declare const __VERIFICATION_BASE_URL__: string;

// Internal state
let factory: FrameManagerFactory | null = null;
let currentManager: IFrameManager | null = null;
let captureManager: IFrameManager | null = null;
let recorderBaseUrl =
  typeof __RECORDER_BASE_URL__ !== 'undefined'
    ? __RECORDER_BASE_URL__
    : 'https://recorder.userplane.io';
let verificationBaseUrl =
  typeof __VERIFICATION_BASE_URL__ !== 'undefined'
    ? __VERIFICATION_BASE_URL__
    : 'https://api.userplane.io/api/v1';
let initialized = false;
let pendingParams: RecorderParams | null = null;
let tabRef: string | null = null;
let initOptions: InitializeOptions = {};
let captureEnabled = true;

/**
 * Path mappings for different action types
 */
const ACTION_PATHS: Record<ActionType, string> = {
  recording: '/r',
  verify: '/verify',
  capture: '/capture',
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
 * Handle close request from frame manager
 */
function handleCloseRequest(): void {
  logger.info('Frame requested close');
  currentManager?.unmount();
  currentManager = null;

  // Remount capture iframe after main frame closes
  mountCaptureIfNeeded();
}

/**
 * Handle capture connection established
 */
function handleCaptureConnected(): void {
  logger.info('Capture iframe connected');
}

/**
 * Mount the capture iframe if conditions are met
 * Capture runs when no recorder/verify is active
 */
function mountCaptureIfNeeded(): void {
  if (!factory || !initialized || !captureEnabled) {
    return;
  }

  // Don't mount if main frame is already active
  if (currentManager?.isMounted()) {
    logger.debug('Skipping capture mount - main frame active');
    return;
  }

  // Don't remount if already mounted
  if (captureManager?.isMounted()) {
    return;
  }

  const workspaceIds = getWorkspaceIds(initOptions);
  const params: RecorderParams = {
    baseUrl: getActionUrl(recorderBaseUrl, 'capture'),
    workspaceIds,
    token: '', // Capture doesn't need a token
    action: 'capture',
  };

  logger.info('Mounting capture iframe');
  captureManager = factory.create('capture');
  captureManager.tryMount(params);
}

/**
 * Unmount the capture iframe
 */
function unmountCapture(): void {
  if (captureManager?.isMounted()) {
    logger.info('Unmounting capture iframe');
    captureManager.unmount();
  }
}

/**
 * Handle session ready event
 */
function handleSessionReady(info: RecordingSessionInfo): void {
  logger.info({ session: info }, 'Session ready');
}

/**
 * Handle recording state change
 */
function handleRecordingStateChange(state: RecordingState): void {
  logger.info({ state }, 'Recording state changed');
}

/**
 * Mount a frame using the factory
 */
function mountWithFactory(params: RecorderParams): boolean {
  if (!factory) {
    logger.error('Factory not initialized');
    return false;
  }

  // Unmount capture iframe before mounting main frame
  unmountCapture();

  // Create the appropriate manager for this action
  currentManager = factory.create(params.action);
  return currentManager.tryMount(params);
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
    logger.debug('SDK is already initialized');
    return;
  }

  logger.info('Initializing SDK');
  initialized = true;
  initOptions = options;

  // Set up tab reference
  tabRef = getOrCreateTabRef();
  logger.debug({ tabRef }, 'Tab Ref');

  // Set recorder base URL
  if (options.recorderBaseUrl) {
    recorderBaseUrl = options.recorderBaseUrl;
  }

  // Set verification API base URL
  if (options.verificationBaseUrl) {
    verificationBaseUrl = options.verificationBaseUrl;
  }

  // Set capture enabled (default: true)
  captureEnabled = options.captureEnabled !== false;

  // Create frame manager factory with callbacks
  factory = new FrameManagerFactory({
    tabRef,
    verificationBaseUrl,
    onRequestClose: handleCloseRequest,
    onSessionReady: handleSessionReady,
    onRecordingStateChange: handleRecordingStateChange,
    onCaptureConnected: handleCaptureConnected,
  });

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
    mountWithFactory(params);
    return;
  }

  // Check URL for recording/verification params
  const urlData = parseUserplaneUrl(window.location.href);
  if (!urlData || !urlData.token) {
    logger.debug('No userplane action in URL');
    // No action in URL - mount capture iframe for background metadata collection
    mountCaptureIfNeeded();
    return;
  }

  const action: ActionType = urlData.action || 'recording';
  logger.info(
    { action, token: urlData.token.substring(0, 20) + '...' },
    'Userplane action detected'
  );

  // Route to appropriate handler based on action
  if (action === 'verify') {
    // Verification always mounts immediately (no deferred mode)
    logger.info('Auto-mounting verification');
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
    mountWithFactory(params);
  } else {
    logger.debug('Deferring recorder mount (openImmediately: false)');
    pendingParams = params;
    // Mount capture while waiting for manual open()
    mountCaptureIfNeeded();
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
  if (!initialized || !factory) {
    logger.error('Not initialized. Call initialize() first.');
    return false;
  }

  if (currentManager?.isMounted()) {
    logger.debug('Recorder is already open');
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
      logger.error({ action: pendingParams.action }, 'open() is only for recording');
      return false;
    }
    params = pendingParams;
  } else {
    const urlData = parseUserplaneUrl(window.location.href);
    if (!urlData || !urlData.token) {
      logger.error('No token provided and no recording action in URL');
      return false;
    }

    // Only allow recording via open()
    if (urlData.action && urlData.action !== 'recording') {
      logger.error({ action: urlData.action }, 'open() is only for recording');
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

  logger.info('Opening recorder');
  return mountWithFactory(params);
}

/**
 * Internal: Mount verification iframe
 * Only triggered automatically from URL params, not exposed publicly
 */
function mountVerification(token: string): boolean {
  if (!initialized || !factory) {
    logger.error('Not initialized. Call initialize() first.');
    return false;
  }

  if (currentManager?.isMounted()) {
    logger.debug('Frame is already mounted');
    return false;
  }

  const workspaceIds = getWorkspaceIds(initOptions);
  const params: RecorderParams = {
    baseUrl: getActionUrl(recorderBaseUrl, 'verify'),
    workspaceIds,
    token,
    action: 'verify',
  };

  logger.info('Mounting verification');
  return mountWithFactory(params);
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
  if (currentManager) {
    currentManager.unmount();
    currentManager = null;
    logger.info('Frame unmounted');
  }
}

/**
 * Check if the recorder is currently mounted and visible.
 *
 * @returns true if recorder is mounted
 */
export function isRecorderMounted(): boolean {
  return currentManager?.isMounted() ?? false;
}

/**
 * Check if the bridge connection to the recorder is established.
 *
 * @returns true if bridge is connected
 */
export function isBridgeConnected(): boolean {
  return currentManager?.isBridgeConnected() ?? false;
}

/**
 * Get the current recording state.
 *
 * @returns Current recording state ('inactive', 'recording', 'paused', etc.)
 */
export function getRecordingState(): RecordingState {
  // Only available for recording managers
  const recordingManager = currentManager as IRecordingFrameManager | null;
  const context = recordingManager?.getRecordingContext?.();
  return context?.state ?? 'inactive';
}

/**
 * Get the full recording context including session info.
 *
 * @returns Recording context or null if not available
 */
export function getRecordingContext(): RecordingContext | null {
  // Only available for recording managers
  const recordingManager = currentManager as IRecordingFrameManager | null;
  return recordingManager?.getRecordingContext?.() ?? null;
}

/**
 * Get the current session ID from the recording.
 *
 * @returns Session ID or null if no active session
 */
export function getSessionId(): string | null {
  // Only available for recording managers
  const recordingManager = currentManager as IRecordingFrameManager | null;
  return recordingManager?.getSessionId?.() ?? null;
}

/**
 * Get the current link ID from the recording.
 *
 * @returns Link ID or null if no active session
 */
export function getLinkId(): string | null {
  // Only available for recording managers
  const recordingManager = currentManager as IRecordingFrameManager | null;
  return recordingManager?.getLinkId?.() ?? null;
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
  logger.info('Tab Ref cleared');
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
 * Set static key-value metadata as defaults that can be overridden.
 *
 * Use this for default data that should be included unless explicitly
 * overridden by the dynamic metadata function:
 * - Default application version
 * - Fallback environment name
 * - Build number
 * - Static configuration
 *
 * @param key - The metadata key
 * @param value - Any serializable value
 *
 * @remarks
 * Static metadata provides defaults that the dynamic metadata function can override.
 * This allows flexibility while maintaining baseline data.
 *
 * @example
 * ```typescript
 * // Set static metadata as defaults
 * userplane.set('appVersion', '2.1.0');
 * userplane.set('environment', 'production');
 * userplane.set('buildId', process.env.BUILD_ID);
 *
 * // Register a function that can override
 * userplane.metadata(() => ({
 *   userId: getCurrentUser().id,
 *   appVersion: '3.0.0-beta',  // This OVERRIDES the static value
 * }));
 *
 * // Result will be:
 * // { appVersion: '3.0.0-beta', environment: 'production', buildId: '...', userId: '...' }
 * ```
 */
export function set(key: string, value: Serializable): void {
  setMetadataValue(key, value);
}

/**
 * Clear metadata.
 *
 * @param keyOrType - Optional parameter:
 *   - undefined: Clears both function and all static metadata (default)
 *   - 'function': Clears only the metadata function
 *   - 'static': Clears all static key-value pairs
 *   - string key: Clears that specific static key
 *
 * @example
 * ```typescript
 * // Clear everything
 * userplane.clearMetadata();
 *
 * // Clear only the function
 * userplane.clearMetadata('function');
 *
 * // Clear all static metadata
 * userplane.clearMetadata('static');
 *
 * // Clear a specific key
 * userplane.clearMetadata('userId');
 * ```
 */
export function clearMetadata(keyOrType?: string): void {
  clearMetadataFn(keyOrType);
}

// Re-export types for consumers
export type {
  ActionType,
  InitializeOptions,
  MetadataFunction,
  RecordingContext,
  RecordingState,
  Serializable,
  SerializableUserplaneData,
};
