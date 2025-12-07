import { BaseStorageClient } from '../base';
import type { BucketType, StorageConfig, PresignedUrlOptions } from '../types';
import { CacheControl } from '../types';

const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

export class ScreenshotsStorageClient extends BaseStorageClient {
  protected readonly bucketType: BucketType = 'reports';
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.PRIVATE;

  constructor(config: StorageConfig) {
    super(config);
  }

  protected resolveKey(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.basePrefix}screenshots/${normalizedPath}`;
  }

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

  async getScreenshotUrl(reportId: string, filename: string, options?: PresignedUrlOptions) {
    return this.getDownloadUrl(`${reportId}/${filename}`, options);
  }
}
