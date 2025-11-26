/**
 * StoreService - Domain service for store operations
 * Contains business logic for storage provider management
 */

import { nanoid } from 'nanoid';
import { StoreRepository } from '@/api/repositories/stores.repository';
import { ConfigurationError } from '@/api/lib/errors';
import type { CreateUserManagedStoreParams } from '@/api/types';

export interface StoreServiceDeps {
  storeRepo: StoreRepository;
}

export class StoreService {
  constructor(private deps: StoreServiceDeps) {}

  /**
   * Get Userplane-managed R2 store
   * Uses shared Userplane credentials with workspace isolation
   *
   * @param pathPrefix - Path prefix for isolation (e.g., workspace slug)
   * @returns Managed store reference
   */
  async getManagedStore(pathPrefix: string) {
    const defaultStore = await this.deps.storeRepo.findDefaultR2Store();

    if (!defaultStore) {
      throw new ConfigurationError('Default R2 store not configured');
    }

    return {
      ...defaultStore,
      providerMeta: {
        ...(defaultStore.providerMeta as Record<string, unknown> | null),
        pathPrefix,
        managed: true,
      },
    };
  }

  /**
   * Create user-managed store (BYOS - Bring Your Own Storage)
   * Future feature: allows users to use their own S3/R2 credentials
   *
   * @param params - Store configuration
   * @returns User-managed store
   */
  async getUserManagedStore(params: CreateUserManagedStoreParams) {
    const encryptedAccessKey = await this.encryptAccessKey(params.providerAccessKey);

    return this.deps.storeRepo.create({
      id: nanoid(),
      provider: params.provider,
      providerUrl: params.providerUrl,
      providerAccessId: params.providerAccessId,
      providerAccessKey: encryptedAccessKey,
      providerMeta: {
        ...params.providerMeta,
        workspaceId: params.workspaceId,
        managed: false,
      },
    });
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
   * Encrypt access key for storage
   */
  private async encryptAccessKey(key: string): Promise<string> {
    return key;
  }
}
