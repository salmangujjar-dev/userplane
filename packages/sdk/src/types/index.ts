/**
 * TypeScript types and interfaces for the Userplane SDK
 */

// Re-export bridge types for external use
export type {
  RecordingState,
  RecordingSessionInfo,
  RecordingContext,
  VerificationData,
  VerificationError,
  VerificationResult,
} from '../bridge/types';

/**
 * Valid action types for the recorder
 * - recording: Start a new recording session
 * - verify: Verify/validate an existing recording
 * - capture: Capture mode for screenshots or quick captures
 */
export type ActionType = 'recording' | 'verify' | 'capture';

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
  /** Action type */
  action: ActionType;
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
  /** Action type */
  action: ActionType;
}

/**
 * Serializable data structure for URL parsing/applying
 */
export interface SerializableUserplaneData {
  /** Recording token */
  token: string | null;
  /** Action type */
  action: ActionType | null;
}

/**
 * Options for initializing the SDK
 */
export interface InitializeOptions {
  /**
   * Workspace ID(s) for validation.
   * Defaults to reading from <meta name="userplane:workspace"> tags.
   * Accepts:
   * - Single ID: 'ws_xxx'
   * - Comma-separated: 'ws_xxx,ws_yyy'
   * - Array: ['ws_xxx', 'ws_yyy']
   */
  workspaceId?: string | string[];

  /**
   * Base URL for the recorder app.
   * Defaults to production CDN URL.
   */
  recorderBaseUrl?: string;

  /**
   * Base URL for the verification API.
   * Used for domain verification requests where origin validation is needed.
   * Defaults to localhost for development.
   */
  verificationBaseUrl?: string;

  /**
   * Whether to auto-open recorder when URL params are detected.
   * - true (default): Auto-open when userplane-action=recording is in URL
   * - false: Don't auto-open, wait for manual open() call
   * - string: Recording token to open immediately
   */
  openImmediately?: boolean | string;

  /**
   * Whether to enable the capture iframe for background metadata collection.
   * When enabled, a hidden 1x1 iframe is mounted when no recorder/verify frame is active.
   * This enables cross-tab awareness and scatter-gather metadata collection.
   * @default true
   */
  captureEnabled?: boolean;

  /**
   * Custom function to parse userplane data from URL.
   * Default extracts userplane-action and userplane-token from query params.
   */
  parseUserplaneData?: (href: string) => SerializableUserplaneData | null;

  /**
   * Custom function to apply userplane data to URL.
   * Used for cross-tab synchronization.
   */
  applyUserplaneData?: (data: SerializableUserplaneData) => string;
}
