/**
 * @userplane/storage
 * Unified storage package for Cloudflare R2
 * Supports multiple bucket types with per-bucket credentials
 */

// Factory
export { getStorage } from './factory';

// Client classes (for advanced use cases)
export {
  ASSETS_ALLOWED_CONTENT_TYPES,
  ASSETS_EXTENSION_MAP,
  type AssetsContentType,
  AssetsStorageClient,
} from './clients/assets';
export { ClientActionsStorageClient } from './clients/client-actions';
export { ConsoleLogsStorageClient } from './clients/logs';
export { NetworkLogsStorageClient } from './clients/network-logs';
export { VideoStorageClient } from './clients/recordings';
export { ScreenshotsStorageClient } from './clients/screenshots';
export { ThumbnailsStorageClient } from './clients/thumbnails';

// Types
export type {
  AssetsClientOptions,
  BucketCredentials,
  BucketType,
  GetStorageOptions,
  PresignedUrlOptions,
  StorageClientMap,
  StorageConfig,
  StorageKind,
  ThumbnailsClientOptions,
  UploadPresignOptions,
} from './types';
export { CacheControl } from './types';
