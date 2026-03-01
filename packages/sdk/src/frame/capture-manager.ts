/**
 * Capture Frame Manager
 * Manages a hidden 1x1 iframe for metadata extraction and cross-tab coordination
 *
 * Key differences from recorder/verification managers:
 * - Creates a hidden 1x1 iframe (not a full-screen overlay)
 * - No backdrop or visual presence
 * - Always present once mounted (background process)
 * - Used for scatter-gather metadata collection
 */

import { CaptureBridgeConnection, type CaptureRecorderState, type TabMetadata } from '../bridge';
import type { LogCapturePreferences, LogCaptureState, LogEntries } from '../bridge/types';
import { URL_PARAMS } from '../constants';
import { createSdkLogger } from '../logger';
import type { FrameConfig, RecorderFrame, RecorderParams } from '../types';
import type { CaptureFrameManagerConfig, ICaptureFrameManager } from './types';

/**
 * Frame manager for capture (hidden metadata extraction)
 * Creates a 1x1 invisible iframe that connects to the capture page
 */
export class CaptureFrameManager implements ICaptureFrameManager {
  private frame: RecorderFrame | null = null;
  private bridge: CaptureBridgeConnection | null = null;
  private config: CaptureFrameManagerConfig;
  private logger = createSdkLogger('CaptureFrameManager');
  private pendingMountListener: (() => void) | null = null;

  constructor(config: CaptureFrameManagerConfig) {
    this.config = config;
  }

  /**
   * Attempt to mount the capture iframe
   */
  public tryMount(params: RecorderParams): boolean {
    this.logger.debug('Attempting to mount');

    if (this.isMounted()) {
      this.logger.debug('Frame is already mounted');
      return false;
    }

    // Don't check for existing recorder - capture runs alongside
    // But don't mount multiple capture iframes
    if (this.hasExistingCapture()) {
      this.logger.debug('Another capture iframe already exists');
      return false;
    }

    if (params.workspaceIds.length === 0) {
      this.logger.error('No workspace IDs provided');
      return false;
    }

    this.logger.debug({ workspaceIds: params.workspaceIds }, 'Workspace IDs');

    const frameConfig = this.buildFrameConfig(params);
    this.logger.debug({ url: frameConfig.url }, 'Frame URL');

    this.createFrame(frameConfig);
    this.mountToDOM();

    return true;
  }

  /**
   * Unmount and cleanup the capture iframe
   */
  public unmount(): void {
    // Clean up pending readystatechange listener if mount was deferred
    if (this.pendingMountListener) {
      document.removeEventListener('readystatechange', this.pendingMountListener);
      this.pendingMountListener = null;
    }

    this.disconnectBridge();

    if (!this.frame) {
      this.logger.debug('No frame to unmount');
      return;
    }

    // Remove just the iframe (no overlay for capture)
    if (document.contains(this.frame.iframe)) {
      document.body.removeChild(this.frame.iframe);
      this.logger.debug('Frame unmounted from DOM');
    }

    this.frame = null;
  }

  /**
   * Check if frame is mounted
   */
  public isMounted(): boolean {
    return this.frame !== null && document.contains(this.frame.iframe);
  }

  /**
   * Get the current frame
   */
  public getFrame(): RecorderFrame | null {
    return this.frame;
  }

  /**
   * Check if bridge is connected
   */
  public isBridgeConnected(): boolean {
    return this.bridge?.isConnected() ?? false;
  }

  /**
   * Extract metadata from the capture iframe
   */
  public async extractMetadata(): Promise<TabMetadata | null> {
    return this.bridge?.extractMetadata() ?? null;
  }

  /**
   * Update recorder state for cross-tab awareness
   */
  public updateRecorderState(state: CaptureRecorderState): void {
    this.bridge?.updateRecorderState(state);
  }

  /**
   * Get current recorder state being tracked
   */
  public getRecorderState(): CaptureRecorderState {
    return (
      this.bridge?.getRecorderState() ?? {
        recorderTabId: null,
        recorderState: 'inactive',
        lastStateUpdate: Date.now(),
      }
    );
  }

  /**
   * Check if the capture iframe is alive
   */
  public async ping(): Promise<boolean> {
    return this.bridge?.ping() ?? false;
  }

  // ---------------------------------------------------------------------------
  // Log Capture Methods (pass-through to bridge)
  // ---------------------------------------------------------------------------

  /**
   * Start log capture on the parent page
   */
  public async startLogCapture(
    preferences: LogCapturePreferences,
    sessionId: string,
    tabId: string,
    workspaceId: string,
    internalEndpoints?: string[]
  ): Promise<void> {
    await this.bridge?.startLogCapture(
      preferences,
      sessionId,
      tabId,
      workspaceId,
      internalEndpoints
    );
  }

  /**
   * Stop log capture on the parent page
   */
  public stopLogCapture(): void {
    this.bridge?.stopLogCapture();
  }

