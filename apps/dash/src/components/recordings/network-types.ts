import type { ParsedBody, RecordingNetworkLog } from '@workspace/contract';

export type { ParsedBody, RecordingNetworkLog } from '@workspace/contract';

export type NetworkFilterType =
  | 'all'
  | 'fetch'
  | 'ws'
  | 'js'
  | 'css'
  | 'media'
  | 'font'
  | 'doc'
  | 'other';

export function getFilterTypeFromMimeAndInitiator(
  type: string,
  mimeType: string
): Exclude<NetworkFilterType, 'all'> {
  // type is the initiatorType or resource type string from the logger
  const t = type.toLowerCase();
  if (t === 'fetch' || t === 'xhr' || t === 'xmlhttprequest') return 'fetch';
  if (t === 'websocket') return 'ws';

  // Fall back to mimeType
  const m = mimeType.toLowerCase();
  if (m.includes('javascript') || m.includes('ecmascript')) return 'js';
  if (m.includes('css')) return 'css';
  if (m.includes('image') || m.includes('video') || m.includes('audio')) return 'media';
  if (m.includes('font') || m.includes('woff') || m.includes('ttf') || m.includes('otf'))
    return 'font';
  if (m.includes('html')) return 'doc';

  // Check type field for resource types
  if (t === 'script') return 'js';
  if (t === 'link' || t === 'css') return 'css';
  if (t === 'img' || t === 'video' || t === 'audio') return 'media';

  return 'other';
}

export function formatTime(ms: number | string): string {
  const msNum = typeof ms === 'string' ? parseFloat(ms) : ms;
  if (isNaN(msNum)) return String(ms);
  if (msNum < 1000) {
    return `${Math.round(msNum)} ms`;
  }
  return `${(msNum / 1000).toFixed(2)} s`;
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
  if (status >= 300 && status < 400) return 'text-blue-600 dark:text-blue-400';
  if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-400';
  if (status >= 500) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

export function createMockNetworkLog(
  requestId: string,
  url: string,
  method: string,
  type: string,
  mimeType: string,
  status: number,
  statusText: string,
  duration: number,
  timestamp: number,
  options?: {
    requestHeaders?: Record<string, string>;
    requestBody?: ParsedBody | null;
    responseHeaders?: Record<string, string>;
    responseBody?: unknown;
    isContentAllowed?: boolean;
    protocol?: string;
  }
): RecordingNetworkLog {
  return {
    log_type: 'network',
    requestId,
    startedDateTime: timestamp,
    timestamp,
    url,
    method,
    requestHeaders: options?.requestHeaders ?? {
      'User-Agent': 'Mozilla/5.0',
      Accept: '*/*',
    },
    requestBody: options?.requestBody ?? null,
    status,
    statusText,
    responseHeaders: options?.responseHeaders ?? {
      'Content-Type': mimeType,
    },
    mimeType,
    responseBody: options?.responseBody ?? null,
    isContentAllowed: options?.isContentAllowed ?? true,
    duration,
    type,
    protocol: options?.protocol ?? 'h2',
  };
}
