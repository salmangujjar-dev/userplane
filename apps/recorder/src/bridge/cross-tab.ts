/**
 * Cross-Tab Recorder Coordinator
 * Manages recorder state across browser tabs using postbridge's SharedWorker.
 * Ensures only one recorder can be active at a time across all tabs.
 *
 * Uses CAS (Compare-And-Swap) for atomic state updates to prevent race conditions.
 * Also handles scatter-gather for cross-tab metadata aggregation.
 */

import type { BridgeConnection } from '@userplane/postbridge';
import bridge from '@userplane/postbridge/bridge';

import { createLogger } from '@/lib/logger';

import { generateRequestId, isCaptureTab } from './constants';
import type {
  AggregatedLogs,
  AggregatedMetadata,
  CaptureRecorderState,
  CustomMetadata,
  LogCapturePreferences,
  LogEntries,
  LogsRequest,
  LogsResponse,
  MetadataRequest,
  MetadataResponse,
  RecordingState,
  TabMetadata,
  TabMetadataEntry,
} from './types';

const logger = createLogger('cross-tab');

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
 * Pending scatter-gather request for logs
 */
interface PendingLogScatterGather {
  requestId: string;
  requesterTabId: string;
  requestedAt: number;
  expectedTabs: string[];
  responses: Map<string, LogsResponse>;
  resolve: (result: AggregatedLogs) => void;
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
  /** Whether blur is currently enabled (persistent state for new tabs) */
  blurrEnabled: boolean;
  /** Whether log capture is currently enabled (persistent state for new tabs) */
  logCaptureEnabled: boolean;
  /** Whether log capture is currently paused (e.g. during review/upload) */
  logCapturePaused: boolean;
  /** Current log capture preferences */
  logCapturePreferences: LogCapturePreferences | null;
  /** Session ID for log capture (needed to init log capture on new tabs) */
  logCaptureSessionId: string | null;
  /** Workspace ID for log capture */
  logCaptureWorkspaceId: string | null;
  /** Internal endpoints to exclude from network log capture */
  logCaptureInternalEndpoints: string[] | null;
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
  // Privacy Blur Control Methods
  // ---------------------------------------------------------------------------

  /**
   * Broadcast start blur command to all capture iframes
   * Called by recorder when recording becomes active
   */
  broadcastStartBlurr: (remote: CrossTabSchema) => void;

  /**
   * Broadcast stop blur command to all capture iframes
   * Called by recorder when recording becomes inactive/retained
   */
  broadcastStopBlurr: (remote: CrossTabSchema) => void;

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

  // ---------------------------------------------------------------------------
  // Log Capture Control Methods
  // ---------------------------------------------------------------------------

  /**
   * Broadcast start log capture command to all capture iframes
   */
  broadcastStartLogCapture: (
    preferences: LogCapturePreferences,
    sessionId: string,
    workspaceId: string,
    internalEndpoints: string[] | null,
    remote: CrossTabSchema
  ) => void;

  /**
   * Broadcast pause log capture command to all capture iframes
   * Called by recorder when recording transitions to retained state
   */
  broadcastPauseLogCapture: (remote: CrossTabSchema) => void;

  /**
   * Broadcast stop log capture command to all capture iframes
   */
  broadcastStopLogCapture: (remote: CrossTabSchema) => void;

  /**
   * Broadcast clear log store command to all capture iframes
   */
  broadcastClearLogStore: (remote: CrossTabSchema) => void;

  /**
   * Request logs from all capture iframes (scatter)
   */
  requestLogs: (request: LogsRequest, remote: CrossTabSchema) => void;

  /**
   * Respond with logs (gather)
   */
  respondLogs: (response: LogsResponse, remote: CrossTabSchema) => void;
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
  /** Called when this tab (capture) receives start blur command */
  onBlurrStart?: () => void;
  /** Called when this tab (capture) receives stop blur command */
  onBlurrStop?: () => void;
  /** Called when this tab (capture) receives start log capture command */
  onLogCaptureStart?: (
    preferences: LogCapturePreferences,
    sessionId: string,
    workspaceId: string,
    internalEndpoints?: string[]
  ) => void;
  /** Called when this tab (capture) receives pause log capture command */
  onLogCapturePause?: () => void;
  /** Called when this tab (capture) receives stop log capture command */
  onLogCaptureStop?: () => void;
  /** Called when this tab (capture) receives clear log store command */
  onClearLogStore?: () => void;
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

  // Callback for when this capture receives a log request
  private logExtractor: (() => Promise<LogEntries>) | null = null;

