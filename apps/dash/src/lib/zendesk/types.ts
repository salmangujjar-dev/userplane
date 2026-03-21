/**
 * Zendesk Apps Framework SDK type declarations
 * The ZAF SDK is loaded via script tag in the iframe layout, not npm.
 */

/** Metadata returned by `client.metadata()` */
export interface ZAFMetadata {
  settings: Record<string, string>;
  appId: number;
  name: string;
  installationId: number;
}

export interface ZAFClientInstance {
  context(): Promise<{ location: string }>;
  get(path: string): Promise<Record<string, unknown>>;
  get(paths: string[]): Promise<Record<string, unknown>>;
  request<T = unknown>(options: {
    url: string;
    type?: string;
    data?: unknown;
    headers?: Record<string, string>;
    contentType?: string;
    secure?: boolean;
  }): Promise<T>;
  set(path: string, value: unknown): Promise<void>;
  invoke(name: 'resize', options: { width: string; height: string }): Promise<void>;
  invoke(name: 'notify', message: string, kind: 'notice' | 'error' | 'alert'): Promise<void>;
  invoke(name: 'comment.appendHtml', html: string): Promise<void>;
  invoke(name: 'ticket.tags.add', tag: string): Promise<void>;
  invoke(name: string, ...args: unknown[]): Promise<unknown>;
  on(
    event: 'app.registered',
    callback: (data: { metadata: ZAFMetadata; context: { location: string } }) => void
  ): void;
  on(event: 'app.activated', callback: (data: unknown) => void): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  trigger(event: string, data?: unknown): void;
  metadata(): Promise<ZAFMetadata>;
}

export interface ZAFClientStatic {
  init(): ZAFClientInstance;
}

declare global {
  interface Window {
    ZAFClient?: ZAFClientStatic;
  }
}
