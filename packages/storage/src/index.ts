/**
 * @workspace/storage
 * Unified storage package for Cloudflare R2
 * Supports multiple bucket types with profile-based configuration
 */

// Factory
export { getStorage } from './factory';

// Client classes (for advanced use cases)
export { ConsoleLogsStorageClient } from './clients/logs';
export { NetworkLogsStorageClient } from './clients/network-logs';
export { ClientActionsStorageClient } from './clients/client-actions';
export { VideoStorageClient } from './clients/recordings';
export { ScreenshotsStorageClient } from './clients/screenshots';
export { ThumbnailsStorageClient } from './clients/thumbnails';
export {
  AssetsStorageClient,
  ASSETS_ALLOWED_CONTENT_TYPES,
  ASSETS_EXTENSION_MAP,
  type AssetsContentType,
} from './clients/assets';

// Types
export { CacheControl } from './types';
export type {
  StorageProfile,
  StorageKind,
  BucketType,
  StorageConfig,
  PresignedUrlOptions,
  UploadPresignOptions,
  BucketCredentials,
  ThumbnailsClientOptions,
  AssetsClientOptions,
  GetStorageOptions,
  StorageClientMap,
} from './types';