  // Pending scatter-gather requests for logs (by requestId)
  private pendingLogScatterGathers: Map<string, PendingLogScatterGather> = new Map();

  // Health check interval for capture iframes
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private healthCheckSkipFirst = true;
  private readonly HEALTH_CHECK_INTERVAL_MS = 5000; // Check every 5 seconds

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
   * Register a log extractor function
   * Called by capture iframes to provide their log extraction logic
   */
  public setLogExtractor(extractor: () => Promise<LogEntries>): void {
    this.logExtractor = extractor;
  }

  /**
   * Broadcast state change to all other tabs
   * Only pass serializable args (tabId, state) - postbridge auto-appends `remote`
   */
  private async broadcastStateChange(tabId: string | null, state: RecordingState): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast - not connected');
      return;
    }

    try {
      logger.debug({ tabId, state }, 'broadcasting state change');
      // Call syncRecorderState with only serializable args
      // Postbridge automatically appends `remote` when executing locally
      const remote = this.connection.remote as unknown as {
        syncRecorderState: (tabId: string | null, state: RecordingState) => Promise<void>;
      };
      await remote.syncRecorderState(tabId, state);
    } catch (error) {
      logger.warn({ err: error }, 'broadcast failed');
    }
  }

  /**
   * Broadcast capture recorder state to all capture iframes
   * This updates the capture-specific state tracking
   */
  private async broadcastCaptureRecorderState(state: CaptureRecorderState): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast capture state - not connected');
      return;
    }

    try {
      logger.debug(
        { recorderTabId: state.recorderTabId, recorderState: state.recorderState },
        'broadcasting capture state'
      );
      const remote = this.connection.remote as unknown as {
        syncCaptureRecorderState: (state: CaptureRecorderState) => Promise<void>;
      };
      await remote.syncCaptureRecorderState(state);
    } catch (error) {
      logger.warn({ err: error }, 'capture state broadcast failed');
    }
  }

  /**
   * Connect to the cross-tab coordinator
   * @param tabId Optional tab ID to use (e.g., from parent SDK). If not provided, postbridge generates one.
   */
  public async connect(tabId?: string): Promise<void> {
    if (this.connection) {
      logger.debug('already connected, force-closing old connection');
      this.stopHealthCheck();
      this.connection.close();
      this.connection = null;
      this.localTabId = null;
      this.isOwner = false;
    }

    logger.debug('initiating connection');

    // Reference of this for use in schema callbacks
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // Schema for cross-tab state synchronization
    // syncRecorderState broadcasts to all tabs and updates local state via the remote proxy
    // Note: postbridge automatically appends `remote` as last arg - we don't pass it when calling
    const schema: CrossTabSchema = {
      recorderTabId: null,
      recorderState: 'inactive',
      lastRecorderStateUpdate: 0,
      blurrEnabled: false,
      logCaptureEnabled: false,
      logCapturePaused: false,
      logCapturePreferences: null,
      logCaptureSessionId: null,
      logCaptureWorkspaceId: null,
      logCaptureInternalEndpoints: null,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      syncRecorderState(tabId: string | null, state: RecordingState, _remote: CrossTabSchema) {
        // This function runs in ALL tabs when any tab broadcasts.
        // IMPORTANT: Do NOT write to _remote here (e.g. _remote.recorderState = state).
        // The caller already updated shared state via CAS, and writing via the proxy setter
        // would bump the version again, causing subsequent CAS operations to fail with
        // stale versions (the local cache lags behind the worker's actual version).
        // This function is purely for NOTIFICATION — trigger callbacks so other tabs react.

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

      // postbridge automatically appends _remote as the last parameter
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      syncCaptureRecorderState(state: CaptureRecorderState, _remote: CrossTabSchema) {
        // This function runs in capture iframes when recorder state changes
        // Only notify capture tabs (not recorder tabs)
        if (self.localTabId && isCaptureTab(self.localTabId)) {
          logger.debug(
            { recorderTabId: state.recorderTabId, recorderState: state.recorderState },
            'capture state update received'
          );
          self.config.callbacks.onCaptureRecorderStateChanged?.(state);
        }
      },

      // Scatter-gather: handle metadata request (runs in capture iframes)
      // postbridge automatically appends _remote as the last parameter
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      requestMetadata(request: MetadataRequest, _remote: CrossTabSchema) {
        // Only capture iframes should respond
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }

        // Don't respond to our own requests
        if (request.requesterTabId === self.localTabId) {
          return;
        }

        logger.debug(
          { requestId: request.requestId, from: request.requesterTabId },
          'metadata request received'
        );
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
      // postbridge automatically appends _remote as the last parameter
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      respondMetadata(response: MetadataResponse, _remote: CrossTabSchema) {
        // Only process if we have a pending request for this
        const pending = self.pendingScatterGathers.get(response.requestId);
        if (!pending) {
          return;
        }

        const responseTime = response.respondedAt - pending.requestedAt;
        logger.debug(
          {
            responderTabId: response.responderTabId,
            responseTimeMs: responseTime,
            received: pending.responses.size + 1,
            expected: pending.expectedTabs.length,
          },
          'scatter-gather response received'
        );

        self.config.callbacks.onMetadataResponse?.(response);

        // Store response
        pending.responses.set(response.responderTabId, response);

        // Check if all expected responses received
        if (pending.responses.size >= pending.expectedTabs.length) {
          self.completeScatterGather(response.requestId);
        }
      },

      // Privacy blur: start blur (runs in capture iframes)
      broadcastStartBlurr(remote: CrossTabSchema) {
        // Update persistent blur state
        remote.blurrEnabled = true;

        // Only capture iframes should handle blur commands
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }
        logger.debug({ localTabId: self.localTabId }, 'blur start received');
        self.config.callbacks.onBlurrStart?.();
      },

      // Privacy blur: stop blur (runs in capture iframes)
      broadcastStopBlurr(remote: CrossTabSchema) {
        // Update persistent blur state
        remote.blurrEnabled = false;

        // Only capture iframes should handle blur commands
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }
        logger.debug({ localTabId: self.localTabId }, 'blur stop received');
        self.config.callbacks.onBlurrStop?.();
      },

      // Log capture: start log capture (runs in capture iframes)
      broadcastStartLogCapture(
        preferences: LogCapturePreferences,
        sessionId: string,
        workspaceId: string,
        internalEndpoints: string[] | null,
        remote: CrossTabSchema
      ) {
        // Update persistent log capture state
        remote.logCaptureEnabled = true;
        remote.logCapturePaused = false;
        remote.logCapturePreferences = preferences;
        remote.logCaptureSessionId = sessionId;
        remote.logCaptureWorkspaceId = workspaceId;
        remote.logCaptureInternalEndpoints = internalEndpoints;

        // Only capture iframes should handle log capture commands
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }
        logger.debug({ localTabId: self.localTabId }, 'log capture start received');
        self.config.callbacks.onLogCaptureStart?.(
          preferences,
          sessionId,
          workspaceId,
          internalEndpoints ?? undefined
        );
      },

      // Log capture: pause log capture (runs in capture iframes)
      broadcastPauseLogCapture(remote: CrossTabSchema) {
        // Keep logCaptureEnabled = true since paused still means "has capture"
        remote.logCapturePaused = true;
        // Only capture iframes should handle log capture commands
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }
        logger.debug({ localTabId: self.localTabId }, 'log capture pause received');
        self.config.callbacks.onLogCapturePause?.();
      },

      // Log capture: stop log capture (runs in capture iframes)
      broadcastStopLogCapture(remote: CrossTabSchema) {
        // Update persistent log capture state
        remote.logCaptureEnabled = false;
        remote.logCapturePaused = false;

        // Only capture iframes should handle log capture commands
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }
        logger.debug({ localTabId: self.localTabId }, 'log capture stop received');
        self.config.callbacks.onLogCaptureStop?.();
      },

      // Log capture: clear log store (runs in capture iframes)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      broadcastClearLogStore(_remote: CrossTabSchema) {
        // Only capture iframes should handle clear log store commands
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }
        logger.debug({ localTabId: self.localTabId }, 'clear log store received');
        self.config.callbacks.onClearLogStore?.();
      },

      // Log scatter-gather: handle log request (runs in capture iframes)
      // postbridge automatically appends _remote as the last parameter
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      requestLogs(request: LogsRequest, _remote: CrossTabSchema) {
        // Only capture iframes should respond
        if (!self.localTabId || !isCaptureTab(self.localTabId)) {
          return;
        }

        // Don't respond to our own requests
        if (request.requesterTabId === self.localTabId) {
          return;
        }

        logger.debug(
          { requestId: request.requestId, from: request.requesterTabId },
          'log request received'
        );

        // Extract logs and respond
        if (self.logExtractor) {
          self
            .logExtractor()
            .then((logs) => {
              const response: LogsResponse = {
                requestId: request.requestId,
                responderTabId: self.localTabId!,
                logs,
                respondedAt: Date.now(),
              };
              self.sendLogsResponse(response);
            })
            .catch((err) => {
              logger.warn({ err }, 'log extraction failed');
            });
        }
      },

      // Log scatter-gather: handle log response (runs in recorder)
      // postbridge automatically appends _remote as the last parameter
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      respondLogs(response: LogsResponse, _remote: CrossTabSchema) {
        // Only process if we have a pending request for this
        const pending = self.pendingLogScatterGathers.get(response.requestId);
        if (!pending) {
          return;
        }

        logger.debug(
          {
            responderTabId: response.responderTabId,
            received: pending.responses.size + 1,
            expected: pending.expectedTabs.length,
          },
          'log scatter-gather response received'
        );

        // Store response
        pending.responses.set(response.responderTabId, response);

        // Check if all expected responses received
        if (pending.responses.size >= pending.expectedTabs.length) {
          self.completeLogScatterGather(response.requestId);
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

    const connectedTabs = await this.connection.getConnectedTabs();
    logger.debug(
      {
        localTabId: this.localTabId,
        channel: this.config.channel,
        totalConnectedTabs: connectedTabs.length,
      },
      'connected'
    );

    // Start health check for capture iframes
    const isCapture = isCaptureTab(this.localTabId);
    if (isCapture) {
      this.startHealthCheck();
    }
  }

  /**
   * Disconnect from the cross-tab coordinator
   * If this tab owns the recorder, it will be released
   */
  public async disconnect(): Promise<void> {
    const connToClose = this.connection;
    if (!connToClose) {
      logger.warn('not connected');
      return;
    }

    const tabId = this.localTabId;
    const wasOwner = this.isOwner;
    logger.debug({ tabId, wasOwner }, 'disconnecting');

    // Stop health check if running
    this.stopHealthCheck();

    // Release lock if we own it
    if (wasOwner) {
      await this.releaseLock();
    }

    // Only close if no new connect() replaced our connection during async work
    if (this.connection === connToClose) {
      connToClose.close();
      this.connection = null;
      this.localTabId = null;
      this.isOwner = false;
      logger.debug({ previousTabId: tabId }, 'disconnected');
    } else {
      logger.debug({ previousTabId: tabId }, 'skipped close — connection replaced');
    }
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
    this.healthCheckSkipFirst = true;

    logger.debug('starting health check');
    this.healthCheckInterval = setInterval(async () => {
      if (this.healthCheckSkipFirst) {
        this.healthCheckSkipFirst = false;
        return;
      }
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
    }
  }

  /**
   * Perform a health check on the current recorder
   * Checks if recorder tab is still connected to SharedWorker
   * If recorder disconnected (tab closed/crashed), transition to idle
   *
   * Note: We don't check timestamp staleness because:
   * - Recorder only broadcasts when state CHANGES
   * - Recording can be active for extended periods without state changes
   * - SharedWorker connection is a reliable indicator of tab liveness
   * - If a tab freezes, the browser typically kills it and connection drops
   */
  private async performHealthCheck(): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      // Get current recorder state from shared worker
      const recorderTabId = this.getRecorderTabId();
      const recorderState = this.getRecorderState();
      // If no active recorder registered, nothing to check
      if (!recorderTabId) {
        // Only transition if we thought there was an active recorder before
        if (recorderState !== 'inactive') {
          logger.debug('no recorder registered, transitioning to idle');
          this.transitionToIdleIfNeeded();
        }
        return;
      }

      // Check if recorder tab is still connected to SharedWorker
      const connectedTabs = await this.getConnectedTabs();
      const isRecorderConnected = connectedTabs.includes(recorderTabId);

      if (!isRecorderConnected) {
        logger.warn({ recorderTabId, recorderState }, 'recorder disconnected');
        this.transitionToIdleIfNeeded();
        return;
      }

      // Recorder is still connected - trust it's alive
      // Log at debug level to avoid spam (every 5 seconds)
      logger.debug({ recorderTabId, recorderState }, 'health check passed');
    } catch (error) {
      logger.warn({ err: error }, 'health check failed');
    }
  }

  /**
   * Transition capture to idle state if not already
   * Only notifies local callbacks - does NOT broadcast to other tabs
   * Also stops blur if it was enabled (prevents stuck blur when recorder crashes)
   */
  private transitionToIdleIfNeeded(): void {
    // Check if blur/log capture is currently enabled before transitioning
    const wasBlurrEnabled = this.isBlurrEnabled();
    const wasLogCaptureEnabled = this.isLogCaptureEnabled();

    logger.debug({ wasBlurrEnabled, wasLogCaptureEnabled }, 'transitioning to idle');

    const captureState: CaptureRecorderState = {
      recorderTabId: null,
      recorderState: 'inactive',
      lastStateUpdate: Date.now(),
    };

    // Only notify local callbacks - don't broadcast to all tabs
    // This prevents the spam of inactive updates when no recorder is active
    this.config.callbacks.onCaptureRecorderStateChanged?.(captureState);

    // If blur was enabled, stop it locally
    // This prevents stuck blur when recorder crashes mid-recording
    if (wasBlurrEnabled) {
      this.config.callbacks.onBlurrStop?.();
    }

    // If log capture was enabled, stop it locally
    if (wasLogCaptureEnabled) {
      this.config.callbacks.onLogCaptureStop?.();
    }
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
    if (tabId === null) {
      return false;
    }

    // We own it
    if (tabId === this.localTabId) {
      return false;
    }

    // Another tab claims to own it - verify they're actually still connected
    const connectedTabs = await this.connection.getConnectedTabs();
    const ownerIsAlive = connectedTabs.includes(tabId);

    logger.debug({ claimedBy: tabId, ownerIsAlive }, 'checking ownership');

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
   * Get the current blur enabled state
   * New capture tabs should call this on connect to sync with existing blur state
   */
  public isBlurrEnabled(): boolean {
    if (!this.connection) return false;
    return this.connection.getVersionedState<boolean>('blurrEnabled').value ?? false;
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
      logger.warn('cannot acquire lock - not connected');
      return {
        success: false,
        error: 'Not connected to cross-tab coordinator',
      };
    }

    logger.debug({ localTabId: this.localTabId }, 'acquiring lock');

    let retries = 0;
    while (retries < this.config.maxRetries) {
      // Read current state with version
      const { value: currentTabId, version: tabIdVersion } = this.connection.getVersionedState<
        string | null
      >('recorderTabId');
      const { value: currentState, version: stateVersion } =
        this.connection.getVersionedState<RecordingState>('recorderState');

      // Check if another tab has the recorder mounted
      if (currentTabId !== null && currentTabId !== this.localTabId) {
        // Verify the owning tab is actually still connected
        // (handles case where tab crashed without releasing)
        const connectedTabs = await this.connection.getConnectedTabs();
        const ownerIsAlive = connectedTabs.includes(currentTabId);

        if (ownerIsAlive) {
          // Owner is still connected - block
          logger.debug('lock blocked - another recorder active');
          return {
            success: false,
            error: 'Another recorder is already open. Only one recorder can be active at a time.',
            currentHolderTabId: currentTabId,
            currentState: currentState,
          };
        }

        // Owner tab is gone (crashed/closed without cleanup) - we can take over
        logger.debug({ deadOwner: currentTabId }, 'taking over from dead owner');
      }

      // If we already own it, just return success
      if (currentTabId === this.localTabId) {
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
        logger.debug({ attempt: retries }, 'lock CAS conflict, retrying');
        continue;
      }

      // Also update state to inactive (starting fresh)
      const stateResult = await this.connection.compareAndSwap(
        'recorderState',
        stateVersion,
        'inactive'
      );

      if (!stateResult.success) {
        // Retry once with the worker's actual version
        await this.connection.compareAndSwap('recorderState', stateResult.version, 'inactive');
      }

      // Broadcast the change to other tabs (notification only — no state writes)
      await this.broadcastStateChange(this.localTabId, 'inactive');

      this.isOwner = true;
      logger.debug({ tabId: this.localTabId }, 'lock acquired');
      return { success: true };
    }

    logger.warn({ retries: this.config.maxRetries }, 'lock acquisition failed');
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
      logger.warn('cannot release lock - not connected');
      return false;
    }

    if (!this.isOwner) {
      logger.warn('cannot release lock - not owner');
      return false;
    }

    logger.debug({ tabId: this.localTabId }, 'releasing lock');

    let version = this.connection.getVersionedState<string | null>('recorderTabId').version;

    let retries = 0;
    while (retries < this.config.maxRetries) {
      const currentTabId = this.connection.getVersionedState<string | null>('recorderTabId').value;

      // Verify we still own it
      if (currentTabId !== this.localTabId) {
        logger.warn(
          { expected: this.localTabId, actual: currentTabId },
          'lock taken by another tab'
        );
        this.isOwner = false;
        return false;
      }

      // Release by setting to null
      const result = await this.connection.compareAndSwap('recorderTabId', version, null);

      if (result.success) {
        // Also reset state — use authoritative version from CAS result for state key
        let stateVersion =
          this.connection.getVersionedState<RecordingState>('recorderState').version;
        const stateResult = await this.connection.compareAndSwap(
          'recorderState',
          stateVersion,
          'inactive'
        );
        if (!stateResult.success) {
          // Retry once with the worker's actual version
          stateVersion = stateResult.version;
          await this.connection.compareAndSwap('recorderState', stateVersion, 'inactive');
        }

        // Broadcast the release (notification only — no state writes)
        await this.broadcastStateChange(null, 'inactive');

        this.isOwner = false;
        logger.debug({ previousTabId: this.localTabId }, 'lock released');
        return true;
      }

      // Use authoritative version from worker for next attempt
      version = result.version;
      retries++;
      logger.debug({ attempt: retries, workerVersion: version }, 'release CAS conflict, retrying');
    }

    logger.warn('lock release failed - max retries');
    return false;
  }

  /**
   * Update the recorder state (only if this tab owns the lock)
   * Broadcasts the change to all tabs and updates capture state
   */
  public async updateState(newState: RecordingState): Promise<boolean> {
    if (!this.connection || !this.localTabId) {
      logger.warn('cannot update state - not connected');
      return false;
    }

    if (!this.isOwner) {
      logger.warn('cannot update state - not owner');
      return false;
    }

    const currentState = this.getRecorderState();
    logger.debug({ from: currentState, to: newState }, 'updating state');

    // Start with the local cache version; on CAS failure, use the version
    // returned by the worker (authoritative) to avoid stale-cache retries.
    let version = this.connection.getVersionedState<RecordingState>('recorderState').version;

    let retries = 0;
    while (retries < this.config.maxRetries) {
      const result = await this.connection.compareAndSwap('recorderState', version, newState);

      if (result.success) {
        // Broadcast the change to all tabs (notification only — no state writes)
        await this.broadcastStateChange(this.localTabId, newState);

        // Also broadcast capture recorder state to capture iframes
        const captureState: CaptureRecorderState = {
          recorderTabId: this.localTabId,
          recorderState: newState,
          lastStateUpdate: Date.now(),
        };
        await this.broadcastCaptureRecorderState(captureState);

        logger.debug({ newState }, 'state updated');
        return true;
      }

      // Use the authoritative version from the worker for the next attempt
      version = result.version;
      retries++;
      logger.debug({ attempt: retries, workerVersion: version }, 'state CAS conflict, retrying');
    }

    logger.warn('state update failed - max retries');
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
  // Privacy Blur Control Methods
  // ---------------------------------------------------------------------------

  /**
   * Broadcast start blur command to all capture iframes
   * Called by recorder when recording becomes active
   */
  public async broadcastStartBlurr(): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast blur - not connected');
      return;
    }

    const connectedTabs = await this.getConnectedTabs();
    logger.debug({ totalTabs: connectedTabs.length }, 'broadcasting start blur');
    try {
      const remote = this.connection.remote as unknown as {
        broadcastStartBlurr: () => Promise<void>;
      };
      await remote.broadcastStartBlurr();
    } catch (error) {
      logger.warn({ err: error }, 'blur broadcast failed');
    }
  }

  /**
   * Broadcast stop blur command to all capture iframes
   * Called by recorder when recording becomes inactive/retained
   */
  public async broadcastStopBlurr(): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast blur - not connected');
      return;
    }

    const connectedTabs = await this.getConnectedTabs();
    logger.debug({ totalTabs: connectedTabs.length }, 'broadcasting stop blur');
    try {
      const remote = this.connection.remote as unknown as {
        broadcastStopBlurr: () => Promise<void>;
      };
      await remote.broadcastStopBlurr();
    } catch (error) {
      logger.warn({ err: error }, 'blur broadcast failed');
    }
  }

  // ---------------------------------------------------------------------------
  // Log Capture Control Methods
  // ---------------------------------------------------------------------------

  /**
   * Broadcast start log capture command to all capture iframes
   */
  public async broadcastStartLogCapture(
    preferences: LogCapturePreferences,
    sessionId: string,
    workspaceId: string,
    internalEndpoints?: string[]
  ): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast log capture - not connected');
      return;
    }

    logger.debug('broadcasting start log capture');
    try {
      const remote = this.connection.remote as unknown as {
        broadcastStartLogCapture: (
          preferences: LogCapturePreferences,
          sessionId: string,
          workspaceId: string,
          internalEndpoints: string[] | null
        ) => Promise<void>;
      };
      await remote.broadcastStartLogCapture(
        preferences,
        sessionId,
        workspaceId,
        internalEndpoints ?? null
      );
    } catch (error) {
      logger.warn({ err: error }, 'log capture broadcast failed');
    }
  }

  /**
   * Broadcast pause log capture command to all capture iframes
   * Called by recorder when recording transitions to retained state
   */
  public async broadcastPauseLogCapture(): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast log capture pause - not connected');
      return;
    }

    logger.debug('broadcasting pause log capture');
    try {
      const remote = this.connection.remote as unknown as {
        broadcastPauseLogCapture: () => Promise<void>;
      };
      await remote.broadcastPauseLogCapture();
    } catch (error) {
      logger.warn({ err: error }, 'log capture pause broadcast failed');
    }
  }

  /**
   * Broadcast stop log capture command to all capture iframes
   */
  public async broadcastStopLogCapture(): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast log capture stop - not connected');
      return;
    }

    logger.debug('broadcasting stop log capture');
    try {
      const remote = this.connection.remote as unknown as {
        broadcastStopLogCapture: () => Promise<void>;
      };
      await remote.broadcastStopLogCapture();
    } catch (error) {
      logger.warn({ err: error }, 'log capture stop broadcast failed');
    }
  }

  /**
   * Broadcast clear log store command to all capture iframes
   */
  public async broadcastClearLogStore(): Promise<void> {
    if (!this.connection) {
      logger.warn('cannot broadcast clear log store - not connected');
      return;
    }

    logger.debug('broadcasting clear log store');
    try {
      const remote = this.connection.remote as unknown as {
        broadcastClearLogStore: () => Promise<void>;
      };
      await remote.broadcastClearLogStore();
    } catch (error) {
      logger.warn({ err: error }, 'clear log store broadcast failed');
    }
  }

  /**
   * Check if log capture is currently enabled
   */
  public isLogCaptureEnabled(): boolean {
    if (!this.connection) return false;
    return this.connection.getVersionedState<boolean>('logCaptureEnabled').value ?? false;
  }

  /**
   * Check if log capture is currently paused (e.g. during review/upload)
   */
  public isLogCapturePaused(): boolean {
    if (!this.connection) return false;
    return this.connection.getVersionedState<boolean>('logCapturePaused').value ?? false;
  }

  /**
   * Get current log capture preferences from shared state
   */
  public getLogCapturePreferences(): LogCapturePreferences | null {
    if (!this.connection) return null;
    return (
      this.connection.getVersionedState<LogCapturePreferences | null>('logCapturePreferences')
        .value ?? null
    );
  }

  /**
   * Get the session ID stored for log capture
   */
  public getLogCaptureSessionId(): string | null {
    if (!this.connection) return null;
    return this.connection.getVersionedState<string | null>('logCaptureSessionId').value ?? null;
  }

  /**
   * Get the workspace ID stored for log capture
   */
  public getLogCaptureWorkspaceId(): string | null {
    if (!this.connection) return null;
    return this.connection.getVersionedState<string | null>('logCaptureWorkspaceId').value ?? null;
  }

  /**
   * Get the internal endpoints stored for log capture
   */
  public getLogCaptureInternalEndpoints(): string[] | null {
    if (!this.connection) return null;
    return (
      this.connection.getVersionedState<string[] | null>('logCaptureInternalEndpoints').value ??
      null
    );
  }

  /**
   * Scatter-gather logs from all capture iframes
   */
  public async scatterGatherLogs(timeoutMs?: number): Promise<AggregatedLogs> {
    if (!this.connection || !this.localTabId) {
      throw new Error('Not connected to cross-tab coordinator');
    }

    const requestId = generateRequestId();
    const requestedAt = Date.now();
    const timeout = timeoutMs ?? this.config.scatterTimeout;

    const allTabs = await this.connection.getConnectedTabs();
    const captureTabs = allTabs.filter(isCaptureTab);

    logger.debug({ captureTabs: captureTabs.length, timeout }, 'log scatter-gather started');

    if (captureTabs.length === 0) {
      return {
        perTab: {},
        respondedTabs: [],
        timedOutTabs: [],
        totalTabs: 0,
        requestedAt,
        completedAt: Date.now(),
      };
    }

    return new Promise<AggregatedLogs>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.completeLogScatterGather(requestId);
      }, timeout);

      const pending: PendingLogScatterGather = {
        requestId,
        requesterTabId: this.localTabId!,
        requestedAt,
        expectedTabs: captureTabs,
        responses: new Map(),
        resolve,
        timeoutId,
      };

      this.pendingLogScatterGathers.set(requestId, pending);

      const request: LogsRequest = {
        requestId,
        requesterTabId: this.localTabId!,
        requestedAt,
      };

      this.broadcastLogsRequest(request);
    });
  }

  private async broadcastLogsRequest(request: LogsRequest): Promise<void> {
    if (!this.connection) return;

    try {
      const remote = this.connection.remote as unknown as {
        requestLogs: (request: LogsRequest) => Promise<void>;
      };
      await remote.requestLogs(request);
    } catch (error) {
      logger.warn({ err: error }, 'logs request broadcast failed');
    }
  }

  private async sendLogsResponse(response: LogsResponse): Promise<void> {
    if (!this.connection) return;

    try {
      const remote = this.connection.remote as unknown as {
        respondLogs: (response: LogsResponse) => Promise<void>;
      };
      await remote.respondLogs(response);
    } catch (error) {
      logger.warn({ err: error }, 'logs response send failed');
    }
  }

  private completeLogScatterGather(requestId: string): void {
    const pending = this.pendingLogScatterGathers.get(requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    this.pendingLogScatterGathers.delete(requestId);

    const respondedTabs = Array.from(pending.responses.keys());
    const timedOutTabs = pending.expectedTabs.filter((tab) => !pending.responses.has(tab));

    logger.debug(
      { responded: respondedTabs.length, timedOut: timedOutTabs.length },
      'log scatter-gather completed'
    );

    const perTab: Record<string, LogEntries> = {};
    for (const [tabId, response] of pending.responses) {
      perTab[tabId] = response.logs;
    }

    pending.resolve({
      perTab,
      respondedTabs,
      timedOutTabs,
      totalTabs: respondedTabs.length + timedOutTabs.length,
      requestedAt: pending.requestedAt,
      completedAt: Date.now(),
    });
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

    logger.debug({ captureTabs: captureTabs.length, timeout }, 'scatter-gather started');

    if (captureTabs.length === 0) {
      logger.debug('no capture tabs found');
      return this.buildAggregatedMetadata(new Map(), [], [], requestedAt, Date.now());
    }

    // Create pending request
    return new Promise<AggregatedMetadata>((resolve) => {
      const timeoutId = setTimeout(() => {
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
      logger.warn({ err: error }, 'metadata request broadcast failed');
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
    } catch (error) {
      logger.warn({ err: error }, 'metadata response send failed');
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

    logger.debug(
      { responded: respondedTabs.length, timedOut: timedOutTabs.length },
      'scatter-gather completed'
    );

    if (timedOutTabs.length > 0) {
      logger.warn({ timedOutTabs }, 'scatter-gather tabs timed out');
    }

    // Build aggregated result
    const result = this.buildAggregatedMetadata(
      pending.responses,
      respondedTabs,
      timedOutTabs,
      pending.requestedAt,
      Date.now()
    );

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

    const perTabEntries: Record<string, TabMetadataEntry> = {};
    const customMetadataList: CustomMetadata[] = [];

    for (const [tabId, response] of responses) {
      const { metadata } = response;

      // Extract custom metadata (everything except system keys)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _pageUrl, _pageTitle, ...customMeta } = metadata;
      const customMetadata = Object.keys(customMeta).length > 0 ? customMeta : null;

      // Store flattened structure directly
      perTabEntries[tabId] = metadata;
      customMetadataList.push(customMetadata as CustomMetadata);
    }

    // Check if all customMetadata are identical
    const isUnified = this.areAllMetadataIdentical(customMetadataList);

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

    logger.debug({ respondedTabs: responses.size, isUnified, durationMs }, 'metadata aggregated');

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

  /**
   * Check if the coordinator is connected to the SharedWorker
   * @returns true if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Get diagnostic information about the current connection state
   * Useful for debugging connection issues
   */
  public getDiagnostics(): {
    isConnected: boolean;
    localTabId: string | null;
    isOwner: boolean;
    channel: string;
    recorderTabId: string | null;
    recorderState: RecordingState;
    blurrEnabled: boolean;
    logCaptureEnabled: boolean;
  } {
    return {
      isConnected: this.isConnected(),
      localTabId: this.localTabId,
      isOwner: this.isOwner,
      channel: this.config.channel,
      recorderTabId: this.getRecorderTabId(),
      recorderState: this.getRecorderState(),
      blurrEnabled: this.isBlurrEnabled(),
      logCaptureEnabled: this.isLogCaptureEnabled(),
    };
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
    logger.debug('creating coordinator');
    coordinatorInstance = new CrossTabCoordinator(config);
  }
  return coordinatorInstance;
}

/**
 * Reset the cross-tab coordinator instance (for testing)
 */
export async function resetCrossTabCoordinator(): Promise<void> {
  if (coordinatorInstance) {
    logger.debug({ previousTabId: coordinatorInstance.getLocalTabId() }, 'resetting coordinator');
    await coordinatorInstance.disconnect();
    coordinatorInstance = null;
  }
}
