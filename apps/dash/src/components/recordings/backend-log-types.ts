import type { BackendLogLevel, RecordingBackendLog } from '@workspace/contract';

export type { BackendLogLevel, RecordingBackendLog } from '@workspace/contract';

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString();
}

export function createMockBackendLog(
  id: string,
  timestamp: number,
  level: BackendLogLevel,
  message: string,
  options?: {
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
): RecordingBackendLog {
  return {
    id,
    timestamp,
    level,
    message,
    service: options?.service,
    metadata: options?.metadata,
    trace: options?.trace,
    error: options?.error,
  };
}
