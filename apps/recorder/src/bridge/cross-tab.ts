/**
 * Cross-Tab Recorder Coordinator
 * Manages recorder state across browser tabs using postbridge's SharedWorker.
 * Ensures only one recorder can be active at a time across all tabs.
 *
 * Uses CAS (Compare-And-Swap) for atomic state updates to prevent race conditions.
 */

import { bridge, type BridgeConnection } from '@workspace/postbridge';
import type { RecordingState } from './types';

/**
 * Shared state schema for cross-tab coordination
 * Note: Postbridge automatically appends `remote` as last arg when executing functions
 */
interface CrossTabSchema {
  /** Tab ID that currently owns the recorder (null if no active recorder) */
  recorderTabId: string | null;
  /** Current recorder state across tabs */
  recorderState: RecordingState;
  /**
   * Broadcast function to sync state changes across tabs
   * Args: tabId and state are serialized and sent via postMessage
   * The `remote` arg is automatically appended by postbridge when executing
   */
  syncRecorderState: (tabId: string | null, state: RecordingState, remote: CrossTabSchema) => void;
}

/**
 * Result of attempting to acquire the recorder lock
 */
export interface AcquireLockResult {
  success: boolean;
  /** Error message if acquisition failed */
  error?: string;
  /** Tab ID that currently holds the lock (if not this tab) */
  currentHolderTabId?: string | null;
  /** Current recorder state */
  currentState?: RecordingState;
}

/**
 * Cross-tab coordinator events
 */
export interface CrossTabCoordinatorCallbacks {
  /** Called when another tab acquires the recorder */
  onRecorderAcquiredByOtherTab?: (tabId: string) => void;
  /** Called when the recorder is released by another tab */
  onRecorderReleasedByOtherTab?: (previousTabId: string) => void;
  /** Called when recorder state changes in another tab */
  onRecorderStateChanged?: (tabId: string | null, state: RecordingState) => void;
}

/**
 * Configuration for the cross-tab coordinator
 */
export interface CrossTabCoordinatorConfig {
  /**
   * URL to the SharedWorker script (optional)
   * If not provided, postbridge uses bundler's native worker import.
   * Modern bundlers (Vite, Webpack 5, Rollup) will automatically
   * handle the SharedWorker bundling via `new URL()` pattern.
   */
  workerURL?: string;
  /** Channel name for recorder coordination (default: 'recorder') */
  channel?: string;
  /** Timeout for CAS operations in ms (default: 5000) */
  casTimeout?: number;
  /** Maximum retries for CAS operations (default: 5) */
  maxRetries?: number;
  /** Callbacks for cross-tab events */
  callbacks?: CrossTabCoordinatorCallbacks;
}

const DEFAULT_CHANNEL = 'recorder';
const DEFAULT_CAS_TIMEOUT = 1000;
const DEFAULT_MAX_RETRIES = 3;

/**
 * Cross-Tab Recorder Coordinator
 * Coordinates recorder state across multiple browser tabs.
 */
export class CrossTabCoordinator {
  private connection: BridgeConnection | null = null;
  private config: {
    workerURL?: string;
    channel: string;
    casTimeout: number;
    maxRetries: number;
    callbacks: CrossTabCoordinatorCallbacks;
  };
  private localTabId: string | null = null;
  private isOwner = false;

  constructor(config: CrossTabCoordinatorConfig = {}) {
    this.config = {
      workerURL: config.workerURL, // Optional - postbridge handles bundling automatically
      channel: config.channel ?? DEFAULT_CHANNEL,
      casTimeout: config.casTimeout ?? DEFAULT_CAS_TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      callbacks: config.callbacks ?? {},
    };
  }

  /**
   * Broadcast state change to all other tabs
   * Only pass serializable args (tabId, state) - postbridge auto-appends `remote`
   */
  private async broadcastStateChange(tabId: string | null, state: RecordingState): Promise<void> {
    if (!this.connection) return;

    try {
      // Call syncRecorderState with only serializable args
      // Postbridge automatically appends `remote` when executing locally
      const remote = this.connection.remote as unknown as {
        syncRecorderState: (tabId: string | null, state: RecordingState) => Promise<void>;
      };
      await remote.syncRecorderState(tabId, state);
    } catch (error) {
      console.error('[CrossTab] Failed to broadcast state change:', error);
    }
  }

