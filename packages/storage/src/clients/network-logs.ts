import { BaseStorageClient } from '../base';
import type {
  BucketType,
  PresignedUrlOptions,
  StorageConfig,
  UploadPresignOptions,
} from '../types';
import { CacheControl } from '../types';

const ALLOWED_CONTENT_TYPES = ['application/json'] as const;

export class NetworkLogsStorageClient extends BaseStorageClient {
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.PRIVATE;

  constructor(config: StorageConfig) {
    super(config, 'reports');
  }

  protected resolvePath(key: string): string {
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    return `${this.basePrefix}logs/network/${normalizedKey}`;
  }

  // Upload - returns { url, path } where path is stored in DB

  async getUploadUrl(sessionId: string, options: Omit<UploadPresignOptions, 'contentType'>) {
    return super.getUploadUrl(`${sessionId}.json`, {
      ...options,
      contentType: 'application/json',
    });
  }

  // Download - takes stored path from DB

  async getDownloadUrl(path: string, options?: PresignedUrlOptions) {
    return super.getDownloadUrl(path, options);
  }
}
