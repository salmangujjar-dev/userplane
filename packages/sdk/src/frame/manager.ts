/**
 * Frame Manager
 * Manages the lifecycle of the recorder iframe overlay.
 * Handles frame creation, mounting, and cleanup.
 */

import type { RecorderFrame, FrameConfig, RecorderParams } from '../types';
import { URL_PARAMS } from '../constants';
import { FrameConfigBuilder } from '../config/builder';
import { createOverlay, createIframe, hasExistingRecorder } from './dom';

/**
 * Manages the recorder iframe and overlay.
 * Responsible for config building, mounting checks, and frame lifecycle.
 */
export class FrameManager {
  private frame: RecorderFrame | null = null;

  /**
   * Attempts to mount the recorder with the provided parameters.
   * Validates conditions and creates/mounts the frame if all checks pass.
   *
   * @param params - Recorder parameters including base URL, workspace IDs, token, and action.
   * @returns `true` if recorder was mounted, `false` otherwise.
   */
  public tryMount(params: RecorderParams): boolean {
    console.log('[FrameManager] Attempting to mount recorder');

    if (this.isMounted()) {
      console.warn('[FrameManager] Recorder is already mounted');
      return false;
    }

    if (hasExistingRecorder()) {
      console.error('[FrameManager] Another Userplane recorder is already open');
      return false;
    }

    if (params.workspaceIds.length === 0) {
      console.error('[FrameManager] No workspace IDs provided');
      return false;
    }

    console.log('[FrameManager] Mounting recorder');
    console.log('[FrameManager] Workspace IDs:', params.workspaceIds);

    const config = this.buildConfig(params);
    console.log('[FrameManager] Iframe URL:', config.url);

    this.createFrame(config);
    this.mount();

    return true;
  }

  /**
   * Builds complete frame configuration from recorder parameters.
   * Constructs URL with query parameters and uses default config values.
   *
   * @param params - Recorder parameters
   * @returns Complete FrameConfig ready for use
   */
  private buildConfig(params: RecorderParams): FrameConfig {
    const url = new URL(params.baseUrl);
    url.searchParams.set(URL_PARAMS.TOKEN, params.token);
    url.searchParams.set(URL_PARAMS.ACTION, params.action);

    if (params.workspaceIds.length > 0) {
      url.searchParams.set(URL_PARAMS.WORKSPACE, params.workspaceIds.join(','));
    }

    return new FrameConfigBuilder()
      .withUrl(url.toString())
      .withOnLoad(() => console.log('[FrameManager] Recorder loaded successfully'))
      .withOnError(() => console.error('[FrameManager] Failed to load recorder'))
      .build();
  }

  /**
   * Creates and configures the recorder frame.
   * Does not mount to DOM - use `mount()` for that.
   *
   * @param config - Frame configuration
   * @returns RecorderFrame containing overlay and iframe
   */
  private createFrame(config: FrameConfig): RecorderFrame {
    if (this.frame) {
      console.warn('[FrameManager] Frame already exists, returning existing frame');
      return this.frame;
    }

    console.log('[FrameManager] Creating recorder frame');

    const overlay = createOverlay(config);
    const iframe = createIframe(config);
    overlay.appendChild(iframe);

    this.frame = { overlay, iframe };
    return this.frame;
  }

  /**
   * Mounts the frame to the document body.
   * Waits for DOM ready state if necessary.
   */
  private mount(): void {
    if (!this.frame) {
      throw new Error('[FrameManager] No frame to mount. Call createFrame() first.');
    }

    if (document.contains(this.frame.overlay)) {
      console.warn('[FrameManager] Frame is already mounted to DOM');
      return;
    }

    const frame = this.frame;

    const mountFn = () => {
      if (document.readyState !== 'loading') {
        document.body.appendChild(frame.overlay);
        document.removeEventListener('readystatechange', mountFn);
        frame.iframe.focus();
        console.log('[FrameManager] Frame mounted to DOM');
      }
    };

    document.addEventListener('readystatechange', mountFn);
    mountFn();
  }

  /**
   * Unmounts and cleans up the frame.
   * Removes from DOM and clears internal reference.
   */
  public unmount(): void {
    if (!this.frame) {
      console.warn('[FrameManager] No frame to unmount');
      return;
    }

    if (document.contains(this.frame.overlay)) {
      document.body.removeChild(this.frame.overlay);
      console.log('[FrameManager] Frame unmounted from DOM');
    }

    this.frame = null;
  }

  /**
   * Checks if the frame is currently mounted.
   *
   * @returns true if frame exists and is in the DOM, false otherwise
   */
  public isMounted(): boolean {
    return this.frame !== null && document.contains(this.frame.overlay);
  }

  /**
   * Gets the current frame if it exists.
   *
   * @returns RecorderFrame if mounted, null otherwise
   */
  public getFrame(): RecorderFrame | null {
    return this.frame;
  }
}
