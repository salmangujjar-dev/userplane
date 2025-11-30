export type ConsoleAPIType =
  | 'log'
  | 'debug'
  | 'info'
  | 'error'
  | 'warning'
  | 'dir'
  | 'dirxml'
  | 'table'
  | 'trace'
  | 'clear'
  | 'startGroup'
  | 'startGroupCollapsed'
  | 'endGroup'
  | 'assert'
  | 'profile'
  | 'profileEnd'
  | 'count'
  | 'timeEnd'
  | 'timeStamp';

export type RemoteObjectType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'undefined'
  | 'object'
  | 'function'
  | 'symbol'
  | 'bigint';

export type RemoteObjectSubtype =
  | 'array'
  | 'null'
  | 'node'
  | 'regexp'
  | 'date'
  | 'map'
  | 'set'
  | 'weakmap'
  | 'weakset'
  | 'iterator'
  | 'generator'
  | 'error'
  | 'proxy'
  | 'promise'
  | 'typedarray'
  | 'arraybuffer'
  | 'dataview'
  | 'webassemblymemory'
  | 'wasmvalue';

export interface ObjectPreview {
  type: RemoteObjectType;
  subtype?: RemoteObjectSubtype;
  description?: string;
  overflow: boolean;
  properties: PropertyPreview[];
  entries?: EntryPreview[];
}

export interface PropertyPreview {
  name: string;
  type: RemoteObjectType;
  value?: string;
  valuePreview?: ObjectPreview;
  subtype?: RemoteObjectSubtype;
}

export interface EntryPreview {
  key?: ObjectPreview;
  value: ObjectPreview;
}

export interface RemoteObject {
  type: RemoteObjectType;
  subtype?: RemoteObjectSubtype;
  className?: string;
  value?: unknown;
  unserializableValue?: string;
  description?: string;
  objectId?: string;
  preview?: ObjectPreview;
  customPreview?: {
    header: string;
    bodyGetterId?: string;
  };
}

export interface CallFrame {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}

export interface StackTrace {
  description?: string;
  callFrames: CallFrame[];
  parent?: StackTrace;
  parentId?: {
    id: string;
    debuggerId?: string;
  };
}

export interface ConsoleAPICalledEvent {
  type: ConsoleAPIType;
  args: RemoteObject[];
  executionContextId: number;
  timestamp: number;
  stackTrace?: StackTrace;
  context?: string;
}

export interface ConsoleLogEvent {
  id: string;
  timestamp: string;
  event: ConsoleAPICalledEvent;
  count?: number;
  groupId?: string;
}

export type LogLevel = 'log' | 'error' | 'warning' | 'info' | 'debug';

export function formatRemoteObject(obj: RemoteObject): string {
  if (obj.value !== undefined) {
    return String(obj.value);
  }

  if (obj.unserializableValue) {
    return obj.unserializableValue;
  }

  if (obj.description) {
    return obj.description;
  }

  if (obj.subtype === 'null') {
    return 'null';
  }

  if (obj.type === 'undefined') {
    return 'undefined';
  }

  if (obj.type === 'function') {
    return obj.className || 'ƒ ()';
  }

  if (obj.type === 'symbol') {
    return obj.className || 'Symbol()';
  }

  if (obj.subtype === 'array' && obj.preview) {
    const length = obj.preview.properties.find((p) => p.name === 'length')?.value || '0';
    return `Array(${length})`;
  }

  if (obj.type === 'object') {
    return obj.className || 'Object';
  }

  return String(obj.value);
}

export function createMockLogEvent(
  id: string,
  timestampMs: number,
  type: ConsoleAPIType,
  message: string,
  source?: { url: string; lineNumber: number; columnNumber?: number }
): ConsoleLogEvent {
  const callFrames: CallFrame[] = source
    ? [
        {
          functionName: '',
          scriptId: '0',
          url: source.url,
          lineNumber: source.lineNumber,
          columnNumber: source.columnNumber || 0,
        },
      ]
    : [];

  return {
    id,
    timestamp: new Date(timestampMs).toISOString(),
    event: {
      type,
      args: [
        {
          type: 'string',
          value: message,
        },
      ],
      executionContextId: 1,
      timestamp: timestampMs,
      stackTrace:
        callFrames.length > 0
          ? {
              callFrames,
            }
          : undefined,
    },
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
