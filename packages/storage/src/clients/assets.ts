import { BaseStorageClient } from '../base';
import {
  buildTransformUrl,
  DEFAULT_IMAGE_ZONE,
  type TransformOptions,
  type TransformProfile,
} from '../media';
import type { AssetsClientOptions, StorageConfig } from '../types';
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

/**
 * Options for getting an asset URL with transforms
 */
export interface GetAssetUrlOptions {
  /** Custom transform options (overrides default profile) */
  transform?: TransformOptions | TransformProfile;
  /** Skip transforms for this request */
  skipTransform?: boolean;
}

export class AssetsStorageClient extends BaseStorageClient {
  protected readonly allowedContentTypes = ALLOWED_CONTENT_TYPES;
  protected readonly cacheControl = CacheControl.STANDARD;

  private domain?: string;
  private maxSizeBytes?: number;
  private imageZone: string;
  private skipTransform: boolean;

  constructor(config: StorageConfig, options?: AssetsClientOptions) {
    super(config, 'assets');
    this.domain = options?.domain;
    this.maxSizeBytes = options?.maxSizeBytes;
    this.imageZone = options?.imageZone ?? DEFAULT_IMAGE_ZONE;
    this.skipTransform = options?.skipTransform ?? false;
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

  /**
   * Get the raw CDN URL for an asset (no transforms)
   */
  private getRawUrl(path: string): string {
    if (!this.domain) {
      throw new Error('Domain required for public asset URLs');
    }
    return `https://${this.domain}/${path}`;
  }

  /**
   * Apply transforms to a URL
   */
  private applyTransforms(
    rawUrl: string,
    defaultProfile: TransformProfile,
    options?: GetAssetUrlOptions
  ): string {
    // Skip transforms if globally disabled or per-request disabled
    if (this.skipTransform || options?.skipTransform) {
      return rawUrl;
    }

    // Use custom transform if provided, otherwise use default profile
    const transform = options?.transform ?? defaultProfile;

    return buildTransformUrl(this.imageZone, rawUrl, transform);
  }

  /**
   * Get CDN URL for a generic asset
   * @param path - Asset path from storage
   * @param options - Transform options
   */
  getAssetUrl(path: string, options?: GetAssetUrlOptions): string {
    const rawUrl = this.getRawUrl(path);

    // Skip transforms if no options provided (backward compatible)
    if (!options && this.skipTransform) {
      return rawUrl;
    }

    // Apply general profile by default if transforms enabled
    if (!options && !this.skipTransform) {
      return this.applyTransforms(rawUrl, 'general', options);
    }

    return this.applyTransforms(rawUrl, 'general', options);
  }

  /**
   * Get CDN URL for a workspace logo with avatar transforms
   * @param path - Workspace logo path from storage
   * @param options - Transform options (defaults to avatar profile)
   */
  getWorkspaceLogoUrl(path: string, options?: GetAssetUrlOptions): string {
    const rawUrl = this.getRawUrl(path);
    return this.applyTransforms(rawUrl, 'avatar', options);
  }

  /**
   * Get CDN URL for a user avatar with avatar transforms
   * @param path - Avatar path from storage
   * @param options - Transform options (defaults to avatar profile)
   */
  getAvatarUrl(path: string, options?: GetAssetUrlOptions): string {
    const rawUrl = this.getRawUrl(path);
    return this.applyTransforms(rawUrl, 'avatar', options);
  }

  private getExtension(contentType: string): string {
    return EXTENSION_MAP[contentType as AssetsContentType] ?? 'png';
  }
}
