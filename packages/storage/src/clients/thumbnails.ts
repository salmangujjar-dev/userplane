import { BaseStorageClient } from '../base';
import type {
  BucketType,
  StorageConfig,
  ThumbnailsClientOptions,
  PresignedUrlOptions,
} from '../types';
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

  protected resolvePath(key: string): string {
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    return `${this.basePrefix}thumbnails/${normalizedKey}`;
  }

  // Upload method - returns { url, path } where path is stored in DB

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

  // Download method - takes stored path from DB

  async getThumbnailDownloadUrl(path: string, options?: PresignedUrlOptions) {
    return this.getDownloadUrl(path, options);
  }

  // Public CDN URL - takes stored path from DB, prefixes with domain

  getThumbnailUrl(path: string): string {
    if (!this.domain) {
      throw new Error('Domain required for public thumbnail URLs');
    }
    return `https://${this.domain}/${path}`;
  }

  private getExtension(contentType: string): string {
    return EXTENSION_MAP[contentType] ?? 'webp';
  }
}
