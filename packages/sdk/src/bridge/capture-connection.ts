/**
 * Capture Bridge Connection
 * Manages the postbridge connection between SDK (host) and capture iframe (guest)
 *
 * The capture iframe is a lightweight hidden 1x1 iframe that:
 * - Extracts metadata from the parent page on demand
 * - Tracks recorder state for cross-tab awareness
 * - Responds to scatter-gather requests from the recorder
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
} from './types';
import { getCustomMetadata } from '@workspace/metadata';
import { CONNECTION_PREFIXES, generateConnectionId } from '../constants';

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
 * Handles metadata extraction and recorder state tracking
 */
export class CaptureBridgeConnection {
  private connection: Connection | null = null;
  private tabRef: string;
  private callbacks: CaptureBridgeCallbacks;
  private connectionId: string;

  // Recorder state tracked for cross-tab coordination
  private recorderState: CaptureRecorderState = {
    recorderId: null,
    state: 'inactive',
  };

  constructor(options: CaptureBridgeConnectionOptions) {
    this.tabRef = options.tabRef;
    this.callbacks = options.callbacks ?? {};
    // Generate prefixed connection ID: cap_{tabRef}
    this.connectionId = generateConnectionId(CONNECTION_PREFIXES.CAPTURE, this.tabRef);
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
  public updateRecorderState(recorderId: string | null, state: RecordingState): void {
    this.recorderState = { recorderId, state };
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
}
