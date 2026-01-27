/**
 * Base Frame Manager
 * Abstract base class with shared frame lifecycle logic
 */

import { FrameConfigBuilder } from '../config/builder';
import { URL_PARAMS } from '../constants';
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

  constructor(config: FrameManagerConfig) {
    this.config = config;
  }

  /**
   * Attempt to mount the frame
   * Performs common validation before delegating to subclass
   */
  public tryMount(params: RecorderParams): boolean {
    const managerName = this.getManagerName();
    console.log(`[${managerName}] Attempting to mount`);

    if (this.isMounted()) {
      console.warn(`[${managerName}] Frame is already mounted`);
      return false;
    }

    if (hasExistingRecorder()) {
      console.error(`[${managerName}] Another Userplane frame is already open`);
      return false;
    }

    if (params.workspaceIds.length === 0) {
      console.error(`[${managerName}] No workspace IDs provided`);
      return false;
    }

    console.log(`[${managerName}] Workspace IDs:`, params.workspaceIds);

    const frameConfig = this.buildFrameConfig(params);
    console.log(`[${managerName}] Frame URL:`, frameConfig.url);

    this.createFrame(frameConfig);
    this.mountToDOM();

    return true;
  }

  /**
   * Unmount and cleanup the frame
   */
  public unmount(): void {
    const managerName = this.getManagerName();

    // Disconnect bridge first (implemented by subclass)
    this.disconnectBridge();

    if (!this.frame) {
      console.warn(`[${managerName}] No frame to unmount`);
      return;
    }

    if (document.contains(this.frame.overlay)) {
      document.body.removeChild(this.frame.overlay);
      console.log(`[${managerName}] Frame unmounted from DOM`);
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

    const managerName = this.getManagerName();

    return new FrameConfigBuilder()
      .withUrl(url.toString())
      .withOnLoad(() => {
        console.log(`[${managerName}] Frame loaded successfully`);
        this.establishBridge();
      })
      .withOnError(() => console.error(`[${managerName}] Failed to load frame`))
      .build();
  }

  /**
   * Create the frame elements
   */
  protected createFrame(config: FrameConfig): RecorderFrame {
    if (this.frame) {
      console.warn(`[${this.getManagerName()}] Frame already exists`);
      return this.frame;
    }

    console.log(`[${this.getManagerName()}] Creating frame`);

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
      console.warn(`[${this.getManagerName()}] Frame already in DOM`);
      return;
    }

    const frame = this.frame;
    const managerName = this.getManagerName();

    const mountFn = () => {
      if (document.readyState !== 'loading') {
        document.body.appendChild(frame.overlay);
        document.removeEventListener('readystatechange', mountFn);
        frame.iframe.focus();
        console.log(`[${managerName}] Frame mounted to DOM`);
      }
    };

    document.addEventListener('readystatechange', mountFn);
    mountFn();
  }

  /**
   * Handle close request from bridge
   */
  protected handleCloseRequest(): void {
    console.log(`[${this.getManagerName()}] Close requested via bridge`);
    this.config.onRequestClose?.();
    this.unmount();
  }
}
