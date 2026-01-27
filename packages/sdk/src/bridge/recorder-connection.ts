/**
 * Recorder Bridge Connection
 * Manages the postbridge connection between SDK (host) and recorder iframe (guest)
 * Focused on recording functionality - session management, state tracking, tab protection
 */

import { getCustomMetadata } from '@workspace/metadata';
import { type Connection, host } from '@workspace/postbridge';

import { CONNECTION_PREFIXES, generateConnectionId, URL_PARAMS } from '../constants';
import type {
  GuestSchema,
  RecorderHostSchema,
  RecordingContext,
  RecordingSessionInfo,
  RecordingState,
} from './types';

/**
 * Callbacks for SDK events from the recorder
 */
export interface RecorderBridgeCallbacks {
  onSessionReady?: (info: RecordingSessionInfo) => void;
  onRecordingStateChange?: (state: RecordingState) => void;
  onRequestClose?: () => void;
}

/**
 * Options for creating a recorder bridge connection
 */
export interface RecorderBridgeConnectionOptions {
  callbacks?: RecorderBridgeCallbacks;
  tabRef: string;
}

/**
 * Manages the postbridge connection to the recorder iframe
 * Handles recording session lifecycle and tab protection
 */
export class RecorderBridgeConnection {
  private connection: Connection | null = null;
  private beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;
  private originalTitle: string = '';
  private tabRef: string;
  private callbacks: RecorderBridgeCallbacks;
  private connectionId: string;

  private context: RecordingContext = {
    state: 'inactive',
    sessionInfo: null,
    tabUnloadEnabled: false,
  };

  // Session data stored directly for easy access
  private sessionId: string | null = null;
  private linkId: string | null = null;

  constructor(options: RecorderBridgeConnectionOptions) {
    this.tabRef = options.tabRef;
    this.callbacks = options.callbacks ?? {};
    // Generate prefixed connection ID: rec_{tabRef}
    this.connectionId = generateConnectionId(CONNECTION_PREFIXES.RECORDER, this.tabRef);
  }

  /**
   * Get the prefixed connection ID for this recorder
   * Format: rec_{tabRef}
   */
  public getConnectionId(): string {
    return this.connectionId;
  }

  /**
   * Connect to the recorder iframe
   * @param iframe - The iframe element to connect to
   * @returns Promise that resolves when connected
   */
  public async connect(iframe: HTMLIFrameElement): Promise<void> {
    if (this.connection) {
      console.warn('[RecorderBridge] Already connected');
      return;
    }

    console.log('[RecorderBridge] Connecting to recorder iframe');

    // Store original title for restoration
    this.originalTitle = document.title;

    // Create host schema with recording methods
    const schema: RecorderHostSchema = {
      getTabRef: () => this.tabRef,
      getPageUrl: () => {
        try {
          return window.location.href;
        } catch (error) {
          console.error('[RecorderBridge] Error getting page URL:', error);
          return '';
        }
      },
      getCustomMetadata: () => {
        try {
          return getCustomMetadata();
        } catch (error) {
          console.error('[RecorderBridge] Error getting custom metadata:', error);
          return null;
        }
      },
      initSession: this.handleInitSession.bind(this),
      finishSession: this.handleFinishSession.bind(this),
      recordingActive: this.handleRecordingActive.bind(this),
      recordingRetained: this.handleRecordingRetained.bind(this),
      recordingInactive: this.handleRecordingInactive.bind(this),
    };

    try {
      this.connection = await host.connect(iframe, schema);
      console.log('[RecorderBridge] Connected to recorder, connection ID:', this.connection.id);
    } catch (error) {
      console.error('[RecorderBridge] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the recorder and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      console.warn('[RecorderBridge] Not connected');
      return;
    }

    console.log('[RecorderBridge] Disconnecting from recorder');

    // Disable tab unload protection
    this.disableTabUnloadProtection();

    // Restore original title
    if (this.originalTitle) {
      document.title = this.originalTitle;
    }

    // Close the connection
    this.connection.close();
    this.connection = null;

    // Reset context and session data
    this.context = {
      state: 'inactive',
      sessionInfo: null,
      tabUnloadEnabled: false,
    };
    this.sessionId = null;
    this.linkId = null;
  }

  /**
   * Check if connected to the recorder
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the current recording context
   */
  public getContext(): Readonly<RecordingContext> {
    return { ...this.context };
  }

  /**
   * Get the remote API to call methods on the recorder
   */
  public getRemote(): GuestSchema | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.remote as GuestSchema;
  }

  /**
   * Get the current session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get the current link ID
   */
  public getLinkId(): string | null {
    return this.linkId;
  }

  // Host methods exposed to recorder

  /**
   * Initialize the recording session
   * Sets title, stores session info, and notifies callbacks
   */
  private handleInitSession(info: RecordingSessionInfo, title: string): void {
    console.log('[RecorderBridge] Initializing session:', { info, title });

    // Set parent title
    document.title = title;

    // Store session info
    this.context.sessionInfo = info;
    this.sessionId = info.sessionId;
    this.linkId = info.linkId ?? null;

    // Set state to inactive (setup phase)
    this.updateState('inactive');

    // Notify callback
    this.callbacks.onSessionReady?.(info);
  }

  /**
   * Finish the recording session and cleanup
   * Resets title, clears URL params, disables protection, and closes recorder
   */
  private handleFinishSession(): void {
    console.log('[RecorderBridge] Finishing session');

    // Reset title to original
    if (this.originalTitle) {
      document.title = this.originalTitle;
    }

    // Clear URL params so refresh doesn't re-open recorder
    const url = new URL(window.location.href);
    url.searchParams.delete(URL_PARAMS.TOKEN);
    url.searchParams.delete(URL_PARAMS.ACTION);
    url.searchParams.delete(URL_PARAMS.WORKSPACE);
    window.history.replaceState({}, '', url.toString());

    // Set state to inactive and disable protection
    this.updateState('inactive');
    this.disableTabUnloadProtection();

    // Request close (unmount iframe)
    this.callbacks.onRequestClose?.();
  }

  /**
   * Called by recorder when recording becomes active (countdown/recording)
   * Enables tab unload protection and updates state
   */
  private handleRecordingActive(): void {
    console.log('[RecorderBridge] Recording active');
    this.updateState('active');
    this.enableTabUnloadProtection();
  }

  /**
   * Called by recorder when recording is retained (review/uploading)
   * Keeps tab unload protection enabled and updates state
   */
  private handleRecordingRetained(): void {
    console.log('[RecorderBridge] Recording retained');
    this.updateState('retained');
    this.enableTabUnloadProtection();
  }

  /**
   * Called by recorder when recording becomes inactive (setup/success/cancelled)
   * Disables tab unload protection and updates state
   */
  private handleRecordingInactive(): void {
    console.log('[RecorderBridge] Recording inactive');
    this.updateState('inactive');
    this.disableTabUnloadProtection();
  }

  /**
   * Update state and notify callback
   */
  private updateState(state: RecordingState): void {
    if (this.context.state === state) return;
    this.context.state = state;
    this.callbacks.onRecordingStateChange?.(state);
  }

  // Internal helpers

  private enableTabUnloadProtection(): void {
    if (this.context.tabUnloadEnabled) {
      return;
    }

    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      console.log('[RecorderBridge] beforeunload triggered - preventing accidental close');
      e.preventDefault();
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.context.tabUnloadEnabled = true;
  }

  private disableTabUnloadProtection(): void {
    if (!this.context.tabUnloadEnabled) {
      return;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    this.context.tabUnloadEnabled = false;
  }
}
