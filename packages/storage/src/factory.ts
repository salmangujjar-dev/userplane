/**
 * Storage client factory
 * Creates storage clients based on configuration and kind
 */

import { AssetsStorageClient } from './clients/assets';
import { ClientActionsStorageClient } from './clients/client-actions';
import { ConsoleLogsStorageClient } from './clients/logs';
import { NetworkLogsStorageClient } from './clients/network-logs';
import { VideoStorageClient } from './clients/recordings';
import { ScreenshotsStorageClient } from './clients/screenshots';
import { ThumbnailsStorageClient } from './clients/thumbnails';
import type { GetStorageOptions, StorageClientMap, StorageKind } from './types';

/**
 * Get a storage client by kind
 *
 * @example
 * // Console logs client
 * const consoleLogs = getStorage({ kind: 'consoleLogs', config });
 * await consoleLogs.getUploadUrl(sessionId, { contentLength: 1024 });
 *
 * @example
 * // Network logs client
 * const networkLogs = getStorage({ kind: 'networkLogs', config });
 * await networkLogs.getUploadUrl(sessionId, { contentLength: 1024 });
 *
 * @example
 * // Client actions client
 * const clientActions = getStorage({ kind: 'clientActions', config });
 * await clientActions.getUploadUrl(sessionId, { contentLength: 1024 });
 *
 * @example
 * // Video client
 * const video = getStorage({ kind: 'video', config });
 * await video.getRecordingUploadUrl(recordingId, 'video/webm', { contentLength: 1024000 });
 *
 * @example
 * // Assets client with domain - path comes from write operation (putWorkspaceLogo returns { path })
 * const assets = getStorage({ kind: 'assets', config, domain: 'cdn.example.com' });
 * const url = assets.getWorkspaceLogoUrl(storedPath);
 *
 * @example
 * // Thumbnails client with domain - path comes from DB (stored during upload)
 * const thumbnails = getStorage({ kind: 'thumbnails', config, domain: 'cdn.example.com' });
 * const url = thumbnails.getThumbnailUrl(storedPath);
 */
export function getStorage<K extends StorageKind>(
  options: Extract<GetStorageOptions, { kind: K }>
): StorageClientMap[K] {
  const { kind, config } = options;

  switch (kind) {
    case 'consoleLogs':
      return new ConsoleLogsStorageClient(config) as StorageClientMap[K];

    case 'networkLogs':
      return new NetworkLogsStorageClient(config) as StorageClientMap[K];

    case 'clientActions':
      return new ClientActionsStorageClient(config) as StorageClientMap[K];

    case 'video':
      return new VideoStorageClient(config) as StorageClientMap[K];

    case 'screenshots':
      return new ScreenshotsStorageClient(config) as StorageClientMap[K];

    case 'thumbnails': {
      const opts = options as Extract<GetStorageOptions, { kind: 'thumbnails' }>;
      return new ThumbnailsStorageClient(config, { domain: opts.domain }) as StorageClientMap[K];
    }

    case 'assets': {
      const opts = options as Extract<GetStorageOptions, { kind: 'assets' }>;
      return new AssetsStorageClient(config, {
        domain: opts.domain,
        maxSizeBytes: opts.maxSizeBytes,
      }) as StorageClientMap[K];
    }

    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown storage kind: ${_exhaustive}`);
    }
  }
}
