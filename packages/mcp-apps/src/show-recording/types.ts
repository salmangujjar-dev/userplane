/** Data shape returned by the userplane_show_recording tool. */
export interface ShowRecordingData {
  workspaceId: string;
  recording: RecordingDetail;
  resources: RecordingResources;
}

export interface RecordingDetail {
  recordingId: string;
  recordingDurationMs: number;
  recordingStartedAt: string | null;
  meta: RecordingMeta;
}

export interface RecordingMeta {
  link: LinkRef;
  creator: RecordingCreator;
  project: ProjectRef;
  domain: DomainRef;
  workspaceId: string;
  status: string;
  systemMeta: Record<string, unknown> | null;
  customMeta: Record<string, unknown> | null;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkRef {
  linkId: string;
  title: string | null;
  providerType: string | null;
  providerId: string | null;
  providerRef: string | null;
  providerData: Record<string, unknown> | null;
  createdAt: string;
}

export interface RecordingCreator {
  workspaceMemberId: string;
  name: string;
}

export interface ProjectRef {
  projectId: string | null;
  title: string | null;
}

export interface DomainRef {
  domainId: string;
  url: string;
}

export interface RecordingResources {
  video: CaptureResource;
  thumbnail: CaptureResource;
  consoleLog: CaptureResource;
  networkLog: CaptureResource;
  action: CaptureResource;
}

export interface CaptureResource {
  url: string | null;
  captureEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Log data types (fetched from presigned URLs)
// ---------------------------------------------------------------------------

export interface ConsoleLogEntry {
  log_type: 'console';
  type: string;
  args: unknown[];
  trace?: string[];
  timestamp: number;
  url?: string;
  isInitialConsoleLog?: boolean;
}

export interface NetworkLogEntry {
  requestId: string;
  url: string;
  method: string;
  type: string;
  mimeType: string;
  status: number;
  statusText: string;
  duration: number;
  timestamp: number;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  isContentAllowed: boolean;
  protocol?: string;
}

export interface ActionLogEntry {
  log_type: 'action';
  type: 'action';
  timestamp: number;
  data: {
    type: string;
    timestamp: number;
    url?: string;
    pageTitle?: string;
    method?: string;
    triggeredBy?: string;
    tabId?: string;
    from?: string;
    to?: string;
    element?: {
      tag?: string;
      id?: string;
      classes?: string[];
      selector?: string;
    };
    [key: string]: unknown;
  };
}
