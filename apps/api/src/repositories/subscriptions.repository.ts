/**
 * SubscriptionRepository - Data access layer for subscriptions
 * Handles all database operations for subscription entities
 */

import { FeatureGatesSchema } from '@workspace/contract';
import type { DbClient } from '@workspace/db';
import { eq } from '@workspace/db';
import { subscriptions, workspaces } from '@workspace/db';
import type { PlanFeatureGates, PlanId } from '@workspace/pricing';

import { createLogger } from '@/api/lib/logger';
import type { Transaction } from '@/api/types';

const logger = createLogger('subscription-repository');

export interface CreateSubscriptionData {
  id: string;
  workspaceId: string;
  customerId: string;
  subscriptionId: string;
  productId: string;
  planId: PlanId;
  status: 'pending' | 'active' | 'on_hold' | 'cancelled' | 'failed' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  featureGates: PlanFeatureGates;
}

export interface UpdateSubscriptionData {
  status?: 'pending' | 'active' | 'on_hold' | 'cancelled' | 'failed' | 'expired';
  planId?: PlanId;
  productId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelledAt?: Date | null;
  cancelAtPeriodEnd?: boolean;
  lastWebhookId?: string;
  lastWebhookTimestamp?: Date;
  featureGates?: PlanFeatureGates;
}

export class SubscriptionRepository {
  constructor(private db: DbClient) {}

  private parseFeatureGates(raw: unknown): PlanFeatureGates | null {
    if (!raw) return null;
    const result = FeatureGatesSchema.safeParse(raw);
    if (!result.success) {
      logger.warn({ errors: result.error.errors }, 'Invalid featureGates in subscription');
      return null;
    }
    return result.data;
  }

  private transformSubscription<T extends { featureGates: unknown }>(
    row: T
  ): Omit<T, 'featureGates'> & { featureGates: PlanFeatureGates | null } {
    return {
      ...row,
      featureGates: this.parseFeatureGates(row.featureGates),
    };
  }

  /**
   * Create a new subscription
   */
  async create(data: CreateSubscriptionData, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [subscription] = await dbClient
      .insert(subscriptions)
      .values({
        id: data.id,
        workspaceId: data.workspaceId,
        customerId: data.customerId,
        subscriptionId: data.subscriptionId,
        productId: data.productId,
        planId: data.planId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        featureGates: data.featureGates,
      })
      .returning();

    if (!subscription) {
      throw new Error('Failed to create subscription');
    }

    return this.transformSubscription(subscription);
  }

  /**
   * Find subscription by workspace ID
   */
  async findByWorkspaceId(workspaceId: string) {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.workspaceId, workspaceId))
      .limit(1);

    return subscription ? this.transformSubscription(subscription) : null;
  }

  /**
   * Find subscription by DodoPayments subscription ID
   */
  async findBySubscriptionId(subscriptionId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [subscription] = await dbClient
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1);

    return subscription ? this.transformSubscription(subscription) : null;
  }

  /**
   * Find subscription by DodoPayments customer ID
   */
  async findByCustomerId(customerId: string) {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerId, customerId))
      .limit(1);

    return subscription ? this.transformSubscription(subscription) : null;
  }

  /**
   * Update subscription by DodoPayments subscription ID
   */
  async updateBySubscriptionId(
    subscriptionId: string,
    data: UpdateSubscriptionData,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .returning();

    return updated ? this.transformSubscription(updated) : null;
  }

  /**
   * Update subscription by workspace ID
   */
  async updateByWorkspaceId(
    workspaceId: string,
    data: UpdateSubscriptionData,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.workspaceId, workspaceId))
      .returning();

    return updated ? this.transformSubscription(updated) : null;
  }

  /**
   * Delete subscription by workspace ID
   */
  async deleteByWorkspaceId(workspaceId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .delete(subscriptions)
      .where(eq(subscriptions.workspaceId, workspaceId))
      .returning();

    return deleted ? this.transformSubscription(deleted) : null;
  }

  /**
   * Find subscription with workspace details
   */
  async findWithWorkspace(subscriptionId: string) {
    const result = await this.db
      .select({
        subscription: subscriptions,
        workspace: {
          workspaceId: workspaces.workspaceId,
          workspaceName: workspaces.workspaceName,
          dodoCustomerId: workspaces.dodoCustomerId,
        },
      })
      .from(subscriptions)
      .innerJoin(workspaces, eq(subscriptions.workspaceId, workspaces.workspaceId))
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1);

    if (!result[0]) return null;

    return {
      subscription: this.transformSubscription(result[0].subscription),
      workspace: result[0].workspace,
    };
  }
}
