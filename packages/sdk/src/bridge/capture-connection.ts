/**
 * Capture Bridge Connection
 * Manages the postbridge connection between SDK (host) and capture iframe (guest)
 *
 * The capture iframe is a lightweight hidden 1x1 iframe that:
 * - Extracts metadata from the parent page on demand
 * - Tracks recorder state for cross-tab awareness
 * - Responds to scatter-gather requests from the recorder
 * - Controls privacy blur via BlurManager
 *
 * Unlike the recorder iframe, the capture iframe:
 * - Is always present (mounted when SDK initializes)
 * - Is invisible (1x1 pixel, hidden)
 * - Has no UI - purely for data collection
 * - Connects to SharedWorker for cross-tab coordination
 */

import { host, type Connection } from '@workspace/postbridge';
import type {
  CaptureHostSchema,
  CaptureGuestSchema,
  TabMetadata,
  CaptureRecorderState,
  RecordingState,
  BlurrState,
} from './types';
import { getCustomMetadata } from '@workspace/metadata';
import { CONNECTION_PREFIXES, generateConnectionId } from '../constants';
import { BlurManager } from '@workspace/blurr';

/**
 * Callbacks for capture bridge events
 */
export interface CaptureBridgeCallbacks {
  /** Called when capture iframe connects */
  onConnected?: () => void;
  /** Called when capture iframe disconnects */
  onDisconnected?: () => void;
  /** Called when recorder state changes (from SharedWorker) */
  onRecorderStateChange?: (state: CaptureRecorderState) => void;
}

/**
 * Options for creating a capture bridge connection
 */
export interface CaptureBridgeConnectionOptions {
  callbacks?: CaptureBridgeCallbacks;
  /** Tab reference for this capture */
  tabRef: string;
}

/**
 * Manages the postbridge connection to the capture iframe
 * Handles metadata extraction, recorder state tracking, and privacy blur
 */
export class CaptureBridgeConnection {
  private connection: Connection | null = null;
  private tabRef: string;
  private callbacks: CaptureBridgeCallbacks;
  private connectionId: string;

  // BlurManager instance for privacy blur
  private blurManager: BlurManager | null = null;

  // Recorder state tracked for cross-tab coordination
  private recorderState: CaptureRecorderState = {
    recorderTabId: null,
    recorderState: 'inactive',
    lastStateUpdate: Date.now(),
  };

  constructor(options: CaptureBridgeConnectionOptions) {
    this.tabRef = options.tabRef;
    this.callbacks = options.callbacks ?? {};
    // Generate prefixed connection ID: cap_{tabRef}
    this.connectionId = generateConnectionId(CONNECTION_PREFIXES.CAPTURE, this.tabRef);

    // Initialize BlurManager with meta tag selectors
    // BlurManager reads custom selectors from <meta name="userplane-blur-selectors">
    try {
      this.blurManager = BlurManager.fromMetaTags();
      console.log('[CaptureBridge] BlurManager initialized');
    } catch (error) {
      console.warn('[CaptureBridge] BlurManager initialization failed:', error);
      this.blurManager = null;
    }
  }

  /**
   * Get the prefixed connection ID for this capture
   * Format: cap_{tabRef}
   */
  public getConnectionId(): string {
    return this.connectionId;
  }

