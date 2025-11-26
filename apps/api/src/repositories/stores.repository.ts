/**
 * StoreRepository - Data access layer for stores
 * Handles all database operations for store entities
 */

import { eq, and } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { stores } from '@workspace/db';
import type { CreateStoreInput, Transaction } from '@/api/types';

export class StoreRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new store
   */
  async create(data: CreateStoreInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [store] = await dbClient
      .insert(stores)
      .values({
        id: data.id,
        workspaceId: data.workspaceId,
        storeTitle: data.storeTitle,
        provider: data.provider,
        providerUrl: data.providerUrl,
        providerRegion: data.providerRegion,
        providerBucket: data.providerBucket,
        providerAccessId: data.providerAccessId,
        providerAccessKey: data.providerAccessKey,
        storeIsManaged: data.storeIsManaged,
        isDeleted: false,
      })
      .returning();

    return store;
  }

  /**
   * Find store by ID
   */
  async findById(id: string) {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(and(eq(stores.id, id), eq(stores.isDeleted, false)))
      .limit(1);

    return store || null;
  }

  /**
   * Find all stores by workspace ID
   */
  async findByWorkspace(workspaceId: string) {
    return this.db
      .select()
      .from(stores)
      .where(and(eq(stores.workspaceId, workspaceId), eq(stores.isDeleted, false)));
  }

  /**
   * Find first managed store by workspace ID
   */
  async findFirstManagedByWorkspace(workspaceId: string) {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(
        and(
          eq(stores.workspaceId, workspaceId),
          eq(stores.storeIsManaged, true),
          eq(stores.isDeleted, false)
        )
      )
      .limit(1);

    return store || null;
  }

  /**
   * Update store title
   */
  async updateTitle(id: string, title: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(stores)
      .set({ storeTitle: title })
      .where(and(eq(stores.id, id), eq(stores.isDeleted, false)))
      .returning();

    return updated || null;
  }
}
