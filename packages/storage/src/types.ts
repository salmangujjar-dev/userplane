export type StorageProfile = 'development' | 'staging' | 'production';

export type BucketType = 'cdn' | 'assets' | 'reports';

export type StorageKind = 'logs' | 'recordings' | 'screenshots' | 'thumbnails' | 'assets';

export interface PresignedUrlOptions {
  expiresIn?: number;
}

export interface UploadPresignOptions extends PresignedUrlOptions {
  contentLength: number;
  contentType: string;
}

export interface BucketCredentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface StorageConfig {
  profile: StorageProfile;
  dev?: BucketCredentials;
  cdn?: BucketCredentials;
  assets?: BucketCredentials;
  reports?: BucketCredentials;
}

export const CacheControl = {
  IMMUTABLE: 'public, max-age=31536000, immutable',
  STANDARD: 'public, max-age=86400, stale-while-revalidate=3600',
  PRIVATE: 'private, no-store',
} as const;

export interface ThumbnailsClientOptions {
  domain?: string;
}

export interface AssetsClientOptions {
  domain?: string;
  maxSizeBytes?: number;
}

// Base options for getStorage
interface BaseStorageOptions {
  config: StorageConfig;
}

// Discriminated union for getStorage options
export type GetStorageOptions =
  | (BaseStorageOptions & { kind: 'logs' })
  | (BaseStorageOptions & { kind: 'recordings' })
  | (BaseStorageOptions & { kind: 'screenshots' })
  | (BaseStorageOptions & { kind: 'thumbnails'; domain?: string })
  | (BaseStorageOptions & { kind: 'assets'; domain?: string; maxSizeBytes?: number });

// Return type mapping for getStorage
export interface StorageClientMap {
  logs: import('./clients/logs').LogsStorageClient;
  recordings: import('./clients/recordings').RecordingsStorageClient;
  screenshots: import('./clients/screenshots').ScreenshotsStorageClient;
  thumbnails: import('./clients/thumbnails').ThumbnailsStorageClient;
  assets: import('./clients/assets').AssetsStorageClient;
}