  /**
   * Connect to the cross-tab coordinator
   * @param tabId Optional tab ID to use (e.g., from parent SDK). If not provided, postbridge generates one.
   */
  public async connect(tabId?: string): Promise<void> {
    if (this.connection) {
      console.warn('[CrossTab] Already connected');
      return;
    }

    console.log(
      '[CrossTab] Connecting to SharedWorker',
      tabId ? `with tabId: ${tabId}` : '(auto-generated)'
    );

    // Reference to this for use in schema callbacks
    const self = this;

    // Schema for cross-tab state synchronization
    // syncRecorderState broadcasts to all tabs and updates local state via the remote proxy
    // Note: postbridge automatically appends `remote` as last arg - we don't pass it when calling
    const schema: CrossTabSchema = {
      recorderTabId: null,
      recorderState: 'inactive',
      syncRecorderState(tabId: string | null, state: RecordingState, remote: CrossTabSchema) {
        // This function runs in ALL tabs when any tab broadcasts
        // `remote` is the proxy object for accessing/setting shared state
        remote.recorderTabId = tabId;
        remote.recorderState = state;

        // Notify callbacks if this update came from another tab
        if (self.localTabId && tabId !== self.localTabId) {
          if (tabId) {
            self.config.callbacks.onRecorderAcquiredByOtherTab?.(tabId);
          } else {
            const currentHolder = self.getRecorderTabId();
            if (currentHolder) {
              self.config.callbacks.onRecorderReleasedByOtherTab?.(currentHolder);
            }
          }
          self.config.callbacks.onRecorderStateChanged?.(tabId, state);
        }
      },
    };

    // Build connect options
    const connectOptions: Parameters<typeof bridge.connect>[1] = {
      channel: this.config.channel,
      casTimeout: this.config.casTimeout,
      // Use provided tabId (e.g., from parent SDK) or let postbridge auto-generate
      ...(tabId && { tabID: tabId }),
      // workerURL is optional - postbridge handles bundling automatically
      ...(this.config.workerURL && { workerURL: this.config.workerURL }),
    };

    this.connection = await bridge.connect(schema, connectOptions);
    this.localTabId = this.connection.id;

    console.log('[CrossTab] Connected with tab ID:', this.localTabId);
  }

  /**
   * Disconnect from the cross-tab coordinator
   * If this tab owns the recorder, it will be released
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) {
      console.warn('[CrossTab] Not connected');
      return;
    }

    // Release lock if we own it
    if (this.isOwner) {
      await this.releaseLock();
    }

    console.log('[CrossTab] Disconnecting');
    this.connection.close();
    this.connection = null;
    this.localTabId = null;
    this.isOwner = false;
  }

  /**
   * Check if another recorder is currently mounted AND the owning tab is still connected
   * This handles cases where a tab crashed without releasing the lock
   * @returns Promise resolving to true if another LIVE tab has the recorder mounted
   */
  public async isRecorderMounted(): Promise<boolean> {
    if (!this.connection) return false;

    const { value: tabId } = this.connection.getVersionedState<string | null>('recorderTabId');

    // No one has claimed the recorder
    if (tabId === null) return false;

    // We own it
    if (tabId === this.localTabId) return false;

    // Another tab claims to own it - verify they're actually still connected
    const connectedTabs = await this.connection.getConnectedTabs();
    const ownerIsAlive = connectedTabs.includes(tabId);

    console.log(
      `[CrossTab] Recorder claimed by ${tabId}, connected tabs: [${connectedTabs.join(', ')}], owner alive: ${ownerIsAlive}`
    );

    return ownerIsAlive;
  }

  /**
   * Get the current recorder owner tab ID
   */
  public getRecorderTabId(): string | null {
    if (!this.connection) return null;
    return this.connection.getVersionedState<string | null>('recorderTabId').value;
  }

  /**
   * Get the current recorder state
   */
  public getRecorderState(): RecordingState {
    if (!this.connection) return 'inactive';
    return this.connection.getVersionedState<RecordingState>('recorderState').value;
  }

  /**
   * Get this tab's ID
   */
  public getLocalTabId(): string | null {
    return this.localTabId;
  }

  /**
   * Check if this tab currently owns the recorder
   */
  public isRecorderOwner(): boolean {
    return this.isOwner;
  }

