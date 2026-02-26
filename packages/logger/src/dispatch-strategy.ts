/**
 * dispatch-strategy.ts
 *
 * Strategy implementations for log dispatch:
 * - ImmediateDispatcher: sends each entry individually via saveFunction
 * - BatchedDispatcher: buffers entries and flushes on interval, buffer cap, or page unload
 */

import type {
  BatchSavePayload,
  DispatchContext,
  DispatchStrategy,
  FlushFunction,
  ProcessedLogEntry,
  SavePayload,
} from './types';

// ─── Immediate Log Dispatcher ───────────────────────────────────────────────

export class ImmediateDispatcher implements DispatchStrategy {
  constructor(private readonly _ctx: DispatchContext) {}

  emit(entry: ProcessedLogEntry): void {
    let eventType: 'log_console' | 'log_network' = 'log_console';
    if (entry.log_type !== 'userStep' && entry.log_type !== 'console') {
      eventType = 'log_network';
    }

    const payload: SavePayload = {
      event: eventType,
      tabId: this._ctx.tabId,
      data: entry,
      is_single_log: true,
      timestamp: this._ctx.serverNow(),
      has_focus: document.hasFocus(),
      tab_details: {
        location: window.location.href,
        title: document.title,
        window_width: window.innerWidth,
        window_height: window.innerHeight,
      },
    };

    this._ctx.saveFunction?.(payload);
  }

  start(): void {}
  pause(): void {}
  stop(): void {}
  destroy(): void {}
}

// ─── Batched Log Dispatcher ─────────────────────────────────────────────────

export interface BatchedDispatcherOptions {
  flushInterval?: number;
  maxBufferSize?: number;
  flushFunction?: FlushFunction;
}

export class BatchedDispatcher implements DispatchStrategy {
  private _buffer: ProcessedLogEntry[] = [];
  private _sendInterval: ReturnType<typeof setInterval> | undefined;
  private readonly _flushInterval: number;
  private readonly _maxBufferSize: number;
  private readonly _flushFunction: FlushFunction | undefined;

  private readonly _handleBeforeUnload = (): void => {
    if (this._buffer.length === 0) return;

    if (this._flushFunction) {
      const entries = this._buffer.splice(0);
      this._flushFunction(this._buildBatchPayload(entries));
    } else {
      this._flushBuffer();
    }
  };

  private readonly _handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this._flushBuffer();
    }
  };

  constructor(
    private readonly _ctx: DispatchContext,
    options?: BatchedDispatcherOptions
  ) {
    this._flushInterval = options?.flushInterval ?? 1000;
    this._maxBufferSize = options?.maxBufferSize ?? 50;
    this._flushFunction = options?.flushFunction;
  }

  emit(entry: ProcessedLogEntry): void {
    this._buffer.push(entry);
    if (this._buffer.length >= this._maxBufferSize) {
      this._flushBuffer();
    }
  }

  start(): void {
    this._startFlushInterval();
    window.addEventListener('beforeunload', this._handleBeforeUnload);
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
  }

  pause(): void {
    this._stopFlushInterval();
    this._flushBuffer();
  }

  stop(): void {
    this.pause();
    window.removeEventListener('beforeunload', this._handleBeforeUnload);
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
  }

  destroy(): void {
    this._flushBuffer();
  }

  // ─── Private Helpers ────────────────────────────────────────────

  private _buildBatchPayload(entries: ProcessedLogEntry[]): BatchSavePayload {
    return {
      event: 'log_batch',
      tabId: this._ctx.tabId,
      data: entries,
      is_single_log: false,
      timestamp: this._ctx.serverNow(),
      has_focus: document.hasFocus(),
      tab_details: {
        location: window.location.href,
        title: document.title,
        window_width: window.innerWidth,
        window_height: window.innerHeight,
      },
    };
  }

  private _flushBuffer(): void {
    if (this._buffer.length === 0) return;
    const entries = this._buffer.splice(0);
    const payload = this._buildBatchPayload(entries);
    this._ctx.saveFunction?.(payload);
  }

  private _startFlushInterval(): void {
    this._stopFlushInterval();
    this._sendInterval = setInterval(() => this._flushBuffer(), this._flushInterval);
  }

  private _stopFlushInterval(): void {
    if (this._sendInterval != null) {
      clearInterval(this._sendInterval);
      this._sendInterval = undefined;
    }
  }
}
