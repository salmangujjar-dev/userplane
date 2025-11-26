/**
 * StoreService - Domain service for store operations
 * Contains business logic for storage provider management
 */

import { nanoid } from 'nanoid';
import { StoreRepository } from '@/api/repositories/stores.repository';
import { ConfigurationError, ValidationError } from '@/api/lib/errors';
import { env } from '@/api/env';
import type { StoreProvider, Transaction } from '@/api/types';

export interface StoreServiceDeps {
  storeRepo: StoreRepository;
}

export interface CreateManagedWorkspaceStoreParams {
  workspaceId: string;
  workspaceSlug: string;
  storeTitle: string;
  provider: StoreProvider;
  providerUrl: string;
  providerRegion: string;
  providerBucket: string;
  providerAccessId: string;
  providerAccessKey: string;
}

export interface StoreDto {
  id: string;
  workspaceId: string;
  storeTitle: string;
  provider: StoreProvider;
  providerRegion: string;
  storeIsManaged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StoreService {
  constructor(private deps: StoreServiceDeps) {}

  /**
   * Create workspace store from default env configuration
   * Each workspace gets its own store entry with isolated path
   * Uses default store credentials from environment
   *
   * @param workspaceSlug - Unique workspace slug for path isolation
   * @param workspaceId - Workspace ID for tracking
   * @param storeTitle - Human-readable title for the store
   * @returns Created store
   */
  async createWorkspaceStore(
    workspaceSlug: string,
    workspaceId: string,
    storeTitle: string,
    options?: { tx?: Transaction }
  ) {
    if (
      !env.defaultStore.url ||
      !env.defaultStore.region ||
      !env.defaultStore.bucket ||
      !env.defaultStore.accessId ||
      !env.defaultStore.accessKey
    ) {
      throw new ConfigurationError('Default store configuration not set in environment');
    }

    return this.deps.storeRepo.create(
      {
        id: nanoid(),
        workspaceId,
        storeTitle,
        provider: env.defaultStore.provider,
        providerUrl: env.defaultStore.url,
        providerRegion: env.defaultStore.region,
        providerBucket: env.defaultStore.bucket,
        providerAccessId: env.defaultStore.accessId,
        providerAccessKey: env.defaultStore.accessKey,
        storeIsManaged: true,
      },
      options
    );
  }

  /**
   * Create managed workspace store with user-provided credentials
   * Allows users to bring their own storage (BYOS)
   * Validates credentials before creating store
   *
   * @param params - Store configuration with user credentials
   * @returns Created store
   */
  async createManagedWorkspaceStore(
    params: CreateManagedWorkspaceStoreParams,
    options?: { tx?: Transaction }
  ) {
    // Validate required parameters
    if (
      !params.storeTitle ||
      !params.provider ||
      !params.providerUrl ||
      !params.providerRegion ||
      !params.providerBucket ||
      !params.providerAccessId ||
      !params.providerAccessKey
    ) {
      throw new ValidationError(
        'All store credentials are required: storeTitle, provider, providerUrl, providerRegion, providerBucket, providerAccessId, providerAccessKey'
      );
    }

    // TODO: Test credentials before creating store
    // This should validate that the credentials work by attempting a basic operation
    // For S3/R2: Try listing buckets or objects to verify access
    // Throw ValidationError if credentials are invalid
    await this.testStorageCredentials(params);

    return this.deps.storeRepo.create(
      {
        id: nanoid(),
        workspaceId: params.workspaceId,
        storeTitle: params.storeTitle,
        provider: params.provider,
        providerUrl: params.providerUrl,
        providerRegion: params.providerRegion,
        providerBucket: params.providerBucket,
        providerAccessId: params.providerAccessId,
        providerAccessKey: params.providerAccessKey,
        storeIsManaged: true,
      },
      options
    );
  }

  /**
   * Get store by ID
   */
  async getById(id: string) {
    const store = await this.deps.storeRepo.findById(id);
    if (!store) {
      throw new ConfigurationError('Store not found');
    }
    return store;
  }

  /**
   * Get or create managed store for workspace
   * Returns first managed store if exists, otherwise creates one with default env credentials
   */
  async getOrCreateManagedStore(
    workspaceId: string,
    workspaceSlug: string,
    storeTitle: string,
    options?: { tx?: Transaction }
  ) {
    // Try to get first managed store for workspace directly from DB
    const managedStore = await this.deps.storeRepo.findFirstManagedByWorkspace(workspaceId);

    if (managedStore) {
      return managedStore;
    }

    // No managed store exists, create one
    return this.createWorkspaceStore(workspaceSlug, workspaceId, storeTitle, options);
  }

  /**
   * Get store by ID without credentials
   * Returns store info excluding sensitive credentials
   */
  async getByIdWithoutCredentials(id: string): Promise<StoreDto> {
    const store = await this.getById(id);
    return this.stripCredentials(store);
  }

  /**
   * Get all stores for a workspace without credentials
   */
  async getByWorkspace(workspaceId: string): Promise<StoreDto[]> {
    const stores = await this.deps.storeRepo.findByWorkspace(workspaceId);
    return stores.map((store) => this.stripCredentials(store));
  }

  /**
   * Update store title
   */
  async updateStoreTitle(
    storeId: string,
    newTitle: string,
    options?: { tx?: Transaction }
  ): Promise<StoreDto> {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new ValidationError('Store title cannot be empty');
    }

    const updatedStore = await this.deps.storeRepo.updateTitle(storeId, newTitle, options);
    if (!updatedStore) {
      throw new ConfigurationError('Store not found or update failed');
    }

    return this.stripCredentials(updatedStore);
  }

