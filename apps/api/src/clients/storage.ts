/**
 * Storage client initialization
 * Creates storage clients using configuration from environment
 */

import {
  getStorage,
  type StorageConfig,
  type LogsStorageClient,
  type RecordingsStorageClient,
  type ScreenshotsStorageClient,
  type ThumbnailsStorageClient,
  type AssetsStorageClient,
} from '@workspace/storage';
import { env } from '@/api/env';

// Singleton instances
let logsClient: LogsStorageClient | null = null;
let recordingsClient: RecordingsStorageClient | null = null;
let screenshotsClient: ScreenshotsStorageClient | null = null;
let thumbnailsClient: ThumbnailsStorageClient | null = null;
let assetsClient: AssetsStorageClient | null = null;

function getConfig(): StorageConfig {
  return {
    profile: env.storage.profile,
    dev: env.storage.dev,
    cdn: env.storage.cdn,
    assets: env.storage.assets,
    reports: env.storage.reports,
  };
}

export function getLogsStorage(): LogsStorageClient {
  if (!logsClient) {
    logsClient = getStorage({ kind: 'logs', config: getConfig() });
  }
  return logsClient;
}

export function getRecordingsStorage(): RecordingsStorageClient {
  if (!recordingsClient) {
    recordingsClient = getStorage({ kind: 'recordings', config: getConfig() });
  }
  return recordingsClient;
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
  logsClient = null;
  recordingsClient = null;
  screenshotsClient = null;
  thumbnailsClient = null;
  assetsClient = null;
}