  /**
   * Get current log capture state
   */
  public getLogCaptureState(): LogCaptureState {
    return this.bridge?.getLogCaptureState() ?? 'disabled';
  }

  /**
   * Get all captured log entries
   */
  public async getLogEntries(): Promise<LogEntries> {
    return this.bridge?.getLogEntries() ?? { network: [], console: [], action: [] };
  }

  /**
   * Clear all stored log entries
   */
  public async clearLogStore(): Promise<void> {
    await this.bridge?.clearLogStore();
  }

  /**
   * Build frame configuration for capture iframe
   * Uses minimal config - no overlay, hidden iframe
   */
  private buildFrameConfig(params: RecorderParams): FrameConfig {
    const url = new URL(params.baseUrl);
    url.searchParams.set(URL_PARAMS.TOKEN, params.token);
    url.searchParams.set(URL_PARAMS.ACTION, 'capture');

    if (params.workspaceIds.length > 0) {
      url.searchParams.set(URL_PARAMS.WORKSPACE, params.workspaceIds.join(','));
    }

    return {
      url: url.toString(),
      // Minimal styling - iframe will be hidden
      zIndex: '1',
      overlayBackgroundColor: 'transparent',
      backdropBlur: false,
      // Standard sandbox permissions
      sandbox: 'allow-scripts allow-same-origin allow-popups',
      allow: '',
      allowFullscreen: false,
      onLoad: () => {
        this.logger.debug('Frame loaded successfully');
        this.establishBridge();
      },
      onError: () => {
        this.logger.error('Failed to load frame');
      },
    };
  }

  /**
   * Create the capture iframe (hidden 1x1)
   * Following Jam's approach: width=0, height=0, display=none, visibility=hidden
   */
  private createFrame(config: FrameConfig): RecorderFrame {
    if (this.frame) {
      this.logger.debug('Frame already exists');
      return this.frame;
    }

    this.logger.debug('Creating hidden capture frame');

    const iframe = document.createElement('iframe');

    // Hidden 1x1 iframe styling (exactly like Jam)
    Object.assign(iframe.style, {
      width: '0',
      height: '0',
      display: 'none',
      visibility: 'hidden',
      position: 'absolute',
      top: '-1px',
      left: '-1px',
      border: 'none',
      pointerEvents: 'none',
    });

    iframe.src = config.url;
    iframe.dataset.userplaneCapture = ''; // Marker for identification
    iframe.setAttribute('sandbox', config.sandbox);

    if (config.onLoad) {
      iframe.addEventListener('load', config.onLoad);
    }

    if (config.onError) {
      iframe.addEventListener('error', config.onError);
    }

    // For capture, we use iframe directly without overlay wrapper
    // Create a dummy overlay to satisfy the RecorderFrame interface
    const dummyOverlay = document.createElement('div');
    dummyOverlay.style.display = 'none';

    this.frame = { overlay: dummyOverlay, iframe };
    return this.frame;
  }

  /**
   * Mount the capture iframe to DOM
   */
  private mountToDOM(): void {
    if (!this.frame) {
      throw new Error('[CaptureFrameManager] No frame to mount');
    }

    if (document.contains(this.frame.iframe)) {
      this.logger.debug('Frame already in DOM');
      return;
    }

    const frame = this.frame;

    const mountFn = () => {
      if (document.readyState !== 'loading') {
        // Append iframe directly to body (no overlay needed)
        document.body.appendChild(frame.iframe);
        document.removeEventListener('readystatechange', mountFn);
        this.pendingMountListener = null;
        this.logger.debug('Frame mounted to DOM (hidden)');
      }
    };

    this.pendingMountListener = mountFn;
    document.addEventListener('readystatechange', mountFn);
    mountFn();
  }

  /**
   * Establish bridge connection to capture iframe
   */
  private establishBridge(): void {
    if (!this.frame) {
      this.logger.error('No frame to connect bridge to');
      return;
    }

    this.logger.debug('Establishing capture bridge');

    this.bridge = new CaptureBridgeConnection({
      tabRef: this.config.tabRef,
      excludeCaptureEndpoints: this.config.excludeCaptureEndpoints,
      callbacks: {
        onConnected: this.config.onConnected,
        onRecorderStateChange: this.config.onRecorderStateChange,
      },
    });

    this.bridge.connect(this.frame.iframe).catch((error) => {
      this.logger.error({ err: error }, 'Bridge connection failed');
      this.unmount();
    });
  }

  /**
   * Disconnect the bridge
   */
  private disconnectBridge(): void {
    if (this.bridge) {
      this.bridge.disconnect();
      this.bridge = null;
      this.logger.debug('Bridge disconnected');
    }
  }

  /**
   * Check if a capture iframe already exists in the DOM
   */
  private hasExistingCapture(): boolean {
    return document.querySelector('iframe[data-userplane-capture]') !== null;
  }
}
