/**
 * Storage client initialization
 * Creates storage clients using configuration from environment
 */

import {
  type AssetsStorageClient,
  type ClientActionsStorageClient,
  type ConsoleLogsStorageClient,
  getStorage,
  type NetworkLogsStorageClient,
  type ScreenshotsStorageClient,
  type StorageConfig,
  type ThumbnailsStorageClient,
  type VideoStorageClient,
} from '@userplane/storage';

import { env } from '@/api/env';

// Singleton instances
let consoleLogsClient: ConsoleLogsStorageClient | null = null;
let networkLogsClient: NetworkLogsStorageClient | null = null;
let clientActionsClient: ClientActionsStorageClient | null = null;
let videoClient: VideoStorageClient | null = null;
let screenshotsClient: ScreenshotsStorageClient | null = null;
let thumbnailsClient: ThumbnailsStorageClient | null = null;
let assetsClient: AssetsStorageClient | null = null;

function getConfig(): StorageConfig {
  return {
    cdn: env.storage.cdn,
    assets: env.storage.assets,
    reports: env.storage.reports,
  };
}

export function getConsoleLogsStorage(): ConsoleLogsStorageClient {
  if (!consoleLogsClient) {
    consoleLogsClient = getStorage({ kind: 'consoleLogs', config: getConfig() });
  }
  return consoleLogsClient;
}

export function getNetworkLogsStorage(): NetworkLogsStorageClient {
  if (!networkLogsClient) {
    networkLogsClient = getStorage({ kind: 'networkLogs', config: getConfig() });
  }
  return networkLogsClient;
}

export function getClientActionsStorage(): ClientActionsStorageClient {
  if (!clientActionsClient) {
    clientActionsClient = getStorage({ kind: 'clientActions', config: getConfig() });
  }
  return clientActionsClient;
}

export function getVideoStorage(): VideoStorageClient {
  if (!videoClient) {
    videoClient = getStorage({ kind: 'video', config: getConfig() });
  }
  return videoClient;
}

export function getScreenshotsStorage(): ScreenshotsStorageClient {
  if (!screenshotsClient) {
    screenshotsClient = getStorage({ kind: 'screenshots', config: getConfig() });
  }
  return screenshotsClient;
}

export function getThumbnailsStorage(): ThumbnailsStorageClient {
  if (!thumbnailsClient) {
    thumbnailsClient = getStorage({
      kind: 'thumbnails',
      config: getConfig(),
      domain: env.storage.assetsDomain,
    });
  }
  return thumbnailsClient;
}

export function getAssetsStorage(): AssetsStorageClient {
  if (!assetsClient) {
    assetsClient = getStorage({
      kind: 'assets',
      config: getConfig(),
      domain: env.storage.assetsDomain,
    });
  }
  return assetsClient;
}

/**
 * Reset all storage clients (useful for testing)
 */
export function resetStorage(): void {
  consoleLogsClient = null;
  networkLogsClient = null;
  clientActionsClient = null;
  videoClient = null;
  screenshotsClient = null;
  thumbnailsClient = null;
  assetsClient = null;
}
