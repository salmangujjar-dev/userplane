/**
 * Cross-Tab Recorder Coordinator
 * Manages recorder state across browser tabs using postbridge's SharedWorker.
 * Ensures only one recorder can be active at a time across all tabs.
 *
 * Uses CAS (Compare-And-Swap) for atomic state updates to prevent race conditions.
 * Also handles scatter-gather for cross-tab metadata aggregation.
 */

import { bridge, type BridgeConnection } from '@workspace/postbridge';
import type {
  RecordingState,
  TabMetadata,
  TabMetadataEntry,
  AggregatedMetadata,
  MetadataRequest,
  MetadataResponse,
  CustomMetadata,
  CaptureRecorderState,
} from './types';
import { generateRequestId, isCaptureTab } from './constants';

/**
 * Pending scatter-gather request
 */
interface PendingScatterGather {
  requestId: string;
  requesterTabId: string;
  requestedAt: number;
  expectedTabs: string[];
  responses: Map<string, MetadataResponse>;
  resolve: (result: AggregatedMetadata) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Shared state schema for cross-tab coordination
 * Note: Postbridge automatically appends `remote` as last arg when executing functions
 */
interface CrossTabSchema {
  /** Tab ID that currently owns the recorder (null if no active recorder) */
  recorderTabId: string | null;
  /** Current recorder state across tabs */
  recorderState: RecordingState;
  /** Timestamp of last recorder state update */
  lastRecorderStateUpdate: number;
  /**
   * Broadcast function to sync state changes across tabs
   * Args: tabId and state are serialized and sent via postMessage
   * The `remote` arg is automatically appended by postbridge when executing
   */
  syncRecorderState: (tabId: string | null, state: RecordingState, remote: CrossTabSchema) => void;

  /**
   * Sync capture recorder state to all capture iframes
   * Called when recorder state changes or when checking connection health
   */
  syncCaptureRecorderState: (state: CaptureRecorderState, remote: CrossTabSchema) => void;

  // ---------------------------------------------------------------------------
  // Scatter-Gather Methods for Metadata Aggregation
  // ---------------------------------------------------------------------------

  /**
   * Request metadata from all capture iframes (scatter)
   * Broadcast by recorder to initiate scatter-gather
   */
  requestMetadata: (request: MetadataRequest, remote: CrossTabSchema) => void;

