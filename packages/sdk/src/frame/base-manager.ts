/**
 * Base Frame Manager
 * Abstract base class with shared frame lifecycle logic
 */

import { FrameConfigBuilder } from '../config/builder';
import { URL_PARAMS } from '../constants';
import { createSdkLogger } from '../logger';
import type { FrameConfig, RecorderFrame, RecorderParams } from '../types';
import { createIframe, createOverlay, hasExistingRecorder } from './dom';
import type { FrameManagerConfig, IFrameManager } from './types';

/**
 * Abstract base class for frame managers
 * Handles common frame creation, mounting, and lifecycle management
 */
export abstract class BaseFrameManager implements IFrameManager {
  protected frame: RecorderFrame | null = null;
  protected config: FrameManagerConfig;
  protected logger = createSdkLogger('FrameManager');
  protected pendingMountListener: (() => void) | null = null;

  constructor(config: FrameManagerConfig) {
    this.config = config;
  }

  /**
   * Attempt to mount the frame
   * Performs common validation before delegating to subclass
   */
  public tryMount(params: RecorderParams): boolean {
    this.logger.debug('Attempting to mount');

    if (this.isMounted()) {
      this.logger.debug('Frame is already mounted');
      return false;
    }

    if (hasExistingRecorder()) {
      this.logger.error('Another Userplane frame is already open');
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
   * Unmount and cleanup the frame
   */
  public unmount(): void {
    // Clean up pending readystatechange listener if mount was deferred
    if (this.pendingMountListener) {
      document.removeEventListener('readystatechange', this.pendingMountListener);
      this.pendingMountListener = null;
    }

    // Disconnect bridge first (implemented by subclass)
    this.disconnectBridge();

    if (!this.frame) {
      this.logger.debug('No frame to unmount');
      return;
    }

    if (document.contains(this.frame.overlay)) {
      document.body.removeChild(this.frame.overlay);
      this.logger.debug('Frame unmounted from DOM');
    }

    this.frame = null;
  }

  /**
   * Check if frame is mounted
   */
  public isMounted(): boolean {
    return this.frame !== null && document.contains(this.frame.overlay);
  }

  /**
   * Get the current frame
   */
  public getFrame(): RecorderFrame | null {
    return this.frame;
  }

  /**
   * Check if bridge is connected (implemented by subclass)
   */
  public abstract isBridgeConnected(): boolean;

  /**
   * Get the manager name for logging
   */
  protected abstract getManagerName(): string;

  /**
   * Establish the bridge connection (implemented by subclass)
   */
  protected abstract establishBridge(): void;

  /**
   * Disconnect the bridge (implemented by subclass)
   */
  protected abstract disconnectBridge(): void;

  /**
   * Build frame configuration from parameters
   */
  protected buildFrameConfig(params: RecorderParams): FrameConfig {
    const url = new URL(params.baseUrl);
    url.searchParams.set(URL_PARAMS.TOKEN, params.token);
    url.searchParams.set(URL_PARAMS.ACTION, params.action);

    if (params.workspaceIds.length > 0) {
      url.searchParams.set(URL_PARAMS.WORKSPACE, params.workspaceIds.join(','));
    }

    // Forward userplane-meta from host page URL to recorder iframe
    const hostParams = new URLSearchParams(window.location.search);
    const meta = hostParams.get(URL_PARAMS.META);
    if (meta) {
      url.searchParams.set(URL_PARAMS.META, meta);
    }

    return new FrameConfigBuilder()
      .withUrl(url.toString())
      .withOnLoad(() => {
        this.logger.debug('Frame loaded successfully');
        this.establishBridge();
      })
      .withOnError(() => this.logger.error('Failed to load frame'))
      .build();
  }

  /**
   * Create the frame elements
   */
  protected createFrame(config: FrameConfig): RecorderFrame {
    if (this.frame) {
      this.logger.debug('Frame already exists');
      return this.frame;
    }

    this.logger.debug('Creating frame');

    const overlay = createOverlay(config);
    const iframe = createIframe(config);
    overlay.appendChild(iframe);

    this.frame = { overlay, iframe };
    return this.frame;
  }

  /**
   * Mount the frame to DOM
   */
  protected mountToDOM(): void {
    if (!this.frame) {
      throw new Error(`[${this.getManagerName()}] No frame to mount`);
    }

    if (document.contains(this.frame.overlay)) {
      this.logger.debug('Frame already in DOM');
      return;
    }

    const frame = this.frame;

    const mountFn = () => {
      if (document.readyState !== 'loading') {
        document.body.appendChild(frame.overlay);
        document.removeEventListener('readystatechange', mountFn);
        this.pendingMountListener = null;
        frame.iframe.focus();
        this.logger.debug('Frame mounted to DOM');
      }
    };

    this.pendingMountListener = mountFn;
    document.addEventListener('readystatechange', mountFn);
    mountFn();
  }

  /**
   * Handle close request from bridge
   */
  protected handleCloseRequest(): void {
    this.logger.debug('Close requested via bridge');
    this.config.onRequestClose?.();
    this.unmount();
  }
}
