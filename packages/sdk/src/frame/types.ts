/**
 * Frame Manager Types
 * Interfaces for the frame manager strategy pattern
 */

import type { RecordingContext } from '../bridge';
import type { CaptureRecorderState, TabMetadata } from '../bridge/types';
import type { RecorderFrame, RecorderParams } from '../types';

// Re-export types used by frame managers
export type { CaptureRecorderState, TabMetadata };

/**
 * Base frame manager interface
 * Common contract for all frame managers
 */
export interface IFrameManager {
  /**
   * Attempt to mount the frame with given parameters
   * @returns true if mounted successfully, false otherwise
   */
  tryMount(params: RecorderParams): boolean;

  /**
   * Unmount and cleanup the frame
   */
  unmount(): void;

  /**
   * Check if the frame is currently mounted
   */
  isMounted(): boolean;

  /**
   * Get the current frame if it exists
   */
  getFrame(): RecorderFrame | null;

  /**
   * Check if the bridge connection is established
   */
  isBridgeConnected(): boolean;
}

/**
 * Recording-specific frame manager interface
 * Adds session tracking and recording state management
 */
export interface IRecordingFrameManager extends IFrameManager {
  /**
   * Get the current recording context
   */
  getRecordingContext(): RecordingContext | null;

  /**
   * Get the current session ID
   */
  getSessionId(): string | null;

  /**
   * Get the current link ID
   */
  getLinkId(): string | null;
}

/**
 * Verification-specific frame manager interface
 * Focused on domain verification flow
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IVerificationFrameManager extends IFrameManager {
  // Currently no additional methods needed
  // Interface exists for type safety and future extensibility
}

/**
 * Capture-specific frame manager interface
 * Lightweight hidden 1x1 iframe for metadata extraction
 */
export interface ICaptureFrameManager extends IFrameManager {
  /**
   * Extract metadata from the capture iframe
   * Used during scatter-gather operation by recorder
   */
  extractMetadata(): Promise<TabMetadata | null>;

  /**
   * Update recorder state for cross-tab awareness
   */
  updateRecorderState(state: CaptureRecorderState): void;

  /**
   * Get current recorder state being tracked
   */
  getRecorderState(): CaptureRecorderState;

  /**
   * Check if the capture iframe is alive/responsive
   */
  ping(): Promise<boolean>;
}

/**
 * Common frame manager configuration
 */
export interface FrameManagerConfig {
  /** Callback when close is requested */
  onRequestClose?: () => void;
}

/**
 * Recording frame manager configuration
 */
export interface RecordingFrameManagerConfig extends FrameManagerConfig {
  /** Tab reference for the recording */
  tabRef: string;
  /** Callback when session is ready */
  onSessionReady?: (info: { workspaceId: string; sessionId: string; linkId?: string }) => void;
  /** Callback when recording state changes */
  onRecordingStateChange?: (state: 'inactive' | 'active' | 'retained') => void;
}

/**
 * Verification frame manager configuration
 */
export interface VerificationFrameManagerConfig extends FrameManagerConfig {
  /** Base URL for verification API */
  verificationBaseUrl: string;
  /** Tab reference for connection ID generation */
  tabRef: string;
}

/**
 * Capture frame manager configuration
 */
export interface CaptureFrameManagerConfig extends FrameManagerConfig {
  /** Tab reference for this capture */
  tabRef: string;
  /** Callback when capture connects */
  onConnected?: () => void;
  /** Callback when recorder state changes (from cross-tab) */
  onRecorderStateChange?: (state: CaptureRecorderState) => void;
}