  /**
   * Attempt to acquire the recorder lock for this tab
   * Uses CAS to atomically claim ownership
   *
   * @returns Result indicating success or failure with details
   */
  public async acquireLock(): Promise<AcquireLockResult> {
    if (!this.connection || !this.localTabId) {
      return {
        success: false,
        error: 'Not connected to cross-tab coordinator',
      };
    }

    let retries = 0;
    while (retries < this.config.maxRetries) {
      // Read current state with version
      const { value: currentTabId, version: tabIdVersion } = this.connection.getVersionedState<
        string | null
      >('recorderTabId');
      const { value: currentState, version: stateVersion } =
        this.connection.getVersionedState<RecordingState>('recorderState');

      console.log(
        `[CrossTab] Acquire attempt ${retries + 1}: currentTabId=${currentTabId}, currentState=${currentState}`
      );

      // Check if another tab has the recorder mounted
      if (currentTabId !== null && currentTabId !== this.localTabId) {
        // Verify the owning tab is actually still connected
        // (handles case where tab crashed without releasing)
        const connectedTabs = await this.connection.getConnectedTabs();
        const ownerIsAlive = connectedTabs.includes(currentTabId);

        console.log(
          `[CrossTab] Recorder claimed by ${currentTabId}, connected: [${connectedTabs.join(', ')}], alive: ${ownerIsAlive}`
        );

        if (ownerIsAlive) {
          // Owner is still connected - block
          console.log('[CrossTab] Another recorder is already mounted and alive, cannot acquire');
          return {
            success: false,
            error: 'Another recorder is already open. Only one recorder can be active at a time.',
            currentHolderTabId: currentTabId,
            currentState: currentState,
          };
        }

        // Owner tab is gone (crashed/closed without cleanup) - we can take over
        console.log(`[CrossTab] Previous owner ${currentTabId} is gone, taking over`);
      }

      // If we already own it, just return success
      if (currentTabId === this.localTabId) {
        console.log('[CrossTab] Already own the recorder');
        this.isOwner = true;
        return { success: true };
      }

      // Try to claim ownership atomically
      const tabIdResult = await this.connection.compareAndSwap(
        'recorderTabId',
        tabIdVersion,
        this.localTabId
      );

      if (!tabIdResult.success) {
        // Someone else claimed it between our read and CAS
        retries++;
        console.log(
          `[CrossTab] CAS conflict on tabId, retrying (${retries}/${this.config.maxRetries})`
        );
        continue;
      }

      // Also update state to inactive (starting fresh)
      const stateResult = await this.connection.compareAndSwap(
        'recorderState',
        stateVersion,
        'inactive'
      );

      if (!stateResult.success) {
        // State changed, but we have the lock - that's ok, we can update state separately
        console.log('[CrossTab] CAS conflict on state, but lock acquired');
      }

      // Broadcast the change to other tabs
      await this.broadcastStateChange(this.localTabId, 'inactive');

      this.isOwner = true;
      console.log('[CrossTab] Successfully acquired recorder lock');
      return { success: true };
    }

    return {
      success: false,
      error: `Failed to acquire lock after ${this.config.maxRetries} retries`,
    };
  }

  /**
   * Release the recorder lock
   * Only succeeds if this tab currently owns the lock
   */
  public async releaseLock(): Promise<boolean> {
    if (!this.connection || !this.localTabId) {
      console.warn('[CrossTab] Not connected, cannot release lock');
      return false;
    }

    if (!this.isOwner) {
      console.warn('[CrossTab] Not the owner, cannot release lock');
      return false;
    }

    let retries = 0;
    while (retries < this.config.maxRetries) {
      const { value: currentTabId, version } = this.connection.getVersionedState<string | null>(
        'recorderTabId'
      );

      // Verify we still own it
      if (currentTabId !== this.localTabId) {
        console.warn('[CrossTab] Lock was taken by another tab');
        this.isOwner = false;
        return false;
      }

      // Release by setting to null
      const result = await this.connection.compareAndSwap('recorderTabId', version, null);

      if (result.success) {
        // Also reset state
        const { version: stateVersion } =
          this.connection.getVersionedState<RecordingState>('recorderState');
        await this.connection.compareAndSwap('recorderState', stateVersion, 'inactive');

        // Broadcast the release
        await this.broadcastStateChange(null, 'inactive');

        this.isOwner = false;
        console.log('[CrossTab] Released recorder lock');
        return true;
      }

      retries++;
      console.log(
        `[CrossTab] Release CAS conflict, retrying (${retries}/${this.config.maxRetries})`
      );
    }

    console.error('[CrossTab] Failed to release lock after max retries');
    return false;
  }

  /**
   * Update the recorder state (only if this tab owns the lock)
   * Broadcasts the change to all tabs
   */
  public async updateState(newState: RecordingState): Promise<boolean> {
    if (!this.connection || !this.localTabId) {
      console.warn('[CrossTab] Not connected, cannot update state');
      return false;
    }

    if (!this.isOwner) {
      console.warn('[CrossTab] Not the owner, cannot update state');
      return false;
    }

    let retries = 0;
    while (retries < this.config.maxRetries) {
      const { version } = this.connection.getVersionedState<RecordingState>('recorderState');

      const result = await this.connection.compareAndSwap('recorderState', version, newState);

      if (result.success) {
        // Broadcast the change
        await this.broadcastStateChange(this.localTabId, newState);

        console.log(`[CrossTab] Updated state to: ${newState}`);
        return true;
      }

      retries++;
      console.log(
        `[CrossTab] State update CAS conflict, retrying (${retries}/${this.config.maxRetries})`
      );
    }

    console.error('[CrossTab] Failed to update state after max retries');
    return false;
  }

  /**
   * Get list of all connected tabs
   */
  public async getConnectedTabs(): Promise<string[]> {
    if (!this.connection) return [];
    return this.connection.getConnectedTabs();
  }
}

/**
 * Singleton instance of the cross-tab coordinator
 */
let coordinatorInstance: CrossTabCoordinator | null = null;

/**
 * Get or create the cross-tab coordinator instance
 */
export function getCrossTabCoordinator(config?: CrossTabCoordinatorConfig): CrossTabCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new CrossTabCoordinator(config);
  }
  return coordinatorInstance;
}

/**
 * Reset the cross-tab coordinator instance (for testing)
 */
export async function resetCrossTabCoordinator(): Promise<void> {
  if (coordinatorInstance) {
    await coordinatorInstance.disconnect();
    coordinatorInstance = null;
  }
}
