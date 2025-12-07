import { BaseStorageClient } from '../base';
import type { BucketType, StorageConfig, UploadPresignOptions } from '../types';
import { CacheControl } from '../types';

const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/x-ndjson',
  'application/ndjson',
] as const;

export class LogsStorageClient extends BaseStorageClient {
  protected readonly bucketType: BucketType = 'reports';
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.PRIVATE;

  constructor(config: StorageConfig) {
    super(config);
  }

  protected resolveKey(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.basePrefix}logs/${normalizedPath}`;
  }

  async getConsoleLogUploadUrl(
    sessionId: string,
    options: Omit<UploadPresignOptions, 'contentType'>
  ) {
    return this.getUploadUrl(`console/${sessionId}.ndjson`, {
      ...options,
      contentType: 'application/x-ndjson',
    });
  }

  async getNetworkLogUploadUrl(
    sessionId: string,
    options: Omit<UploadPresignOptions, 'contentType'>
  ) {
    return this.getUploadUrl(`network/${sessionId}.json`, {
      ...options,
      contentType: 'application/json',
    });
  }
}
