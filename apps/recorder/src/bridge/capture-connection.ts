/**
 * Capture Bridge Connection (Guest Side)
 * Manages the postbridge connection between capture iframe (guest) and SDK (host)
 *
 * The capture iframe is a lightweight hidden 1x1 iframe that:
 * - Extracts metadata from the parent page on demand
 * - Tracks recorder state for cross-tab awareness
 * - Responds to scatter-gather requests from the recorder
 *
 * This is the guest-side implementation (runs in the capture iframe)
 */

import { type Connection, guest } from '@workspace/postbridge';

import type {
  BlurrState,
  CaptureGuestSchema,
  CaptureHostSchema,
  CaptureRecorderState,
  CustomMetadata,
  RecordingState,
  TabMetadata,
} from './types';

/**
 * Callbacks for capture bridge events
 */
export interface CaptureBridgeCallbacks {
  /** Called when recorder state changes (from cross-tab) */
  onRecorderStateChange?: (state: CaptureRecorderState) => void;
}

/**
 * Capture bridge connection (guest side)
 * Singleton pattern - only one connection per capture iframe
 */
export class CaptureBridgeConnection {
  private connection: Connection | null = null;
  private tabRef: string | null = null;
  private pageUrl: string = '';
  private pageTitle: string = '';
  private customMetadata: CustomMetadata = null;
  private callbacks: CaptureBridgeCallbacks;

  // Tracked recorder state (from cross-tab coordination)
  private recorderState: CaptureRecorderState = {
    recorderTabId: null,
    recorderState: 'inactive',
    lastStateUpdate: Date.now(),
  };

