/**
 * Bridge Connection Manager for Recorder
 * Manages the postbridge connection from recorder (guest) to SDK (host/parent)
 */

import { guest, type Connection } from '@workspace/postbridge';
import type { HostSchema, GuestSchema, RecordingState, RecordingSessionInfo } from './types';

/**
 * State tracked by the recorder for the bridge
 */
interface BridgeState {
  recordingState: RecordingState;
  sessionInfo: RecordingSessionInfo | null;
  tabRef: string | null;
}

/**
 * Manages the postbridge connection to the parent SDK
 * Only active in embedded mode (when running in iframe)
 */
export class RecorderBridgeConnection {
  private connection: Connection | null = null;
  private state: BridgeState = {
    recordingState: 'inactive',
    sessionInfo: null,
    tabRef: null,
  };

  /**
   * Connect to the parent SDK
   * @returns Promise that resolves when connected
   */
  public async connect(): Promise<void> {
    if (this.connection) {
      console.warn('[RecorderBridge] Already connected');
      return;
    }

    console.log('[RecorderBridge] Connecting to parent SDK');

    // Create guest schema with methods exposed to the parent
    const schema: GuestSchema = {
      getRecordingState: () => this.state.recordingState,
      getSessionInfo: () => this.state.sessionInfo,
      getTabRef: () => this.state.tabRef,
    };

    try {
      this.connection = await guest.connect(schema);
      console.log('[RecorderBridge] Connected to parent, connection ID:', this.connection.id);

      // Fetch tab ref from parent
      await this.fetchTabRef();
    } catch (error) {
      console.error('[RecorderBridge] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Fetch tab ref from the parent
   */
  private async fetchTabRef(): Promise<void> {
    const remote = this.getRemote();
    if (!remote) return;

    try {
      this.state.tabRef = await remote.getTabRef();
      console.log('[RecorderBridge] Got tab ref from parent:', this.state.tabRef);
    } catch (error) {
      console.error('[RecorderBridge] Failed to fetch tab ref:', error);
    }
  }

  /**
   * Disconnect from the parent and cleanup
   */
  public disconnect(): void {
    if (!this.connection) {
      console.warn('[RecorderBridge] Not connected');
      return;
    }

    console.log('[RecorderBridge] Disconnecting from parent');
    this.connection.close();
    this.connection = null;
  }

  /**
   * Check if connected to the parent
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get the remote API to call methods on the parent
   */
  private getRemote(): HostSchema | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.remote as HostSchema;
  }

  /**
   * Get the tab reference from the parent
   * Returns null if not connected or not yet fetched
   */
  public getTabRef(): string | null {
    return this.state.tabRef;
  }

  // High-level session lifecycle methods

  /**
   * Initialize the session with the parent
   * Host handles: setting title, storing session info, notifying callbacks
   *
   * @param sessionInfo - Session information to share with parent
   * @param title - Title to set on the parent tab (defaults to document.title)
   */
  public initSession(sessionInfo: RecordingSessionInfo, title?: string): void {
    this.state.sessionInfo = sessionInfo;
    this.state.recordingState = 'inactive';

    const remote = this.getRemote();
    if (!remote) {
      console.log('[RecorderBridge] Not connected, skipping initSession');
      return;
    }

    const sessionTitle = title ?? document.title;
    console.log('[RecorderBridge] Initializing session:', { sessionInfo, title: sessionTitle });
    remote.initSession(sessionInfo, sessionTitle);
  }

  /**
   * Finish the session and clean up
   * Host handles: reset title, clear URL params, set inactive, close recorder
   */
  public finishSession(): void {
    this.state.recordingState = 'inactive';

    const remote = this.getRemote();
    if (!remote) {
      console.log('[RecorderBridge] Not connected, skipping finishSession');
      return;
    }

    console.log('[RecorderBridge] Finishing session');
    remote.finishSession();
  }

  // Recording state methods

  /**
   * Notify parent that recording is active (countdown/recording in progress)
   * Parent will enable tab unload protection
   */
  public recordingActive(): void {
    this.state.recordingState = 'active';
    const remote = this.getRemote();
    if (!remote) {
      console.log('[RecorderBridge] Not connected, skipping recordingActive');
      return;
    }
    console.log('[RecorderBridge] Notifying parent: recording active');
    remote.recordingActive();
  }

  /**
   * Notify parent that recording is retained (review/uploading)
   * Parent will keep tab unload protection enabled
   */
  public recordingRetained(): void {
    this.state.recordingState = 'retained';
    const remote = this.getRemote();
    if (!remote) {
      console.log('[RecorderBridge] Not connected, skipping recordingRetained');
      return;
    }
    console.log('[RecorderBridge] Notifying parent: recording retained');
    remote.recordingRetained();
  }

  /**
   * Notify parent that recording is inactive (setup/success/cancelled)
   * Parent will disable tab unload protection
   */
  public recordingInactive(): void {
    this.state.recordingState = 'inactive';
    const remote = this.getRemote();
    if (!remote) {
      console.log('[RecorderBridge] Not connected, skipping recordingInactive');
      return;
    }
    console.log('[RecorderBridge] Notifying parent: recording inactive');
    remote.recordingInactive();
  }
}

/**
 * Singleton instance of the recorder bridge connection
 * This allows accessing the bridge from anywhere in the app
 */
let bridgeInstance: RecorderBridgeConnection | null = null;

/**
 * Get or create the recorder bridge instance
 */
export function getRecorderBridge(): RecorderBridgeConnection {
  if (!bridgeInstance) {
    bridgeInstance = new RecorderBridgeConnection();
  }
  return bridgeInstance;
}

/**
 * Reset the bridge instance (for testing)
 */
export function resetRecorderBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.disconnect();
    bridgeInstance = null;
  }
}
