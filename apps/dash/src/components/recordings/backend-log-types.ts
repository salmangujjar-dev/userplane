export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface StructuredLog {
  id: string;
  timestamp: number;
  level: LogLevel;
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

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString();
}

export function createMockBackendLog(
  id: string,
  timestamp: number,
  level: LogLevel,
  message: string,
  options?: {
    service?: string;
    metadata?: Record<string, unknown>;
    trace?: StructuredLog['trace'];
    error?: StructuredLog['error'];
  }
): StructuredLog {
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
