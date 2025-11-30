export type ResourceType =
  | 'Document'
  | 'Stylesheet'
  | 'Image'
  | 'Media'
  | 'Font'
  | 'Script'
  | 'TextTrack'
  | 'XHR'
  | 'Fetch'
  | 'EventSource'
  | 'WebSocket'
  | 'Manifest'
  | 'SignedExchange'
  | 'Ping'
  | 'CSPViolationReport'
  | 'Preflight'
  | 'Other';

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

export interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  hasPostData?: boolean;
  mixedContentType?: string;
  initialPriority: string;
  referrerPolicy: string;
  isLinkPreload?: boolean;
}

export interface Response {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  mimeType: string;
  connectionReused: boolean;
  connectionId: number;
  remoteIPAddress?: string;
  remotePort?: number;
  fromDiskCache?: boolean;
  fromServiceWorker?: boolean;
  fromPrefetchCache?: boolean;
  encodedDataLength: number;
  timing?: ResourceTiming;
  protocol?: string;
}

export interface ResourceTiming {
  requestTime: number;
  proxyStart: number;
  proxyEnd: number;
  dnsStart: number;
  dnsEnd: number;
  connectStart: number;
  connectEnd: number;
  sslStart: number;
  sslEnd: number;
  workerStart: number;
  workerReady: number;
  workerFetchStart: number;
  workerRespondWithSettled: number;
  sendStart: number;
  sendEnd: number;
  pushStart: number;
  pushEnd: number;
  receiveHeadersEnd: number;
}

export interface RequestWillBeSentEvent {
  requestId: string;
  loaderId: string;
  documentURL: string;
  request: Request;
  timestamp: number;
  wallTime: number;
  initiator: {
    type: string;
    stack?: unknown;
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
  redirectResponse?: Response;
  type?: ResourceType;
  frameId?: string;
  hasUserGesture?: boolean;
}

export interface ResponseReceivedEvent {
  requestId: string;
  loaderId: string;
  timestamp: number;
  type: ResourceType;
  response: Response;
  frameId?: string;
}

export interface NetworkRequest {
  id: string;
  requestId: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  type: ResourceType;
  size: number;
  time: number;
  timestamp: number;
  request: Request;
  response?: Response;
  responseBody?: string;
}

export function getFilterTypeFromResourceType(resourceType: ResourceType): NetworkFilterType {
  switch (resourceType) {
    case 'XHR':
    case 'Fetch':
      return 'fetch';
    case 'WebSocket':
      return 'ws';
    case 'Script':
      return 'js';
    case 'Stylesheet':
      return 'css';
    case 'Image':
    case 'Media':
      return 'media';
    case 'Font':
      return 'font';
    case 'Document':
      return 'doc';
    default:
      return 'other';
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
  if (status >= 300 && status < 400) return 'text-blue-600 dark:text-blue-400';
  if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-400';
  if (status >= 500) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

export function createMockNetworkRequest(
  id: string,
  url: string,
  method: string,
  type: ResourceType,
  status: number,
  statusText: string,
  size: number,
  time: number,
  timestamp: number
): NetworkRequest {
  return {
    id,
    requestId: id,
    url,
    method,
    status,
    statusText,
    type,
    size,
    time,
    timestamp,
    request: {
      url,
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: '*/*',
      },
      initialPriority: 'High',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    response: {
      url,
      status,
      statusText,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': size.toString(),
      },
      mimeType: 'application/json',
      connectionReused: true,
      connectionId: 123,
      encodedDataLength: size,
    },
  };
}
