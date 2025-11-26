/**
 * StoreRepository - Data access layer for stores
 * Handles all database operations for store entities
 */

import { eq, and, sql } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { stores } from '@workspace/db';
import type { CreateStoreInput } from '@/api/types';

export class StoreRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new store
   */
  async create(data: CreateStoreInput) {
    const [store] = await this.db
      .insert(stores)
      .values({
        id: data.id,
        provider: data.provider,
        providerUrl: data.providerUrl,
        providerAccessId: data.providerAccessId,
        providerAccessKey: data.providerAccessKey,
        providerMeta: data.providerMeta,
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
   * Find default R2 store (managed by Userplane)
   */
  async findDefaultR2Store() {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(
        and(
          eq(stores.provider, 'r2'),
          eq(stores.isDeleted, false),
          sql`${stores.providerMeta}->>'isDefault' = 'true'`
        )
      )
      .limit(1);

    return store || null;
  }
}
