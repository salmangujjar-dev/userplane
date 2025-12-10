import { BaseStorageClient } from '../base';
import type { BucketType, StorageConfig, AssetsClientOptions } from '../types';
import { CacheControl } from '../types';

export const ASSETS_ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
] as const;

export type AssetsContentType = (typeof ASSETS_ALLOWED_CONTENT_TYPES)[number];

export const ASSETS_EXTENSION_MAP: Record<AssetsContentType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

// Internal aliases for backward compatibility
const ALLOWED_CONTENT_TYPES = ASSETS_ALLOWED_CONTENT_TYPES;
const EXTENSION_MAP = ASSETS_EXTENSION_MAP;

export class AssetsStorageClient extends BaseStorageClient {
  protected readonly bucketType: BucketType = 'assets';
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.STANDARD;

  private domain?: string;
  private maxSizeBytes?: number;

  constructor(config: StorageConfig, options?: AssetsClientOptions) {
    super(config);
    this.domain = options?.domain;
    this.maxSizeBytes = options?.maxSizeBytes;
  }

  private validateSize(body: Buffer | Uint8Array | string): void {
    if (!this.maxSizeBytes) return;

    const size = typeof body === 'string' ? Buffer.byteLength(body) : body.byteLength;
    if (size > this.maxSizeBytes) {
      throw new Error(`File size ${size} bytes exceeds maximum allowed ${this.maxSizeBytes} bytes`);
    }
  }

  async put(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string
  ): Promise<{ path: string }> {
    this.validateSize(body);
    return super.put(key, body, contentType);
  }

  async putWorkspaceLogo(workspaceId: string, body: Buffer | Uint8Array, contentType: string) {
    const ext = this.getExtension(contentType);
    return this.put(`workspaces/${workspaceId}/logo.${ext}`, body, contentType);
  }

  async putAvatar(userId: string, body: Buffer | Uint8Array, contentType: string) {
    const ext = this.getExtension(contentType);
    return this.put(`avatars/${userId}.${ext}`, body, contentType);
  }

  // Public CDN URL - takes stored path from DB, prefixes with domain

  getAssetUrl(path: string): string {
    if (!this.domain) {
      throw new Error('Domain required for public asset URLs');
    }
    return `https://${this.domain}/${path}`;
  }

  getWorkspaceLogoUrl(path: string): string {
    return this.getAssetUrl(path);
  }

  getAvatarUrl(path: string): string {
    return this.getAssetUrl(path);
  }

  private getExtension(contentType: string): string {
    return EXTENSION_MAP[contentType as AssetsContentType] ?? 'png';
  }
}
