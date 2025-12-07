/**
 * Storage client factory
 * Creates storage clients based on configuration and kind
 */

import { LogsStorageClient } from './clients/logs';
import { RecordingsStorageClient } from './clients/recordings';
import { ScreenshotsStorageClient } from './clients/screenshots';
import { ThumbnailsStorageClient } from './clients/thumbnails';
import { AssetsStorageClient } from './clients/assets';
import type { GetStorageOptions, StorageClientMap, StorageKind } from './types';

/**
 * Get a storage client by kind
 *
 * @example
 * // Logs client
 * const logs = getStorage({ kind: 'logs', config });
 * await logs.getConsoleLogUploadUrl(sessionId, { contentLength: 1024 });
 *
 * @example
 * // Recordings client
 * const recordings = getStorage({ kind: 'recordings', config });
 * await recordings.getRecordingUploadUrl(recordingId, 'video/webm', { contentLength: 1024000 });
 *
 * @example
 * // Assets client with domain
 * const assets = getStorage({ kind: 'assets', config, domain: 'cdn.example.com' });
 * const url = assets.getWorkspaceLogoUrl(workspaceId);
 *
 * @example
 * // Thumbnails client with domain
 * const thumbnails = getStorage({ kind: 'thumbnails', config, domain: 'cdn.example.com' });
 * const url = thumbnails.getThumbnailUrl(recordingId);
 */
export function getStorage<K extends StorageKind>(
  options: Extract<GetStorageOptions, { kind: K }>
): StorageClientMap[K] {
  const { kind, config } = options;

  switch (kind) {
    case 'logs':
      return new LogsStorageClient(config) as StorageClientMap[K];

    case 'recordings':
      return new RecordingsStorageClient(config) as StorageClientMap[K];

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
