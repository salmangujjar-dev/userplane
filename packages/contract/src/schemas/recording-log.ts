// ─── Client Log Types (from logger — single source of truth) ───────────────

import type {
  ProcessedConsoleEntry,
  ProcessedNetworkEntry,
  ProcessedUserActionEntry,
} from '@workspace/logger';

export type {
  SerializedElement,
  SerializedFunction,
  SerializedError,
  SerializedValue,
  ParsedBody,
  UserActionType,
  UserActionData,
  ProcessedConsoleEntry,
  ProcessedNetworkEntry,
  ProcessedUserActionEntry,
} from '@workspace/logger';

// Backward-compatible aliases used by dash/API
export type RecordingConsoleLog = ProcessedConsoleEntry;
export type RecordingNetworkLog = ProcessedNetworkEntry;
export type RecordingActionLog = ProcessedUserActionEntry;
export type RecordingClientLog =
  | ProcessedConsoleEntry
  | ProcessedNetworkEntry
  | ProcessedUserActionEntry;

// ─── Backend Log Types (planned feature, no logger counterpart) ────────────

export type BackendLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Backend log schema — PLANNED FEATURE
 * The schema and dashboard UI (backend-panel.tsx, backend-log-entry.tsx) are ready.
 * Missing pipeline pieces: FILE_TYPE 'backend_log', storage client, upload flow, API endpoints.
 */
export interface RecordingBackendLog {
  id: string;
  timestamp: number;
  level: BackendLogLevel;
  message: string;
  service?: string;
  metadata?: Record<string, unknown>;
  trace?: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };
  error?: {
    type?: string;
    message?: string;
    stack?: string;
  };
}
