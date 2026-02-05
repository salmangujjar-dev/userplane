export type BucketType = 'cdn' | 'assets' | 'reports';

export type StorageKind =
  | 'consoleLogs'
  | 'networkLogs'
  | 'clientActions'
  | 'video'
  | 'screenshots'
  | 'thumbnails'
  | 'assets';

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
  | (BaseStorageOptions & { kind: 'consoleLogs' })
  | (BaseStorageOptions & { kind: 'networkLogs' })
  | (BaseStorageOptions & { kind: 'clientActions' })
  | (BaseStorageOptions & { kind: 'video' })
  | (BaseStorageOptions & { kind: 'screenshots' })
  | (BaseStorageOptions & { kind: 'thumbnails'; domain?: string })
  | (BaseStorageOptions & { kind: 'assets'; domain?: string; maxSizeBytes?: number });

// Return type mapping for getStorage
export interface StorageClientMap {
  consoleLogs: import('./clients/logs').ConsoleLogsStorageClient;
  networkLogs: import('./clients/network-logs').NetworkLogsStorageClient;
  clientActions: import('./clients/client-actions').ClientActionsStorageClient;
  video: import('./clients/recordings').VideoStorageClient;
  screenshots: import('./clients/screenshots').ScreenshotsStorageClient;
  thumbnails: import('./clients/thumbnails').ThumbnailsStorageClient;
  assets: import('./clients/assets').AssetsStorageClient;
}
