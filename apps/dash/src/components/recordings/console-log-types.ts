import type { RecordingConsoleLog, SerializedValue } from '@workspace/contract';

export type { RecordingConsoleLog, SerializedValue } from '@workspace/contract';

export type LogLevel = 'log' | 'error' | 'warning' | 'info' | 'debug';

export function formatSerializedValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    if (obj.type === 'element') {
      const tag = (obj.tag as string) || 'element';
      const id = obj.id ? ` id="${obj.id}"` : '';
      const cls = obj.class ? ` class="${obj.class}"` : '';
      return `<${tag}${id}${cls}>`;
    }

    if (obj.type === 'function') {
      return `ƒ ${obj.name || '(anonymous)'}`;
    }

    if (obj.type === 'error') {
      return `${obj.name}: ${obj.message}`;
    }

    if (Array.isArray(value)) {
      return `Array(${value.length})`;
    }

    return JSON.stringify(value);
  }

  return String(value);
}

export function createMockConsoleLog(
  id: string,
  timestamp: number,
  type: string,
  args: unknown[],
  url: string,
  trace?: string[]
): RecordingConsoleLog {
  return {
    id,
    log_type: 'console',
    type,
    args: args as SerializedValue[],
    trace,
    timestamp,
    url,
  };
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}
