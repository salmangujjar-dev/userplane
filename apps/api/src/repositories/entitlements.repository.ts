/**
 * EntitlementRepository - Data access layer for entitlements
 * Handles all database operations for entitlement entities including
 * CRUD operations, atomic consumption tracking, and batch provisioning
 */

import type { DbClient } from '@workspace/db';
import { and, eq, inArray, sql } from '@workspace/db';
import { entitlements } from '@workspace/db';
import { type BillingCadence, PERIOD_BASED_RESOURCES, type ResourceType } from '@workspace/pricing';

import { generateEntitlementId } from '@/api/lib/id';
import type { Transaction } from '@/api/types';

export interface CreateEntitlementData {
  workspaceId: string;
  resourceType: ResourceType;
  quotedLimit: number;
  actualLimit: number;
  resourceConsumed?: number;
}

export interface EntitlementData {
  resourceType: ResourceType;
  quotedLimit: number;
  actualLimit: number;
  billingCadence?: BillingCadence | null;
}

export class EntitlementRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new entitlement
   */
  async create(data: CreateEntitlementData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [entitlement] = await dbClient
      .insert(entitlements)
      .values({
        id: generateEntitlementId(),
        workspaceId: data.workspaceId,
        resourceType: data.resourceType,
        quotedLimit: data.quotedLimit,
        actualLimit: data.actualLimit,
        resourceConsumed: data.resourceConsumed ?? 0,
      })
      .returning();

    if (!entitlement) {
      throw new Error('Failed to create entitlement');
    }

    return entitlement;
  }

  /**
   * Find all entitlements by workspace ID
   * Naturally bounded: fixed set of ~5 resource types per workspace
   */
  async findByWorkspaceId(workspaceId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    return dbClient
      .select()
      .from(entitlements)
      .where(and(eq(entitlements.workspaceId, workspaceId), eq(entitlements.isDeleted, false)));
  }

  /**
   * Find entitlement by workspace and resource type
   */
  async findByWorkspaceAndResource(
    workspaceId: string,
    resourceType: ResourceType,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [entitlement] = await dbClient
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.workspaceId, workspaceId),
          eq(entitlements.resourceType, resourceType),
          eq(entitlements.isDeleted, false)
        )
      )
      .limit(1);

    return entitlement || null;
  }

  /**
   * Upsert many entitlements for a workspace (for provisioning)
   * Creates new entitlements or updates existing ones in a single batch query.
   * Preserves resourceConsumed when updating (for plan changes)
   */
  async upsertMany(
    workspaceId: string,
    entitlementData: EntitlementData[],
    options?: { tx?: Transaction; preserveConsumed?: boolean }
  ) {
    if (entitlementData.length === 0) return [];

    const dbClient = options?.tx || this.db;
    const preserveConsumed = options?.preserveConsumed ?? true;

    const values = entitlementData.map((data) => ({
      id: generateEntitlementId(),
      workspaceId,
      resourceType: data.resourceType,
      quotedLimit: data.quotedLimit,
      actualLimit: data.actualLimit,
      resourceConsumed: 0,
      ...(data.billingCadence !== undefined && { billingCadence: data.billingCadence }),
    }));

    return dbClient
      .insert(entitlements)
      .values(values)
      .onConflictDoUpdate({
        target: [entitlements.workspaceId, entitlements.resourceType],
        set: {
          quotedLimit: sql`excluded.quoted_limit`,
          actualLimit: sql`excluded.actual_limit`,
          billingCadence: sql`excluded.billing_cadence`,
          resourceConsumed: preserveConsumed ? sql`${entitlements.resourceConsumed}` : sql`0`,
          updatedAt: new Date(),
        },
      })
      .returning();
  }

  /**
   * Soft delete all entitlements for a workspace
   */
  async deleteByWorkspaceId(workspaceId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    return dbClient
      .update(entitlements)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(entitlements.workspaceId, workspaceId), eq(entitlements.isDeleted, false)))
      .returning();
  }

  /**
   * Atomic check-and-increment: only increments if the new total stays within effectiveLimit.
   * Returns the updated row if allowed, null if the limit would be exceeded (zero rows matched).
   */
  async consumeIfAllowed(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number,
    effectiveLimit: number,
    options?: { tx?: Transaction }
  ) {
    if (amount <= 0) throw new Error('amount must be positive');

    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(entitlements)
      .set({
        resourceConsumed: sql`${entitlements.resourceConsumed} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entitlements.workspaceId, workspaceId),
          eq(entitlements.resourceType, resourceType),
          eq(entitlements.isDeleted, false),
          sql`${entitlements.resourceConsumed} + ${amount} <= ${effectiveLimit}`
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Atomically increment resource consumption
   * Uses SQL-level increment to prevent race conditions
   */
  async incrementConsumed(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1,
    options?: { tx?: Transaction }
  ) {
    if (amount <= 0) throw new Error('amount must be positive');
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(entitlements)
      .set({
        resourceConsumed: sql`${entitlements.resourceConsumed} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entitlements.workspaceId, workspaceId),
          eq(entitlements.resourceType, resourceType),
          eq(entitlements.isDeleted, false)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Atomically decrement resource consumption
   * Uses SQL-level decrement to prevent race conditions
   * Will not go below 0
   */
  async decrementConsumed(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1,
    options?: { tx?: Transaction }
  ) {
    if (amount <= 0) throw new Error('amount must be positive');
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(entitlements)
      .set({
        resourceConsumed: sql`GREATEST(${entitlements.resourceConsumed} - ${amount}, 0)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entitlements.workspaceId, workspaceId),
          eq(entitlements.resourceType, resourceType),
          eq(entitlements.isDeleted, false)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Reset consumed resources for a workspace
   * If resourceType is provided, only resets that resource
   * Otherwise resets all resources
   */
  async resetConsumed(
    workspaceId: string,
    resourceType?: ResourceType,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const conditions = [
      eq(entitlements.workspaceId, workspaceId),
      eq(entitlements.isDeleted, false),
    ];

    if (resourceType) {
      conditions.push(eq(entitlements.resourceType, resourceType));
    }

    return dbClient
      .update(entitlements)
      .set({
        resourceConsumed: 0,
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning();
  }

  /**
   * Reset period-based resources (recordings, screenshots, files)
   * Called on subscription renewal
   *
   * Period-based resources are measured per billing cycle and reset to 0 when the subscription renews.
   * Lifetime resources (seats, links) are NOT reset as they accumulate over the subscription lifetime.
   */
  async resetPeriodResources(workspaceId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    return dbClient
      .update(entitlements)
      .set({
        resourceConsumed: 0,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entitlements.workspaceId, workspaceId),
          eq(entitlements.isDeleted, false),
          inArray(entitlements.resourceType, [...PERIOD_BASED_RESOURCES])
        )
      )
      .returning();
  }

  /**
   * Update limits for a specific entitlement
   */
  async updateLimits(
    workspaceId: string,
    resourceType: ResourceType,
    limits: { quotedLimit: number; actualLimit: number },
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(entitlements)
      .set({
        quotedLimit: limits.quotedLimit,
        actualLimit: limits.actualLimit,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entitlements.workspaceId, workspaceId),
          eq(entitlements.resourceType, resourceType),
          eq(entitlements.isDeleted, false)
        )
      )
      .returning();

    return updated || null;
  }
}
