import { BaseStorageClient } from '../base';
import type { BucketType, StorageConfig, PresignedUrlOptions } from '../types';
import { CacheControl } from '../types';

const ALLOWED_CONTENT_TYPES = ['video/webm', 'video/mp4', 'video/x-matroska', 'video/ogg'] as const;

const EXTENSION_MAP: Record<string, string> = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/x-matroska': 'mkv',
  'video/ogg': 'ogg',
};

export class VideoStorageClient extends BaseStorageClient {
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.PRIVATE;

  constructor(config: StorageConfig) {
    super(config, 'reports');
  }

  protected resolvePath(key: string): string {
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
    return `${this.basePrefix}recordings/${normalizedKey}`;
  }

  // Upload method - returns { url, path } where path is stored in DB

  async getRecordingUploadUrl(
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

  async getRecordingDownloadUrl(path: string, options?: PresignedUrlOptions) {
    return this.getDownloadUrl(path, options);
  }

  private getExtension(contentType: string): string {
    const baseType = contentType.split(';')[0]?.trim() ?? '';
    return EXTENSION_MAP[baseType] ?? 'webm';
  }
}