  /**
   * Strip sensitive credentials from store object
   * Returns only safe fields for API responses
   */
  private stripCredentials(store: any): StoreDto {
    return {
      id: store.id,
      workspaceId: store.workspaceId,
      storeTitle: store.storeTitle,
      provider: store.provider,
      providerRegion: store.providerRegion,
      storeIsManaged: store.storeIsManaged,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }

  /**
   * Test storage credentials by attempting a basic put/get operation
   * TODO: Implement actual credential testing
   *
   * For S3/R2:
   * - Create S3 client with provided credentials
   * - PUT a tiny text payload (e.g., "test-connection") to a test key
   * - GET the same key to verify read access
   * - DELETE the test key to clean up
   * - Verify both read and write permissions work
   *
   * @param params - Store configuration to test
   * @throws ValidationError if credentials are invalid or insufficient permissions
   */
  private async testStorageCredentials(params: CreateManagedWorkspaceStoreParams): Promise<void> {
    // TODO: Implement credential testing with simple get/set
    // Example for R2/S3:
    // const s3Client = new S3Client({
    //   region: 'auto',
    //   endpoint: params.providerUrl,
    //   credentials: {
    //     accessKeyId: params.providerAccessId,
    //     secretAccessKey: params.providerAccessKey,
    //   },
    // });
    //
    // const testKey = `.userplane-test-${Date.now()}`;
    // const testPayload = 'test-connection';
    //
    // try {
    //   // Test PUT - verify write access
    //   await s3Client.send(new PutObjectCommand({
    //     Bucket: 'your-bucket-name',
    //     Key: testKey,
    //     Body: testPayload,
    //   }));
    //
    //   // Test GET - verify read access
    //   const getResponse = await s3Client.send(new GetObjectCommand({
    //     Bucket: 'your-bucket-name',
    //     Key: testKey,
    //   }));
    //   const retrievedData = await getResponse.Body?.transformToString();
    //
    //   if (retrievedData !== testPayload) {
    //     throw new Error('Data mismatch during credential test');
    //   }
    //
    //   // Clean up test object
    //   await s3Client.send(new DeleteObjectCommand({
    //     Bucket: 'your-bucket-name',
    //     Key: testKey,
    //   }));
    // } catch (error) {
    //   throw new ValidationError('Invalid storage credentials or insufficient permissions');
    // }

    // For now, we skip validation
    return Promise.resolve();
  }
}
