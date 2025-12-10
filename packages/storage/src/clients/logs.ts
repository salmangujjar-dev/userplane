import { BaseStorageClient } from '../base';
import type {
  BucketType,
  StorageConfig,
  UploadPresignOptions,
  PresignedUrlOptions,
} from '../types';
import { CacheControl } from '../types';

const ALLOWED_CONTENT_TYPES = ['application/x-ndjson', 'application/ndjson'] as const;

export class ConsoleLogsStorageClient extends BaseStorageClient {
  protected readonly bucketType: BucketType = 'reports';
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.PRIVATE;

  constructor(config: StorageConfig) {
    super(config);
  }

  protected resolvePath(key: string): string {
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    return `${this.basePrefix}logs/console/${normalizedKey}`;
  }

  // Upload - returns { url, path } where path is stored in DB

  async getUploadUrl(sessionId: string, options: Omit<UploadPresignOptions, 'contentType'>) {
    return super.getUploadUrl(`${sessionId}.ndjson`, {
      ...options,
      contentType: 'application/x-ndjson',
    });
  }

  // Download - takes stored path from DB

  async getDownloadUrl(path: string, options?: PresignedUrlOptions) {
    return super.getDownloadUrl(path, options);
  }
}