  /**
   * Connect to the capture iframe
   * @param iframe - The iframe element to connect to
   * @returns Promise that resolves when connected
   */
  public async connect(iframe: HTMLIFrameElement): Promise<void> {
    if (this.connection) {
      console.warn('[CaptureBridge] Already connected');
      return;
    }

    console.log('[CaptureBridge] Connecting to capture iframe');

    // Create host schema with methods for capture iframe
    const schema: CaptureHostSchema = {
      getTabRef: () => this.tabRef,
      getPageUrl: () => window.location.href,
      getPageTitle: () => document.title,
      extractMetadata: () => {
        try {
          return getCustomMetadata();
        } catch (error) {
          console.error('[CaptureBridge] Error extracting metadata:', error);
          return null;
        }
      },
      startBlurr: () => {
        this.startBlurr();
      },
      stopBlurr: () => {
        this.stopBlurr();
      },
      getBlurrState: () => {
        return this.getBlurrState();
      },
    };

    try {
      this.connection = await host.connect(iframe, schema);
      console.log('[CaptureBridge] Connected to capture, connection ID:', this.connection.id);
      this.callbacks.onConnected?.();
    } catch (error) {
      console.error('[CaptureBridge] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the capture iframe and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      console.warn('[CaptureBridge] Not connected');
      return;
    }

    console.log('[CaptureBridge] Disconnecting from capture iframe');
    this.connection.close();
    this.connection = null;
    this.callbacks.onDisconnected?.();
  }

  /**
   * Check if connected to the capture iframe
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the remote API to call methods on the capture iframe
   */
  public getRemote(): CaptureGuestSchema | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.remote as CaptureGuestSchema;
  }

  /**
   * Update the recorder state for cross-tab awareness
   * Called when recorder state changes (from SharedWorker)
   */
  public updateRecorderState(state: CaptureRecorderState): void {
    this.recorderState = { ...state };
    console.log('[CaptureBridge] Recorder state updated:', this.recorderState);
    this.callbacks.onRecorderStateChange?.(this.recorderState);
  }

  /**
   * Get the current recorder state
   */
  public getRecorderState(): CaptureRecorderState {
    return { ...this.recorderState };
  }

  /**
   * Get the current recording state
   */
  public getRecordingState(): RecordingState {
    return this.recorderState.recorderState;
  }

  /**
   * Check if capture is currently in active recording state
   */
  public isRecording(): boolean {
    return this.recorderState.recorderState === 'active';
  }

  /**
   * Check if capture has retained recording
   */
  public isRetained(): boolean {
    return this.recorderState.recorderState === 'retained';
  }

  /**
   * Check if capture is inactive
   */
  public isInactive(): boolean {
    return this.recorderState.recorderState === 'inactive';
  }

  /**
   * Extract metadata from the capture iframe
   * Used during scatter-gather operation
   */
  public async extractMetadata(): Promise<TabMetadata | null> {
    const remote = this.getRemote();
    if (!remote) {
      console.warn('[CaptureBridge] Not connected, cannot extract metadata');
      return null;
    }

    try {
      const metadata = await Promise.resolve(remote.extractMetadata());
      console.log('[CaptureBridge] Extracted metadata:', metadata);
      return metadata;
    } catch (error) {
      console.error('[CaptureBridge] Failed to extract metadata:', error);
      return null;
    }
  }

  /**
   * Check if the capture iframe is alive
   */
  public async ping(): Promise<boolean> {
    const remote = this.getRemote();
    if (!remote) {
      return false;
    }

    try {
      const result = await Promise.resolve(remote.ping());
      return result;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Privacy Blur Methods
  // ---------------------------------------------------------------------------

  /**
   * Start privacy blur on the parent page
   * Called by capture iframe when recording becomes active
   */
  public startBlurr(): void {
    if (!this.blurManager) {
      console.warn('[CaptureBridge] BlurManager not available, cannot start blur');
      return;
    }

    if (this.blurManager.isStarted) {
      console.log('[CaptureBridge] Blur already started');
      return;
    }

    console.log('[CaptureBridge] Starting privacy blur');
    this.blurManager.start();
  }

  /**
   * Stop privacy blur on the parent page
   * Called by capture iframe when recording becomes inactive
   */
  public stopBlurr(): void {
    if (!this.blurManager) {
      console.warn('[CaptureBridge] BlurManager not available, cannot stop blur');
      return;
    }

    if (!this.blurManager.isStarted) {
      console.log('[CaptureBridge] Blur already stopped');
      return;
    }

    console.log('[CaptureBridge] Stopping privacy blur');
    this.blurManager.stop();
  }

  /**
   * Get the current blur state
   * Returns 'enabled' if blur is active, 'disabled' otherwise
   */
  public getBlurrState(): BlurrState {
    if (!this.blurManager) {
      return 'disabled';
    }
    return this.blurManager.isStarted ? 'enabled' : 'disabled';
  }
}
