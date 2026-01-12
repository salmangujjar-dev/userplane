/**
 * Bridge Connection Manager for Recorder
 * Manages the postbridge connection from recorder (guest) to SDK (host/parent)
 * Syncs recording state with cross-tab coordinator for multi-tab awareness
 */

import { guest, type Connection } from '@workspace/postbridge';
import type {
  RecorderHostSchema,
  GuestSchema,
  RecordingState,
  RecordingSessionInfo,
  CustomMetadata,
} from './types';
import { type CrossTabCoordinator } from './cross-tab';

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
 * Syncs state with cross-tab coordinator for multi-tab coordination
 */
export class RecorderBridgeConnection {
  private connection: Connection | null = null;
  private crossTab: CrossTabCoordinator | null = null;
  private state: BridgeState = {
    recordingState: 'inactive',
    sessionInfo: null,
    tabRef: null,
  };

  /**
   * Set the cross-tab coordinator for state synchronization
   * Should be called before connect() if cross-tab coordination is needed
   */
  public setCrossTabCoordinator(crossTab: CrossTabCoordinator | null): void {
    this.crossTab = crossTab;
  }

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
      // Remote calls via postbridge are async, must await
      // Promise.resolve wrapper silences ts(80007) warning since TS can't infer postbridge returns a Promise
      this.state.tabRef = await Promise.resolve(remote.getTabRef());
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
  private getRemote(): RecorderHostSchema | null {
    if (!this.connection) {
      return null;
    }
    return this.connection.remote as RecorderHostSchema;
  }

  /**
   * Get the tab reference from the parent
   * Returns null if not connected or not yet fetched
   */
  public getTabRef(): string | null {
    return this.state.tabRef;
  }

  /**
   * Get the page URL from the parent
   * Returns null if not connected or call fails
   */
  public async getPageUrl(): Promise<string | null> {
    const remote = this.getRemote();
    if (!remote) {
      console.log('[RecorderBridge] Not connected, cannot get page URL');
      return null;
    }

    try {
      const url = await Promise.resolve(remote.getPageUrl());
      console.log('[RecorderBridge] Got page URL from parent:', url);
      return url;
    } catch (error) {
      console.error('[RecorderBridge] Failed to get page URL:', error);
      return null;
    }
  }

  /**
   * Get custom metadata from the host application
   * Returns null if not connected, no metadata registered, or call fails
   *
   * This fetches metadata that the host app registered via:
   * ```
   * Userplane.metadata(() => ({ userId: '123', plan: 'pro' }));
   * ```
   */
  public async getCustomMetadata(): Promise<CustomMetadata> {
    const remote = this.getRemote();
    if (!remote) {
      console.log('[RecorderBridge] Not connected, cannot get custom metadata');
      return null;
    }

    try {
      // Remote calls via postbridge are async, must await
      // Promise.resolve wrapper silences ts(80007) warning since TS can't infer postbridge returns a Promise
      const metadata = await Promise.resolve(remote.getCustomMetadata());
      console.log('[RecorderBridge] Got custom metadata from parent:', metadata);
      return metadata;
    } catch (error) {
      console.error('[RecorderBridge] Failed to get custom metadata:', error);
      return null;
    }
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
   * Update cross-tab state if coordinator is available
   */
  private async updateCrossTabState(state: RecordingState): Promise<void> {
    if (!this.crossTab || !this.crossTab.isRecorderOwner()) {
      return;
    }

    try {
      await this.crossTab.updateState(state);
      console.log('[RecorderBridge] Updated cross-tab state:', state);
    } catch (error) {
      console.error('[RecorderBridge] Failed to update cross-tab state:', error);
    }
  }

  /**
   * Notify parent that recording is active (countdown/recording in progress)
   * Parent will enable tab unload protection
   * Also broadcasts state to other tabs via cross-tab coordinator
   */
  public recordingActive(): void {
    this.state.recordingState = 'active';

    // Update cross-tab state (fire and forget)
    this.updateCrossTabState('active');

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
   * Also broadcasts state to other tabs via cross-tab coordinator
   */
  public recordingRetained(): void {
    this.state.recordingState = 'retained';

    // Update cross-tab state (fire and forget)
    this.updateCrossTabState('retained');

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
   * Also broadcasts state to other tabs via cross-tab coordinator
   */
  public recordingInactive(): void {
    this.state.recordingState = 'inactive';

    // Update cross-tab state (fire and forget)
    this.updateCrossTabState('inactive');

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
