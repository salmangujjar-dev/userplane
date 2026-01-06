/**
 * TypeScript types and interfaces for the Userplane SDK
 */

// Re-export bridge types for external use
export type { RecordingState, RecordingSessionInfo, RecordingContext } from '../bridge/types';

/**
 * Represents the recorder frame structure containing the overlay and iframe elements.
 */
export interface RecorderFrame {
  /** The overlay container element */
  overlay: HTMLDivElement;
  /** The iframe element */
  iframe: HTMLIFrameElement;
}

/**
 * URL parameters extracted from query string.
 */
export interface URLParams {
  /** Recording token */
  token: string;
  /** Action type (e.g., 'recording') */
  action: string;
}

/**
 * Configuration for the recorder frame.
 * Contains all necessary information to create and mount the iframe.
 */
export interface FrameConfig {
  /** Fully constructed URL for the iframe src */
  url: string;
  /** Z-index for the overlay */
  zIndex: string;
  /** Overlay background color */
  overlayBackgroundColor: string;
  /** Whether to apply backdrop blur effect */
  backdropBlur: boolean;
  /** Iframe sandbox permissions */
  sandbox: string;
  /** Iframe allow permissions */
  allow: string;
  /** Whether to allow fullscreen */
  allowFullscreen: boolean;
  /** Callback when iframe loads successfully */
  onLoad?: () => void;
  /** Callback when iframe fails to load */
  onError?: () => void;
}

/**
 * Parameters needed to build the recorder configuration.
 */
export interface RecorderParams {
  /** Base URL of the recorder app */
  baseUrl: string;
  /** Workspace IDs from meta tags */
  workspaceIds: string[];
  /** Recording token from URL */
  token: string;
  /** Action from URL (e.g., 'recording') */
  action: string;
}

/**
 * Options for initializing the recorder.
 */
export interface InitializeOptions {
  /** Whether to automatically open the recorder when URL params are detected. Defaults to true. */
  openImmediately?: boolean;
  /** Base URL for the recorder app. Defaults to localhost in development. */
  recorderBaseUrl?: string;
}
