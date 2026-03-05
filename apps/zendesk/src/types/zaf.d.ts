/**
 * Zendesk Apps Framework SDK type declarations
 * The ZAF SDK is loaded via script tag, not npm
 */

interface ZAFClientInstance {
  context(): Promise<{ location: string }>;
  get(path: string): Promise<Record<string, unknown>>;
  get(...paths: string[]): Promise<Record<string, unknown>>;
  invoke(name: string, ...args: unknown[]): Promise<unknown>;
  on(event: string, callback: (...args: unknown[]) => void): void;
  metadata(): Promise<{
    settings: Record<string, string>;
    appId: number;
    name: string;
    installationId: number;
  }>;
}

interface ZAFClientStatic {
  init(): ZAFClientInstance;
}

interface Window {
  ZAFClient: ZAFClientStatic;
}
