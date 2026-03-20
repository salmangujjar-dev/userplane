/**
 * Zendesk Apps Framework SDK type declarations
 * The ZAF SDK is loaded via script tag, not npm
 */

/** Metadata returned by `client.metadata()` */
interface ZAFMetadata {
  settings: { apiToken: string; workspaceId: string };
  appId: number;
  name: string;
  installationId: number;
}

interface ZAFClientInstance {
  /** Get context information (location, etc.) */
  context(): Promise<{ location: string }>;

  /** Get one or more ZAF data paths */
  get(path: string): Promise<Record<string, unknown>>;
  get(paths: string[]): Promise<Record<string, unknown>>;

  /** Make an HTTP request via the ZAF proxy */
  request<T = unknown>(options: {
    url: string;
    type?: string;
    data?: unknown;
    headers?: Record<string, string>;
    contentType?: string;
    secure?: boolean;
  }): Promise<T>;

  /** Set a ZAF data path value */
  set(path: string, value: unknown): Promise<void>;

  /** Resize the app iframe */
  invoke(name: 'resize', options: { width: string; height: string }): Promise<void>;
  /** Show a notification */
  invoke(name: 'notify', message: string, kind: 'notice' | 'error' | 'alert'): Promise<void>;
  /** Append HTML to the ticket comment */
  invoke(name: 'comment.appendHtml', html: string): Promise<void>;
  /** Add a tag to the ticket */
  invoke(name: 'ticket.tags.add', tag: string): Promise<void>;
  /** Generic invoke */
  invoke(name: string, ...args: unknown[]): Promise<unknown>;

  /** Listen for app lifecycle events */
  on(
    event: 'app.registered',
    callback: (data: { metadata: ZAFMetadata; context: { location: string } }) => void
  ): void;
  /** Listen for app activation */
  on(event: 'app.activated', callback: (data: unknown) => void): void;
  /** Listen for any ZAF event */
  on(event: string, callback: (...args: unknown[]) => void): void;

  /** Remove an event listener */
  off(event: string, callback: (...args: unknown[]) => void): void;

  /** Trigger a custom event */
  trigger(event: string, data?: unknown): void;

  /** Get app metadata including settings */
  metadata(): Promise<ZAFMetadata>;
}

interface ZAFClientStatic {
  init(): ZAFClientInstance;
}

interface Window {
  ZAFClient: ZAFClientStatic;
}
