/**
 * @workspace/storage
 * Unified storage package for Cloudflare R2
 * Supports multiple bucket types with profile-based configuration
 */

// Factory
export { getStorage } from './factory';

// Client classes (for advanced use cases)
export { LogsStorageClient } from './clients/logs';
export { RecordingsStorageClient } from './clients/recordings';
export { ScreenshotsStorageClient } from './clients/screenshots';
export { ThumbnailsStorageClient } from './clients/thumbnails';
export { AssetsStorageClient } from './clients/assets';

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
