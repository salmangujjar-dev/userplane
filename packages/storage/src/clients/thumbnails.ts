import { BaseStorageClient } from '../base';
import type { BucketType, StorageConfig, ThumbnailsClientOptions } from '../types';
import { CacheControl } from '../types';

const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

const EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export class ThumbnailsStorageClient extends BaseStorageClient {
  protected readonly bucketType: BucketType = 'assets';
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.IMMUTABLE;

  private domain?: string;

  constructor(config: StorageConfig, options?: ThumbnailsClientOptions) {
    super(config);
    this.domain = options?.domain;
  }

  protected resolveKey(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.basePrefix}thumbnails/${normalizedPath}`;
  }

  async getThumbnailUploadUrl(
    recordingId: string,
    contentType: string,
    options: { contentLength: number; expiresIn?: number }
  ) {
    const ext = this.getExtension(contentType);
    return this.getUploadUrl(`${recordingId}.${ext}`, {
      ...options,
      contentType,
    });
  }

  getThumbnailUrl(recordingId: string, ext: string = 'webp'): string {
    if (!this.domain) {
      throw new Error('Domain required for public thumbnail URLs');
    }
    const key = this.resolveKey(`${recordingId}.${ext}`);
    return `https://${this.domain}/${key}`;
  }

  private getExtension(contentType: string): string {
    return EXTENSION_MAP[contentType] ?? 'webp';
  }
}
