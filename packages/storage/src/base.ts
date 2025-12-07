import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageProfile,
  BucketType,
  StorageConfig,
  PresignedUrlOptions,
  UploadPresignOptions,
  BucketCredentials,
} from './types';

export abstract class BaseStorageClient {
  protected profile: StorageProfile;
  protected client: S3Client;
  protected bucket: string;
  protected basePrefix: string;

  protected abstract readonly bucketType: BucketType;
  protected abstract readonly allowedContentTypes: readonly string[];
  protected abstract readonly cacheControl: string;

  constructor(config: StorageConfig) {
    this.profile = config.profile;
    const resolved = this.resolveCredentials(config);
    this.client = this.createClient(resolved.credentials);
    this.bucket = resolved.bucket;
    this.basePrefix = resolved.prefix;
  }

  private resolveCredentials(config: StorageConfig): {
    credentials: BucketCredentials;
    bucket: string;
    prefix: string;
  } {
    if (config.profile === 'development') {
      if (!config.dev) {
        throw new Error('Dev config required for development profile');
      }
      return {
        credentials: config.dev,
        bucket: config.dev.bucketName,
        prefix: `${this.bucketType}/`,
      };
    }

    const bucketConfig = config[this.bucketType];
    if (!bucketConfig) {
      throw new Error(`${this.bucketType} config required for ${config.profile} profile`);
    }

    return {
      credentials: bucketConfig,
      bucket: bucketConfig.bucketName,
      prefix: config.profile === 'staging' ? 'staging/' : '',
    };
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

  protected resolveKey(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.basePrefix}${normalizedPath}`;
  }

  protected validateContentType(contentType: string): void {
    const baseType = contentType.split(';')[0]?.trim() ?? '';
    if (!this.allowedContentTypes.includes(baseType)) {
      throw new Error(
        `Content-Type "${contentType}" not allowed. Allowed: ${this.allowedContentTypes.join(', ')}`
      );
    }
  }

  async getUploadUrl(
    path: string,
    options: UploadPresignOptions
  ): Promise<{ url: string; key: string }> {
    this.validateContentType(options.contentType);
    const key = this.resolveKey(path);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options.contentType,
      ContentLength: options.contentLength,
      CacheControl: this.cacheControl,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 300,
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    return { url, key };
  }

  async getDownloadUrl(path: string, options: PresignedUrlOptions = {}): Promise<string> {
    const key = this.resolveKey(path);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn ?? 300,
    });
  }

  async put(
    path: string,
    body: Buffer | Uint8Array | string,
    contentType: string
  ): Promise<{ key: string }> {
    this.validateContentType(contentType);
    const key = this.resolveKey(path);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: this.cacheControl,
    });

    await this.client.send(command);
    return { key };
  }

  async delete(path: string): Promise<void> {
    const key = this.resolveKey(path);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }
}