  constructor(callbacks: CaptureBridgeCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to the parent SDK
   * Establishes postbridge connection and fetches initial data
   */
  public async connect(): Promise<void> {
    if (this.connection) {
      console.log('[CaptureBridge] Already connected');
      return;
    }

    console.log('[CaptureBridge] Connecting to parent SDK');

    // Create guest schema with methods exposed to host
    const schema: CaptureGuestSchema = {
      extractMetadata: this.handleExtractMetadata.bind(this),
      getRecorderState: this.handleGetRecorderState.bind(this),
      setRecorderState: this.handleSetRecorderState.bind(this),
      ping: () => true,
      startBlurr: this.handleStartBlurr.bind(this),
      stopBlurr: this.handleStopBlurr.bind(this),
      getBlurrState: this.handleGetBlurrState.bind(this),
    };

    try {
      this.connection = await guest.connect(schema);
      console.log('[CaptureBridge] Connected to parent, connection ID:', this.connection.id);

      // Fetch initial data from parent
      await this.fetchInitialData();
    } catch (error) {
      console.error('[CaptureBridge] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the parent
   */
  public disconnect(): void {
    if (this.connection) {
      console.log('[CaptureBridge] Disconnecting');
      this.connection.close();
      this.connection = null;
    }
  }

  /**
   * Check if connected to parent
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the remote host schema
   */
  private getRemote(): CaptureHostSchema | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.remote as CaptureHostSchema;
  }

  /**
   * Fetch initial data from parent
   * Calls separate methods on SDK side for tab ref, page url/title, and custom metadata
   */
  private async fetchInitialData(): Promise<void> {
    const remote = this.getRemote();
    if (!remote) {
      console.warn('[CaptureBridge] No remote connection');
      return;
    }

    try {
      // Fetch tab reference
      this.tabRef = await Promise.resolve(remote.getTabRef());
      console.log('[CaptureBridge] Tab ref:', this.tabRef);

      // Fetch page URL and title
      this.pageUrl = await Promise.resolve(remote.getPageUrl());
      this.pageTitle = await Promise.resolve(remote.getPageTitle());
      console.log('[CaptureBridge] Page:', this.pageUrl);

      // Fetch custom metadata
      this.customMetadata = await Promise.resolve(remote.extractMetadata());
      console.log('[CaptureBridge] Custom metadata:', this.customMetadata ? 'present' : 'none');
    } catch (error) {
      console.error('[CaptureBridge] Failed to fetch initial data:', error);
    }
  }

  /**
   * Get the tab reference
   */
  public getTabRef(): string | null {
    return this.tabRef;
  }

  /**
   * Get the page URL
   */
  public getPageUrl(): string {
    return this.pageUrl;
  }

  /**
   * Get the page title
   */
  public getPageTitle(): string {
    return this.pageTitle;
  }

  /**
   * Get the custom metadata
   */
  public getCustomMetadata(): CustomMetadata {
    return this.customMetadata;
  }

  /**
   * Get current recorder state
   */
  public getCurrentRecorderState(): CaptureRecorderState {
    return { ...this.recorderState };
  }

  // ---------------------------------------------------------------------------
  // Guest Schema Handlers (called by host)
  // ---------------------------------------------------------------------------

  /**
   * Handle metadata extraction request from host
   * Called during scatter-gather by recorder
   * Builds flattened TabMetadata - system keys prefixed, custom metadata spread
   */
  private handleExtractMetadata(): TabMetadata {
    return {
      _pageUrl: this.pageUrl,
      _pageTitle: this.pageTitle,
      ...(this.customMetadata || {}),
    };
  }

  /**
   * Handle get recorder state request from host
   */
  private handleGetRecorderState(): CaptureRecorderState {
    return { ...this.recorderState };
  }

  /**
   * Handle set recorder state from host (cross-tab sync)
   */
  private handleSetRecorderState(state: CaptureRecorderState): void {
    console.log('[CaptureBridge] Recorder state updated:', state);
    this.recorderState = { ...state };
    this.callbacks.onRecorderStateChange?.(state);
  }

  /**
   * Get the current recording state
   */
  public getRecordingState(): RecordingState {
    return this.recorderState.recorderState;
  }

  /**
   * Check if this capture is currently in active recording state
   */
  public isRecording(): boolean {
    return this.recorderState.recorderState === 'active';
  }

  /**
   * Check if this capture has retained recording
   */
  public isRetained(): boolean {
    return this.recorderState.recorderState === 'retained';
  }

  /**
   * Check if this capture is inactive
   */
  public isInactive(): boolean {
    return this.recorderState.recorderState === 'inactive';
  }

  // ---------------------------------------------------------------------------
  // Privacy Blur Handlers (relay to parent SDK)
  // ---------------------------------------------------------------------------

  /**
   * Handle start blur request - relay to parent SDK
   */
  private handleStartBlurr(): void {
    const remote = this.getRemote();
    if (!remote) {
      console.warn('[CaptureBridge] Not connected, cannot start blur');
      return;
    }
    console.log('[CaptureBridge] Relaying startBlurr to parent');
    remote.startBlurr();
  }

  /**
   * Handle stop blur request - relay to parent SDK
   */
  private handleStopBlurr(): void {
    const remote = this.getRemote();
    if (!remote) {
      console.warn('[CaptureBridge] Not connected, cannot stop blur');
      return;
    }
    console.log('[CaptureBridge] Relaying stopBlurr to parent');
    remote.stopBlurr();
  }

  /**
   * Handle get blur state request - relay to parent SDK
   */
  private handleGetBlurrState(): BlurrState {
    const remote = this.getRemote();
    if (!remote) {
      console.warn('[CaptureBridge] Not connected, returning disabled');
      return 'disabled';
    }
    return remote.getBlurrState();
  }

  // ---------------------------------------------------------------------------
  // Public Blur Control Methods (for recorder to call)
  // ---------------------------------------------------------------------------

  /**
   * Start privacy blur on the parent page
   * Called by recorder when recording becomes active
   */
  public startBlurr(): void {
    this.handleStartBlurr();
  }

  /**
   * Stop privacy blur on the parent page
   * Called by recorder when recording becomes inactive
   */
  public stopBlurr(): void {
    this.handleStopBlurr();
  }

  /**
   * Get the current blur state from the parent
   */
  public getBlurrState(): BlurrState {
    return this.handleGetBlurrState();
  }
}

// ---------------------------------------------------------------------------
// Singleton Instance
// ---------------------------------------------------------------------------

let captureBridgeInstance: CaptureBridgeConnection | null = null;

/**
 * Get or create the capture bridge singleton
 */
export function getCaptureBridge(callbacks?: CaptureBridgeCallbacks): CaptureBridgeConnection {
  if (!captureBridgeInstance) {
    captureBridgeInstance = new CaptureBridgeConnection(callbacks);
  }
  return captureBridgeInstance;
}

/**
 * Reset the capture bridge singleton (for testing)
 */
export function resetCaptureBridge(): void {
  if (captureBridgeInstance) {
    captureBridgeInstance.disconnect();
    captureBridgeInstance = null;
  }
}