  /**
   * Respond with metadata (gather)
   * Called by capture iframes in response to requestMetadata
   */
  respondMetadata: (response: MetadataResponse, remote: CrossTabSchema) => void;
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
  /** Called when capture recorder state changes (for capture iframes) */
  onCaptureRecorderStateChanged?: (state: CaptureRecorderState) => void;
  /** Called when this tab (capture) receives a metadata request */
  onMetadataRequested?: (request: MetadataRequest) => void;
  /** Called when this tab (recorder) receives a metadata response */
  onMetadataResponse?: (response: MetadataResponse) => void;
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
  /** Channel name for cross-tab coordination (default: 'userplane') */
  channel?: string;
  /** Timeout for CAS operations in ms (default: 5000) */
  casTimeout?: number;
  /** Maximum retries for CAS operations (default: 5) */
  maxRetries?: number;
  /** Callbacks for cross-tab events */
  callbacks?: CrossTabCoordinatorCallbacks;
}

const DEFAULT_CHANNEL = 'userplane';
const DEFAULT_CAS_TIMEOUT = 1000;
const DEFAULT_MAX_RETRIES = 3;

/** Default timeout for scatter-gather operations (ms) */
const DEFAULT_SCATTER_TIMEOUT = 2000;

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
    scatterTimeout: number;
  };
  private localTabId: string | null = null;
  private isOwner = false;

  // Pending scatter-gather requests (by requestId)
  private pendingScatterGathers: Map<string, PendingScatterGather> = new Map();

  // Callback for when this capture receives a metadata request
  private metadataExtractor: (() => TabMetadata | null) | null = null;

  // Health check interval for capture iframes
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly HEALTH_CHECK_INTERVAL_MS = 5000; // Check every 5 seconds
  private readonly RECORDER_TIMEOUT_MS = 10000; // Consider recorder dead after 10 seconds

  constructor(config: CrossTabCoordinatorConfig = {}) {
    this.config = {
      workerURL: config.workerURL, // Optional - postbridge handles bundling automatically
      channel: config.channel ?? DEFAULT_CHANNEL,
      casTimeout: config.casTimeout ?? DEFAULT_CAS_TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      callbacks: config.callbacks ?? {},
      scatterTimeout: DEFAULT_SCATTER_TIMEOUT,
    };
  }

  /**
   * Register a metadata extractor function
   * Called by capture iframes to provide their metadata extraction logic
   */
  public setMetadataExtractor(extractor: () => TabMetadata | null): void {
    this.metadataExtractor = extractor;
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
   * Broadcast capture recorder state to all capture iframes
   * This updates the capture-specific state tracking
   */
  private async broadcastCaptureRecorderState(state: CaptureRecorderState): Promise<void> {
    if (!this.connection) return;

    try {
      const remote = this.connection.remote as unknown as {
        syncCaptureRecorderState: (state: CaptureRecorderState) => Promise<void>;
      };
      await remote.syncCaptureRecorderState(state);
    } catch (error) {
      console.error('[CrossTab] Failed to broadcast capture recorder state:', error);
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
      lastRecorderStateUpdate: 0,
      syncRecorderState(tabId: string | null, state: RecordingState, remote: CrossTabSchema) {
        // This function runs in ALL tabs when any tab broadcasts
        // `remote` is the proxy object for accessing/setting shared state
        remote.recorderTabId = tabId;
        remote.recorderState = state;
        remote.lastRecorderStateUpdate = Date.now();

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

      syncCaptureRecorderState(state: CaptureRecorderState, _remote: CrossTabSchema) {
        // This function runs in capture iframes when recorder state changes
        // Only notify capture tabs (not recorder tabs)
        if (self.localTabId && isCaptureTab(self.localTabId)) {
          console.log('[CrossTab] Capture recorder state updated:', state);
          self.config.callbacks.onCaptureRecorderStateChanged?.(state);
        }
      },

      // Scatter-gather: handle metadata request (runs in capture iframes)
      requestMetadata(request: MetadataRequest, _remote: CrossTabSchema) {
        // Only capture iframes should respond
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }

        // Don't respond to our own requests
        if (request.requesterTabId === self.localTabId) {
          return;
        }

        console.log('[CrossTab] Received metadata request:', request.requestId);
        self.config.callbacks.onMetadataRequested?.(request);

        // Extract metadata and respond
        if (self.metadataExtractor) {
          const metadata = self.metadataExtractor();
          if (metadata) {
            const response: MetadataResponse = {
              requestId: request.requestId,
              responderTabId: self.localTabId,
              metadata,
              respondedAt: Date.now(),
            };
            self.sendMetadataResponse(response);
          }
        }
      },

      // Scatter-gather: handle metadata response (runs in recorder)
      respondMetadata(response: MetadataResponse, _remote: CrossTabSchema) {
        // Only process if we have a pending request for this
        const pending = self.pendingScatterGathers.get(response.requestId);
        if (!pending) {
          return;
        }

        const responseTime = response.respondedAt - pending.requestedAt;
        console.log(
          `[CrossTab] Response received: ${response.responderTabId} (${responseTime}ms) - ` +
            `${pending.responses.size + 1}/${pending.expectedTabs.length} tabs`
        );

        self.config.callbacks.onMetadataResponse?.(response);

        // Store response
        pending.responses.set(response.responderTabId, response);

        // Check if all expected responses received
        if (pending.responses.size >= pending.expectedTabs.length) {
          console.log('[CrossTab] All expected responses received, completing gather');
          self.completeScatterGather(response.requestId);
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

    // Start health check for capture iframes
    if (isCaptureTab(this.localTabId)) {
      this.startHealthCheck();
    }
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

    // Stop health check if running
    this.stopHealthCheck();

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
   * Start periodic health check for capture iframes
   * Checks if recorder is still alive and transitions to idle if not
   */
  private startHealthCheck(): void {
    // Only start health check for capture tabs
    if (!this.localTabId || !isCaptureTab(this.localTabId)) {
      return;
    }

    // Clear existing interval if any
    this.stopHealthCheck();

    console.log('[CrossTab] Starting health check for capture');
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL_MS);
  }

  /**
   * Stop periodic health check
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('[CrossTab] Stopped health check');
    }
  }

  /**
   * Perform a health check on the current recorder
   * If recorder is not responsive or connection is dead, transition to idle
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.connection) return;

    try {
      // Get current recorder state from shared worker
      const recorderTabId = this.getRecorderTabId();
      const recorderState = this.getRecorderState();
      const lastUpdate = this.connection.getVersionedState<number>('lastRecorderStateUpdate').value;

      // If no active recorder, ensure we're in idle state
      if (!recorderTabId || recorderState === 'inactive') {
        await this.transitionToIdleIfNeeded();
        return;
      }

      // Check if recorder tab is still connected
      const connectedTabs = await this.getConnectedTabs();
      const isRecorderConnected = connectedTabs.includes(recorderTabId);

      if (!isRecorderConnected) {
        console.warn(
          `[CrossTab] Recorder ${recorderTabId} is no longer connected, transitioning to idle`
        );
        await this.transitionToIdleIfNeeded();
        return;
      }

      // Check if state update is stale (recorder might be frozen)
      const now = Date.now();
      const timeSinceUpdate = now - (lastUpdate || 0);

      if (timeSinceUpdate > this.RECORDER_TIMEOUT_MS) {
        console.warn(
          `[CrossTab] Recorder state is stale (${timeSinceUpdate}ms), transitioning to idle`
        );
        await this.transitionToIdleIfNeeded();
        return;
      }

      console.log('[CrossTab] Health check passed', {
        recorderTabId,
        recorderState,
        timeSinceUpdate,
      });
    } catch (error) {
      console.error('[CrossTab] Health check failed:', error);
    }
  }

  /**
   * Transition capture to idle state if not already
   */
  private async transitionToIdleIfNeeded(): Promise<void> {
    const captureState: CaptureRecorderState = {
      recorderTabId: null,
      recorderState: 'inactive',
      lastStateUpdate: Date.now(),
    };

    // Broadcast idle state to this capture
    await this.broadcastCaptureRecorderState(captureState);
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
   * Broadcasts the change to all tabs and updates capture state
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
        // Broadcast the change to all tabs
        await this.broadcastStateChange(this.localTabId, newState);

        // Also broadcast capture recorder state to capture iframes
        const captureState: CaptureRecorderState = {
          recorderTabId: this.localTabId,
          recorderState: newState,
          lastStateUpdate: Date.now(),
        };
        await this.broadcastCaptureRecorderState(captureState);

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

  // ---------------------------------------------------------------------------
  // Scatter-Gather Methods for Metadata Aggregation
  // ---------------------------------------------------------------------------

  /**
   * Scatter-gather metadata from all capture iframes
   * Only the recorder should call this
   *
   * @param timeoutMs Timeout for gathering responses (default: 2000ms)
   * @returns Aggregated metadata from all tabs
   */
  public async scatterGatherMetadata(timeoutMs?: number): Promise<AggregatedMetadata> {
    if (!this.connection || !this.localTabId) {
      throw new Error('Not connected to cross-tab coordinator');
    }

    const requestId = generateRequestId();
    const requestedAt = Date.now();
    const timeout = timeoutMs ?? this.config.scatterTimeout;

    // Get all connected tabs and filter to capture iframes
    const allTabs = await this.connection.getConnectedTabs();
    const captureTabs = allTabs.filter(isCaptureTab);

    console.group(`[CrossTab] Scatter-Gather Started (${requestId})`);
    console.log('All connected tabs:', allTabs);
    console.log('Capture tabs to query:', captureTabs);
    console.log('Timeout:', `${timeout}ms`);

    if (captureTabs.length === 0) {
      console.log('No capture tabs found - returning empty result');
      console.groupEnd();
      return this.buildAggregatedMetadata(new Map(), [], [], requestedAt, Date.now());
    }

    console.log(`Expecting responses from ${captureTabs.length} tabs...`);
    console.groupEnd();

    // Create pending request
    return new Promise<AggregatedMetadata>((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log(`[CrossTab] Scatter-gather timeout reached (${timeout}ms)`);
        this.completeScatterGather(requestId);
      }, timeout);

      const pending: PendingScatterGather = {
        requestId,
        requesterTabId: this.localTabId!,
        requestedAt,
        expectedTabs: captureTabs,
        responses: new Map(),
        resolve,
        timeoutId,
      };

      this.pendingScatterGathers.set(requestId, pending);

      // Broadcast metadata request
      const request: MetadataRequest = {
        requestId,
        requesterTabId: this.localTabId!,
        requestedAt,
      };

      console.log('[CrossTab] Broadcasting metadata request to all tabs...');
      this.broadcastMetadataRequest(request);
    });
  }

  /**
   * Broadcast a metadata request to all tabs
   */
  private async broadcastMetadataRequest(request: MetadataRequest): Promise<void> {
    if (!this.connection) return;

    try {
      const remote = this.connection.remote as unknown as {
        requestMetadata: (request: MetadataRequest) => Promise<void>;
      };
      await remote.requestMetadata(request);
    } catch (error) {
      console.error('[CrossTab] Failed to broadcast metadata request:', error);
    }
  }

  /**
   * Send a metadata response back
   */
  private async sendMetadataResponse(response: MetadataResponse): Promise<void> {
    if (!this.connection) return;

    try {
      const remote = this.connection.remote as unknown as {
        respondMetadata: (response: MetadataResponse) => Promise<void>;
      };
      await remote.respondMetadata(response);
      console.log('[CrossTab] Sent metadata response for:', response.requestId);
    } catch (error) {
      console.error('[CrossTab] Failed to send metadata response:', error);
    }
  }

  /**
   * Complete a scatter-gather operation (either all responses received or timeout)
   */
  private completeScatterGather(requestId: string): void {
    const pending = this.pendingScatterGathers.get(requestId);
    if (!pending) return;

    // Clear timeout and remove from pending
    clearTimeout(pending.timeoutId);
    this.pendingScatterGathers.delete(requestId);

    // Build list of responded and timed out tabs
    const respondedTabs = Array.from(pending.responses.keys());
    const timedOutTabs = pending.expectedTabs.filter((tab) => !pending.responses.has(tab));

    console.group(`[CrossTab] Scatter-Gather Complete (${requestId})`);
    console.log(`Responded: ${respondedTabs.length} tabs, Timed out: ${timedOutTabs.length} tabs`);

    if (timedOutTabs.length > 0) {
      console.warn('Timed out tabs:', timedOutTabs);
    }

    // Build aggregated result
    const result = this.buildAggregatedMetadata(
      pending.responses,
      respondedTabs,
      timedOutTabs,
      pending.requestedAt,
      Date.now()
    );

    console.groupEnd();

    pending.resolve(result);
  }

  /**
   * Build aggregated metadata from responses
   * If all tabs have identical customMetadata, store in `unified`
   * Otherwise, store per-tab in `perTab`
   */
  private buildAggregatedMetadata(
    responses: Map<string, MetadataResponse>,
    respondedTabs: string[],
    timedOutTabs: string[],
    requestedAt: number,
    completedAt: number
  ): AggregatedMetadata {
    const durationMs = completedAt - requestedAt;

    if (responses.size === 0) {
      console.log('No responses received');
      console.log('Final Result: Empty (no tabs responded)');
      return {
        unified: null,
        perTab: null,
        isUnified: true,
        respondedTabs: [],
        timedOutTabs,
        totalTabs: timedOutTabs.length,
        requestedAt,
        completedAt,
      };
    }

    // Log each tab's response
    console.group('Responses from each tab:');
    const perTabEntries: Record<string, TabMetadataEntry> = {};
    const customMetadataList: CustomMetadata[] = [];

    for (const [tabId, response] of responses) {
      const { metadata } = response;

      // Extract custom metadata (everything except system keys)
      const { _pageUrl, _pageTitle, ...customMeta } = metadata;
      const customMetadata = Object.keys(customMeta).length > 0 ? customMeta : null;

      console.group(`Tab: ${tabId}`);
      console.log('Page URL:', _pageUrl);
      console.log('Page Title:', _pageTitle);
      console.log('Custom Metadata:', customMetadata);
      console.log('Response Time:', `${response.respondedAt - requestedAt}ms`);
      console.groupEnd();

      // Store flattened structure directly
      perTabEntries[tabId] = metadata;
      customMetadataList.push(customMetadata as CustomMetadata);
    }
    console.groupEnd();

    // Check if all customMetadata are identical
    const isUnified = this.areAllMetadataIdentical(customMetadataList);

    // Log the decision
    console.group('Aggregation Decision:');
    if (isUnified) {
      console.log('Decision: UNIFIED');
      console.log('Reason: All tabs returned identical customMetadata');
      console.log('Unified Metadata:', customMetadataList[0] ?? null);
    } else {
      console.log('Decision: PER-TAB');
      console.log('Reason: Tabs returned different customMetadata');
      console.log('Differences detected between tabs');

      // Show what's different
      if (customMetadataList.length > 1) {
        const first = JSON.stringify(customMetadataList[0]);
        for (let i = 1; i < customMetadataList.length; i++) {
          const current = JSON.stringify(customMetadataList[i]);
          if (current !== first) {
            console.log(`Tab ${respondedTabs[i]} differs from Tab ${respondedTabs[0]}`);
          }
        }
      }
    }
    console.groupEnd();

    // Build and log final result
    let result: AggregatedMetadata;

    if (isUnified) {
      result = {
        unified: customMetadataList[0] ?? null,
        perTab: null,
        isUnified: true,
        respondedTabs,
        timedOutTabs,
        totalTabs: respondedTabs.length + timedOutTabs.length,
        requestedAt,
        completedAt,
      };
    } else {
      result = {
        unified: null,
        perTab: perTabEntries,
        isUnified: false,
        respondedTabs,
        timedOutTabs,
        totalTabs: respondedTabs.length + timedOutTabs.length,
        requestedAt,
        completedAt,
      };
    }

    // Log final result summary
    console.group('Final Aggregated Metadata:');
    console.log('Is Unified:', result.isUnified);
    console.log('Total Tabs:', result.totalTabs);
    console.log('Responded:', result.respondedTabs.length);
    console.log('Timed Out:', result.timedOutTabs.length);
    console.log('Duration:', `${durationMs}ms`);
    if (result.isUnified) {
      console.log('Unified Data:', result.unified);
    } else {
      console.log('Per-Tab Data:', result.perTab);
    }
    console.groupEnd();

    return result;
  }

  /**
   * Check if all metadata objects are identical
   */
  private areAllMetadataIdentical(metadataList: CustomMetadata[]): boolean {
    if (metadataList.length <= 1) return true;

    const first = JSON.stringify(metadataList[0]);
    return metadataList.every((m) => JSON.stringify(m) === first);
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
