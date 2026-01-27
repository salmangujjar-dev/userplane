/**
 * Recording Frame Manager
 * Manages the recorder iframe with session tracking and state management
 */

import { RecorderBridgeConnection, type RecordingContext } from '../bridge';
import { BaseFrameManager } from './base-manager';
import type { IRecordingFrameManager, RecordingFrameManagerConfig } from './types';

/**
 * Frame manager for recording sessions
 * Handles session lifecycle, recording state, and tab protection
 */
export class RecordingFrameManager extends BaseFrameManager implements IRecordingFrameManager {
  private bridge: RecorderBridgeConnection | null = null;
  private recordingConfig: RecordingFrameManagerConfig;

  constructor(config: RecordingFrameManagerConfig) {
    super(config);
    this.recordingConfig = config;
  }

  protected getManagerName(): string {
    return 'RecordingFrameManager';
  }

  public isBridgeConnected(): boolean {
    return this.bridge?.isConnected() ?? false;
  }

  /**
   * Get the current recording context
   */
  public getRecordingContext(): RecordingContext | null {
    return this.bridge?.getContext() ?? null;
  }

  /**
   * Get the current session ID
   */
  public getSessionId(): string | null {
    return this.bridge?.getSessionId() ?? null;
  }

  /**
   * Get the current link ID
   */
  public getLinkId(): string | null {
    return this.bridge?.getLinkId() ?? null;
  }

  protected establishBridge(): void {
    if (!this.frame) {
      console.error('[RecordingFrameManager] No frame to connect bridge to');
      return;
    }

    console.log('[RecordingFrameManager] Establishing recorder bridge');

    this.bridge = new RecorderBridgeConnection({
      tabRef: this.recordingConfig.tabRef,
      callbacks: {
        onSessionReady: this.recordingConfig.onSessionReady,
        onRecordingStateChange: this.recordingConfig.onRecordingStateChange,
        onRequestClose: () => this.handleCloseRequest(),
      },
    });

    this.bridge.connect(this.frame.iframe).catch((error) => {
      console.error('[RecordingFrameManager] Bridge connection failed:', error);
    });
  }

  protected disconnectBridge(): void {
    if (this.bridge) {
      this.bridge.disconnect();
      this.bridge = null;
      console.log('[RecordingFrameManager] Bridge disconnected');
    }
  }
}
