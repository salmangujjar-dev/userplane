/**
 * Frame Manager Factory
 * Creates the appropriate frame manager based on action type
 */

import type { ActionType } from '../types';
import type {
  IFrameManager,
  IRecordingFrameManager,
  IVerificationFrameManager,
  ICaptureFrameManager,
  RecordingFrameManagerConfig,
  VerificationFrameManagerConfig,
  CaptureFrameManagerConfig,
  CaptureRecorderState,
} from './types';
import { RecordingFrameManager } from './recording-manager';
import { VerificationFrameManager } from './verification-manager';
import { CaptureFrameManager } from './capture-manager';

/**
 * Factory configuration combining all possible options
 */
export interface FrameManagerFactoryConfig {
  /** Tab reference for recording/capture */
  tabRef: string;
  /** Base URL for verification API */
  verificationBaseUrl: string;
  /** Callback when close is requested */
  onRequestClose?: () => void;
  /** Callback when recording session is ready */
  onSessionReady?: (info: { workspaceId: string; sessionId: string; linkId?: string }) => void;
  /** Callback when recording state changes */
  onRecordingStateChange?: (state: 'inactive' | 'active' | 'retained') => void;
  /** Callback when capture connects */
  onCaptureConnected?: () => void;
  /** Callback when recorder state changes (for capture cross-tab) */
  onCaptureRecorderStateChange?: (state: CaptureRecorderState) => void;
}

/**
 * Factory for creating frame managers
 * Uses the Strategy pattern to select the appropriate manager implementation
 */
export class FrameManagerFactory {
  private config: FrameManagerFactoryConfig;

  constructor(config: FrameManagerFactoryConfig) {
    this.config = config;
  }

  /**
   * Create a frame manager for the given action type
   * @param action - The action type (recording, verify, or capture)
   * @returns The appropriate frame manager implementation
   */
  public create(action: ActionType): IFrameManager {
    switch (action) {
      case 'verify':
        return this.createVerificationManager();
      case 'capture':
        return this.createCaptureManager();
      case 'recording':
      default:
        return this.createRecordingManager();
    }
  }

  /**
   * Create a recording frame manager
   * Use this when you need recording-specific methods
   */
  public createRecordingManager(): IRecordingFrameManager {
    const config: RecordingFrameManagerConfig = {
      tabRef: this.config.tabRef,
      onRequestClose: this.config.onRequestClose,
      onSessionReady: this.config.onSessionReady,
      onRecordingStateChange: this.config.onRecordingStateChange,
    };
    return new RecordingFrameManager(config);
  }

  /**
   * Create a verification frame manager
   * Use this when you need verification-specific methods
   */
  public createVerificationManager(): IVerificationFrameManager {
    const config: VerificationFrameManagerConfig = {
      verificationBaseUrl: this.config.verificationBaseUrl,
      tabRef: this.config.tabRef,
      onRequestClose: this.config.onRequestClose,
    };
    return new VerificationFrameManager(config);
  }

  /**
   * Create a capture frame manager
   * Use this for hidden metadata extraction iframe
   */
  public createCaptureManager(): ICaptureFrameManager {
    const config: CaptureFrameManagerConfig = {
      tabRef: this.config.tabRef,
      onRequestClose: this.config.onRequestClose,
      onConnected: this.config.onCaptureConnected,
      onRecorderStateChange: this.config.onCaptureRecorderStateChange,
    };
    return new CaptureFrameManager(config);
  }

  /**
   * Update the tab reference
   * Call this if the tab ref changes after factory creation
   */
  public updateTabRef(tabRef: string): void {
    this.config.tabRef = tabRef;
  }

  /**
   * Update the verification base URL
   * Call this if the URL changes after factory creation
   */
  public updateVerificationBaseUrl(url: string): void {
    this.config.verificationBaseUrl = url;
  }
}
