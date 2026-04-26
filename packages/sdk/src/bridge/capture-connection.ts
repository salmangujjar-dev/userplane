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

import { BlurManager } from '@userplane/blurr';
import { getCustomMetadata } from '@userplane/metadata';
import { type Connection, host } from '@userplane/postbridge';

import { CONNECTION_PREFIXES, generateConnectionId } from '../constants';
import type { LogCapturePreferences, LogCaptureState } from '../log-capture';
import { LogCaptureManager } from '../log-capture';
import { createSdkLogger } from '../logger';
import type {
  BlurrState,
  CaptureGuestSchema,
  CaptureHostSchema,
  CaptureRecorderState,
  LogEntries,
  RecordingState,
  TabMetadata,
} from './types';

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
  /** User-provided URLs to exclude from network log capture */
  excludeCaptureEndpoints?: string[];
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
  private logger = createSdkLogger('CaptureBridge');

  // BlurManager instance for privacy blur
  private blurManager: BlurManager | null = null;

  // LogCaptureManager instance for log capture
  private logCaptureManager: LogCaptureManager | null = null;

  // User-provided endpoints to exclude from network log capture
  private excludeCaptureEndpoints: string[];

  // Recorder state tracked for cross-tab coordination
  private recorderState: CaptureRecorderState = {
    recorderTabId: null,
    recorderState: 'inactive',
    lastStateUpdate: Date.now(),
  };

  constructor(options: CaptureBridgeConnectionOptions) {
    this.tabRef = options.tabRef;
    this.callbacks = options.callbacks ?? {};
    this.excludeCaptureEndpoints = options.excludeCaptureEndpoints ?? [];
    // Generate prefixed connection ID: cap_{tabRef}
    this.connectionId = generateConnectionId(CONNECTION_PREFIXES.CAPTURE, this.tabRef);

    // Initialize BlurManager with meta tag selectors
    // BlurManager reads custom selectors from <meta name="userplane-blur-selectors">
    try {
      this.blurManager = BlurManager.fromMetaTags();
      this.logger.debug('BlurManager initialized');
    } catch (error) {
      this.logger.warn({ err: error }, 'BlurManager initialization failed');
      this.blurManager = null;
    }

    // Initialize LogCaptureManager
    try {
      this.logCaptureManager = new LogCaptureManager();
      this.logger.debug('LogCaptureManager initialized');
    } catch (error) {
      this.logger.warn({ err: error }, 'LogCaptureManager initialization failed');
      this.logCaptureManager = null;
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
      this.logger.debug('Already connected');
      return;
    }

    this.logger.debug('Connecting to capture iframe');

    // Create host schema with methods for capture iframe
    const schema: CaptureHostSchema = {
      getTabRef: () => this.tabRef,
      getPageUrl: () => window.location.href,
      getPageTitle: () => document.title,
      extractMetadata: () => {
        try {
          return getCustomMetadata();
        } catch (error) {
          this.logger.error({ err: error }, 'Error extracting metadata');
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
      startLogCapture: async (
        preferences: LogCapturePreferences,
        sessionId: string,
        tabId: string,
        workspaceId: string,
        internalEndpoints?: string[]
      ) => {
        await this.startLogCapture(preferences, sessionId, tabId, workspaceId, internalEndpoints);
      },
      stopLogCapture: () => {
        this.stopLogCapture();
      },
      pauseLogCapture: () => {
        this.pauseLogCapture();
      },
      getLogCaptureState: () => {
        return this.getLogCaptureState();
      },
      getLogEntries: async () => {
        return this.getLogEntries();
      },
      clearLogStore: async () => {
        await this.clearLogStore();
      },
    };

    this.connection = await host.connect(iframe, schema);
    this.logger.debug({ connectionId: this.connection.id }, 'Connected to capture');
    this.callbacks.onConnected?.();
  }

  /**
   * Disconnect from the capture iframe and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      this.logger.debug('Not connected');
      return;
    }

    this.logger.debug('Disconnecting from capture iframe');
    this.logCaptureManager?.destroy().catch((err) => {
      this.logger.warn({ err }, 'LogCaptureManager destroy failed during disconnect');
    });
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
    this.logger.debug({ recorderState: this.recorderState }, 'Recorder state updated');
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
      this.logger.debug('Not connected, cannot extract metadata');
      return null;
    }

    try {
      const metadata = await Promise.resolve(remote.extractMetadata());
      this.logger.debug({ metadata }, 'Extracted metadata');
      return metadata;
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to extract metadata');
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
      this.logger.debug('BlurManager not available, cannot start blur');
      return;
    }

    if (this.blurManager.isStarted) {
      this.logger.debug('Blur already started');
      return;
    }

    this.logger.debug('Starting privacy blur');
    this.blurManager.start();
  }

  /**
   * Stop privacy blur on the parent page
   * Called by capture iframe when recording becomes inactive
   */
  public stopBlurr(): void {
    if (!this.blurManager) {
      this.logger.debug('BlurManager not available, cannot stop blur');
      return;
    }

    if (!this.blurManager.isStarted) {
      this.logger.debug('Blur already stopped');
      return;
    }

    this.logger.debug('Stopping privacy blur');
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

  // ---------------------------------------------------------------------------
  // Log Capture Methods
  // ---------------------------------------------------------------------------

  /**
   * Start log capture on the parent page
   * Called by capture iframe when recording becomes active
   */
  public async startLogCapture(
    preferences: LogCapturePreferences,
    sessionId: string,
    tabId: string,
    workspaceId: string,
    internalEndpoints?: string[]
  ): Promise<void> {
    if (!this.logCaptureManager) {
      this.logger.debug('LogCaptureManager not available, cannot start log capture');
      return;
    }

    // Merge relay-provided endpoints with user-provided excludeCaptureEndpoints
    const mergedEndpoints = [...(internalEndpoints ?? []), ...this.excludeCaptureEndpoints];

    this.logger.debug(
      {
        sessionId,
        tabId,
        preferences,
        internalEndpoints: mergedEndpoints.length > 0 ? mergedEndpoints : null,
      },
      'Starting log capture'
    );
    this.logCaptureManager.setPreferences(preferences);
    await this.logCaptureManager.initialize(
      sessionId,
      tabId,
      workspaceId,
      mergedEndpoints.length > 0 ? mergedEndpoints : undefined
    );
    this.logCaptureManager.start();
    this.logger.debug({ state: this.logCaptureManager.getState() }, 'Log capture started');
  }

  /**
   * Stop log capture on the parent page
   * Called by capture iframe when recording becomes inactive
   */
  public stopLogCapture(): void {
    if (!this.logCaptureManager) {
      this.logger.debug('LogCaptureManager not available, cannot stop log capture');
      return;
    }

    this.logger.debug('Stopping log capture');
    this.logCaptureManager.stop();
  }

  /**
   * Pause log capture on the parent page (non-destructive — keeps hooks in place)
   * Called by capture iframe when recording transitions to retained state
   */
  public pauseLogCapture(): void {
    if (!this.logCaptureManager) {
      this.logger.debug('LogCaptureManager not available, cannot pause log capture');
      return;
    }

    this.logger.debug('Pausing log capture');
    this.logCaptureManager.pause();
  }

  /**
   * Get the current log capture state
   */
  public getLogCaptureState(): LogCaptureState {
    if (!this.logCaptureManager) {
      return 'disabled';
    }
    return this.logCaptureManager.getState();
  }

  /**
   * Get all captured log entries from IndexedDB
   */
  public async getLogEntries(): Promise<LogEntries> {
    if (!this.logCaptureManager) {
      return { network: [], console: [], action: [] };
    }
    return this.logCaptureManager.getAllLogs();
  }

  /**
   * Clear all stored log entries
   */
  public async clearLogStore(): Promise<void> {
    if (!this.logCaptureManager) return;
    await this.logCaptureManager.clearLogs();
  }
}
