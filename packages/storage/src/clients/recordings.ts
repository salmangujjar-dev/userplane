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

export class RecordingsStorageClient extends BaseStorageClient {
  protected readonly bucketType: BucketType = 'reports';
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.PRIVATE;

  constructor(config: StorageConfig) {
    super(config);
  }

  protected resolveKey(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.basePrefix}recordings/${normalizedPath}`;
  }

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

  async getRecordingUrl(recordingId: string, ext: string, options?: PresignedUrlOptions) {
    return this.getDownloadUrl(`${recordingId}.${ext}`, options);
  }

  async getPublicRecordingUrl(recordingId: string, ext: string, options?: PresignedUrlOptions) {
    return this.getDownloadUrl(`${recordingId}.${ext}`, {
      expiresIn: options?.expiresIn ?? 86400,
    });
  }

  private getExtension(contentType: string): string {
    const baseType = contentType.split(';')[0]?.trim() ?? '';
    return EXTENSION_MAP[baseType] ?? 'webm';
  }
}
