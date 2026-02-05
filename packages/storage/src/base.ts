import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type {
  BucketCredentials,
  BucketType,
  PresignedUrlOptions,
  StorageConfig,
  UploadPresignOptions,
} from './types';

export abstract class BaseStorageClient {
  protected client: S3Client;
  protected bucket: string;

  protected readonly bucketType: BucketType;
  protected abstract readonly allowedContentTypes: readonly string[];
  protected abstract readonly cacheControl: string;

  constructor(config: StorageConfig, bucketType: BucketType) {
    this.bucketType = bucketType;
    const credentials = this.resolveCredentials(config);
    this.client = this.createClient(credentials);
    this.bucket = credentials.bucketName;
  }

  private resolveCredentials(config: StorageConfig): BucketCredentials {
    const bucketConfig = config[this.bucketType];
    if (!bucketConfig) {
      throw new Error(`${this.bucketType} bucket config required`);
    }
    return bucketConfig;
  }

  private createClient(creds: BucketCredentials): S3Client {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${creds.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      },
    });
  }

  /**
   * Resolve a key to its full storage path
   * key = input identifier (e.g., "abc123.webm")
   * path = full storage path (stored in DB, used for download)
   */
  protected resolvePath(key: string): string {
    return key.startsWith('/') ? key.slice(1) : key;
  }

  protected validateContentType(contentType: string): void {
    const baseType = contentType.split(';')[0]?.trim() ?? '';
    if (!this.allowedContentTypes.includes(baseType)) {
      throw new Error(
        `Content-Type "${contentType}" not allowed. Allowed: ${this.allowedContentTypes.join(', ')}`
      );
    }
  }

  /**
   * Get presigned upload URL
   * Returns { url, path } where path should be stored in database
   */
  async getUploadUrl(
    key: string,
    options: UploadPresignOptions
  ): Promise<{ url: string; path: string }> {
    this.validateContentType(options.contentType);
    const path = this.resolvePath(key);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      ContentType: options.contentType,
      ContentLength: options.contentLength,
      CacheControl: this.cacheControl,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 300,
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    return { url, path };
  }

  /**
   * Get presigned download URL for a stored object
   * Takes the path as stored in the database (returned from getUploadUrl)
   * Subclasses should expose their own getXDownloadUrl methods that wrap this
   */
  protected async getDownloadUrl(path: string, options: PresignedUrlOptions = {}): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 300,
    });
  }

  /**
   * Put object directly (without presigned URL)
   * Returns { path } where path should be stored in database
   */
  async put(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string
  ): Promise<{ path: string }> {
    this.validateContentType(contentType);
    const path = this.resolvePath(key);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: body,
      ContentType: contentType,
      CacheControl: this.cacheControl,
    });

    await this.client.send(command);
    return { path };
  }

  /**
   * Delete object by its stored path
   */
  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.client.send(command);
  }

  /**
   * Check if object exists and get its metadata
   * Returns null if object does not exist
   */
  async head(path: string): Promise<{ contentLength: number; contentType?: string } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      const response = await this.client.send(command);
      return {
        contentLength: response.ContentLength ?? 0,
        contentType: response.ContentType,
      };
    } catch (error: unknown) {
      // NotFound error means object doesn't exist
      if (error instanceof Error && error.name === 'NotFound') {
        return null;
      }
      throw error;
    }
  }
}
