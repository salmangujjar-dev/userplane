import { BaseStorageClient } from '../base';
import type { BucketType, PresignedUrlOptions, StorageConfig } from '../types';
import { CacheControl } from '../types';

const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

export class ScreenshotsStorageClient extends BaseStorageClient {
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.PRIVATE;

  constructor(config: StorageConfig) {
    super(config, 'reports');
  }

  protected resolvePath(key: string): string {
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    return `${this.basePrefix}screenshots/${normalizedKey}`;
  }

  // Upload method - returns { url, path } where path is stored in DB

  async getScreenshotUploadUrl(
    reportId: string,
    filename: string,
    contentType: string,
    options: { contentLength: number; expiresIn?: number }
  ) {
    return this.getUploadUrl(`${reportId}/${filename}`, {
      ...options,
      contentType,
    });
  }

  // Download method - takes stored path from DB

  async getScreenshotDownloadUrl(path: string, options?: PresignedUrlOptions) {
    return this.getDownloadUrl(path, options);
  }
}
