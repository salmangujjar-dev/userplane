/**
 * Frame Manager Types
 * Interfaces for the frame manager strategy pattern
 */

import type { RecorderFrame, RecorderParams } from '../types';
import type { RecordingContext } from '../bridge';

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
export interface IVerificationFrameManager extends IFrameManager {
  // Currently no additional methods needed
  // Interface exists for type safety and future extensibility
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
}
