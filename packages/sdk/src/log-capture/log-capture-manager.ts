/**
 * LogCaptureManager
 * Manages log capture on the parent page, orchestrated by the capture iframe.
 * Mirrors the BlurManager pattern — lives on parent page, controlled via postbridge.
 *
 * Captures console logs, network requests, and user activity events
 * and persists them to IndexedDB via LogStore.
 */

import type { ProcessedLogEntry } from '@workspace/logger';
import { LogProcessor, LogStore } from '@workspace/logger';

import type { LogCapturePreferences, LogCaptureState } from '../bridge/types';
import { createSdkLogger } from '../logger';

const DEFAULT_PREFERENCES: LogCapturePreferences = {
  captureConsole: true,
  captureNetwork: true,
  captureAction: true,
};

const logger = createSdkLogger('LogCaptureManager');

export class LogCaptureManager {
  private processor: LogProcessor | null = null;
  private store: LogStore | null = null;
  private _isStarted = false;
  private _isPaused = false;
  private preferences: LogCapturePreferences;

  constructor(preferences?: Partial<LogCapturePreferences>) {
    this.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
  }

  /**
   * Initialize log capture with session context.
   * Creates LogStore, opens IndexedDB, creates LogProcessor with
   * saveFunction routing entries to IndexedDB.
   */
  async initialize(
    sessionId: string,
    tabId: string,
    workspaceId: string,
    internalEndpoints?: string[]
  ): Promise<void> {
    logger.debug(
      { sessionId, tabId, workspaceId, internalEndpoints, preferences: this.preferences },
      'initializing log capture manager'
    );

    // Cleanup any prior state from a previous initialize() call to prevent
    // leaking IndexedDB connections and event listeners.
    if (this._isStarted || this._isPaused) {
      this.stop();
    }
    if (this.processor) {
      this.processor.destroy();
      this.processor = null;
    }
    if (this.store) {
      this.store.close();
      this.store = null;
    }

    // initPatches() (called by LogProcessor.start()) requires pristine native
    // references to be captured before any patching occurs. The SDK loads early
    // on the parent page, so current references are typically unpatched.
    if (!window.__userplane_pristine_natives) {
      window.__userplane_pristine_natives = {
        fetch: window.fetch.bind(window),
        xhr: {
          open: XMLHttpRequest.prototype.open,
          send: XMLHttpRequest.prototype.send,
          setRequestHeader: XMLHttpRequest.prototype.setRequestHeader,
        },
        console: {
          log: console.log,
          info: console.info,
          warn: console.warn,
          error: console.error,
          debug: console.debug,
        },
        history: {
          pushState: history.pushState,
          replaceState: history.replaceState,
        },
      };
    }

    // Create and open the IndexedDB store
    const dbName = `userplane_logs_${sessionId}_${tabId}`;
    logger.debug({ dbName }, 'opening IndexedDB store');
    this.store = new LogStore(sessionId, tabId);
    await this.store.open();
    logger.debug({ dbName }, 'IndexedDB store opened');

    // Create LogProcessor with a save function that routes to IndexedDB
    this.processor = new LogProcessor(
      tabId,
      (payload) => {
        // Handle both single and batch payloads
        if ('data' in payload && !Array.isArray(payload.data)) {
          const entry = payload.data as ProcessedLogEntry;
          this.persistEntry(entry);
        }
      },
      workspaceId,
      '', // Empty scriptUrl — initPatches() called directly
      internalEndpoints,
      {
        dispatchMode: 'immediate',
        capture: {
          console: this.preferences.captureConsole,
          network: this.preferences.captureNetwork,
          action: this.preferences.captureAction,
        },
      }
    );

    logger.debug('initialized');
  }

  /**
   * Persist a processed log entry to the appropriate IndexedDB store
   */
  private persistEntry(entry: ProcessedLogEntry): void {
    if (!this.store) return;

    const storeType =
      entry.log_type === 'network'
        ? 'network'
        : entry.log_type === 'console'
          ? 'console'
          : 'action';

    this.store.append(storeType, entry).catch((err) => {
      logger.warn({ err, storeType }, 'failed to persist log entry');
    });
  }

  /**
   * Start capturing logs
   */
  start(): void {
    if (this._isStarted) {
      logger.debug('already started');
      return;
    }
    if (!this.processor) {
      logger.warn('not initialized, cannot start');
      return;
    }

    logger.debug({ capture: this.preferences }, 'starting log processor');
    this.processor.start();
    this._isStarted = true;
    logger.debug('log capture active — patches applied, listening for events');
  }

  /**
   * Stop capturing logs (full teardown — unpatches hooks)
   */
  stop(): void {
    if (!this._isStarted && !this._isPaused) {
      logger.debug('already stopped');
      return;
    }
    if (!this.processor) return;

    logger.debug('stopping');
    this.processor.stop();
    this._isStarted = false;
    this._isPaused = false;
  }

  /**
   * Pause capturing logs (non-destructive — keeps hooks in place)
   */
  pause(): void {
    if (!this._isStarted) {
      logger.debug('not started, cannot pause');
      return;
    }
    if (!this.processor) return;

    logger.debug('pausing');
    this.processor.pause();
    this._isStarted = false;
    this._isPaused = true;
  }

  /**
   * Resume capturing logs from a paused state
   */
  resume(): void {
    if (!this._isPaused) {
      logger.debug('not paused, cannot resume');
      return;
    }
    if (!this.processor) return;

    logger.debug('resuming');
    this.processor.resume();
    this._isPaused = false;
    this._isStarted = true;
  }

  /**
   * Get the current log capture state
   */
  getState(): LogCaptureState {
    if (this._isStarted) return 'enabled';
    if (this._isPaused) return 'paused';
    return 'disabled';
  }

  /**
   * Update capture preferences
   */
  setPreferences(prefs: LogCapturePreferences): void {
    this.preferences = { ...prefs };
    if (this.processor) {
      this.processor.setCaptureOptions({
        console: prefs.captureConsole,
        network: prefs.captureNetwork,
        action: prefs.captureAction,
      });
    }
  }

  /**
   * Get all captured logs from IndexedDB
   */
  async getAllLogs(): Promise<{
    network: ProcessedLogEntry[];
    console: ProcessedLogEntry[];
    action: ProcessedLogEntry[];
  }> {
    if (!this.store) {
      return { network: [], console: [], action: [] };
    }
    return this.store.getAllLogs();
  }

  /**
   * Clear all stored logs and delete the IndexedDB database
   */
  async clearLogs(): Promise<void> {
    if (!this.store) return;
    await this.store.deleteDatabase();
    this.store = null;

    // Sweep orphaned databases from previous failed/abandoned sessions (fire-and-forget)
    LogStore.cleanupOrphanedDatabases().catch(() => {});
  }

  /**
   * Destroy the manager and cleanup all resources
   */
  async destroy(): Promise<void> {
    logger.debug('destroying');
    this.stop();
    if (this.store) {
      try {
        await this.store.deleteDatabase();
      } catch {
        // best-effort cleanup
      }
      this.store = null;
    }
    this.processor?.destroy();
    this.processor = null;
  }
}
