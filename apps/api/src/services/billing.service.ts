/**
 * BillingService - Domain service for billing and subscription operations
 * Contains business logic for DodoPayments integration
 *
 * Note: Plan changes (upgrade/downgrade) are handled via the DodoPayments
 * Customer Portal, which provides a native self-service experience.
 * See: https://docs.dodopayments.com/features/customer-portal
 *
 * Error handling: Throws contract errors directly (billingError.*)
 * This ensures type safety and keeps contract/API in sync.
 */

import { billingError } from '@workspace/contract';
import type { DbClient } from '@workspace/db';
import type { SubscriptionStatus } from '@workspace/payments';
import type { PlanId } from '@workspace/pricing';
import { PLAN_NAMES } from '@workspace/pricing';

import type {
  CreateSubscriptionData,
  SubscriptionRepository,
  UpdateSubscriptionData,
} from '@/api/repositories/subscriptions.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { Transaction } from '@/api/types';

import { generateSubscriptionId } from '../lib/id';

export interface BillingServiceDeps {
  subscriptionRepo: SubscriptionRepository;
  workspaceRepo: WorkspaceRepository;
  db: DbClient;
}

export interface CreateSubscriptionParams {
  workspaceId: string;
  customerId: string;
  subscriptionId: string;
  productId: string;
  planId: PlanId;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface SubscriptionWebhookData {
  subscriptionId: string;
  customerId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date | null;
  metadata?: Record<string, string>;
}

export class BillingService {
  constructor(private deps: BillingServiceDeps) {}

  /**
   * Create a new subscription for a workspace
   */
  async createSubscription(params: CreateSubscriptionParams, options?: { tx?: Transaction }) {
    const data: CreateSubscriptionData = {
      id: generateSubscriptionId(),
      workspaceId: params.workspaceId,
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      productId: params.productId,
      planId: params.planId,
      status: 'pending',
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
    };

    return this.deps.subscriptionRepo.create(data, options);
  }

  /**
   * Get subscription by workspace ID
   */
  async getSubscriptionByWorkspaceId(workspaceId: string) {
    return this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
  }

  /**
   * Get subscription by DodoPayments subscription ID
   */
  async getSubscriptionBySubscriptionId(subscriptionId: string) {
    return this.deps.subscriptionRepo.findBySubscriptionId(subscriptionId);
  }

  /**
   * Check if workspace has an active subscription
   */
  async hasActiveSubscription(workspaceId: string): Promise<boolean> {
    return this.deps.subscriptionRepo.hasActiveSubscription(workspaceId);
  }

  /**
   * Handle subscription activation from webhook
   * Updates subscription status and workspace plan
   *
   * IMPORTANT: Uses upsert logic to handle race conditions:
   * - First tries to find by DodoPayments subscription ID
   * - If not found, checks if workspace already has a subscription (different subscription ID)
   * - Updates existing subscription or creates new one as appropriate
   *
   * This handles the case where:
   * 1. User upgrades/downgrades plan (new subscription ID, same workspace)
   * 2. Webhook arrives before our DB is updated
   * 3. Multiple webhooks arrive for same subscription
   */
  async handleSubscriptionActive(
    webhookData: SubscriptionWebhookData,
    planId: PlanId,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    // Extract workspace ID from metadata
    const workspaceId = webhookData.metadata?.workspace_id || webhookData.metadata?.workspaceId;

    // First, try to find by DodoPayments subscription ID
    let subscription = await this.deps.subscriptionRepo.findBySubscriptionId(
      webhookData.subscriptionId
    );

    if (!subscription) {
      // Subscription not found by ID - check if workspace already has a subscription
      if (!workspaceId) {
        throw billingError.SUBSCRIPTION_NOT_FOUND();
      }

      const existingWorkspaceSubscription =
        await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

      if (existingWorkspaceSubscription) {
        // Workspace already has a subscription - this is likely a plan change
        // Update the existing subscription with the new DodoPayments subscription ID
        subscription = await this.deps.subscriptionRepo.updateByWorkspaceId(
          workspaceId,
          {
            status: 'active',
            planId,
            productId: webhookData.productId,
            currentPeriodStart: webhookData.currentPeriodStart,
            currentPeriodEnd: webhookData.currentPeriodEnd,
          },
          { tx: dbClient as Transaction }
        );

        // Also update the subscription ID to the new one
        if (subscription) {
          await this.updateSubscriptionId(
            subscription.id,
            webhookData.subscriptionId,
            webhookData.customerId,
            { tx: dbClient as Transaction }
          );
        }
      } else {
        // No existing subscription for this workspace - create new one
        subscription = await this.createSubscription(
          {
            workspaceId,
            customerId: webhookData.customerId,
            subscriptionId: webhookData.subscriptionId,
            productId: webhookData.productId,
            planId,
            currentPeriodStart: webhookData.currentPeriodStart,
            currentPeriodEnd: webhookData.currentPeriodEnd,
          },
          { tx: dbClient as Transaction }
        );
      }
    } else {
      // Found by subscription ID - just update the status and details
      const updateData: UpdateSubscriptionData = {
        status: 'active',
        planId,
        productId: webhookData.productId,
        currentPeriodStart: webhookData.currentPeriodStart,
        currentPeriodEnd: webhookData.currentPeriodEnd,
      };

      await this.deps.subscriptionRepo.updateBySubscriptionId(
        webhookData.subscriptionId,
        updateData,
        { tx: dbClient as Transaction }
      );
    }

    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    // Update workspace dodoCustomerId if not set
    await this.updateWorkspaceCustomerId(subscription.workspaceId, webhookData.customerId, {
      tx: dbClient as Transaction,
    });

    return subscription;
  }

  /**
   * Update the DodoPayments subscription ID for an existing subscription
   * Used when a plan change results in a new subscription ID
   */
  private async updateSubscriptionId(
    id: string,
    newSubscriptionId: string,
    customerId: string,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    const { subscriptions } = await import('@workspace/db');
    const { eq } = await import('@workspace/db');

    await (dbClient as DbClient)
      .update(subscriptions)
      .set({
        subscriptionId: newSubscriptionId,
        customerId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));
  }

  /**
   * Handle subscription update from webhook
   */
  async handleSubscriptionUpdated(
    webhookData: SubscriptionWebhookData,
    planId?: PlanId,
    options?: { tx?: Transaction }
  ) {
    const updateData: UpdateSubscriptionData = {
      status: webhookData.status,
      currentPeriodStart: webhookData.currentPeriodStart,
      currentPeriodEnd: webhookData.currentPeriodEnd,
    };

    if (planId) {
      updateData.planId = planId;
      updateData.productId = webhookData.productId;
    }

    return this.deps.subscriptionRepo.updateBySubscriptionId(
      webhookData.subscriptionId,
      updateData,
      options
    );
  }

  /**
   * Handle subscription renewal from webhook
   */
  async handleSubscriptionRenewed(
    webhookData: SubscriptionWebhookData,
    options?: { tx?: Transaction }
  ) {
    return this.deps.subscriptionRepo.updateBySubscriptionId(
      webhookData.subscriptionId,
      {
        status: 'active',
        currentPeriodStart: webhookData.currentPeriodStart,
        currentPeriodEnd: webhookData.currentPeriodEnd,
      },
      options
    );
  }

  /**
   * Handle subscription plan change from webhook
   * Plan changes are initiated via the DodoPayments Customer Portal
   */
  async handleSubscriptionPlanChanged(
    webhookData: SubscriptionWebhookData,
    newPlanId: PlanId,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    const subscription = await this.deps.subscriptionRepo.updateBySubscriptionId(
      webhookData.subscriptionId,
      {
        planId: newPlanId,
        productId: webhookData.productId,
        currentPeriodStart: webhookData.currentPeriodStart,
        currentPeriodEnd: webhookData.currentPeriodEnd,
      },
      { tx: dbClient as Transaction }
    );

    return subscription;
  }

  /**
   * Handle subscription cancellation from webhook
   */
  async handleSubscriptionCancelled(
    webhookData: SubscriptionWebhookData,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    const subscription = await this.deps.subscriptionRepo.updateBySubscriptionId(
      webhookData.subscriptionId,
      {
        status: 'cancelled',
        cancelledAt: webhookData.cancelledAt || new Date(),
      },
      { tx: dbClient as Transaction }
    );

    return subscription;
  }

  /**
   * Handle subscription on hold from webhook
   */
  async handleSubscriptionOnHold(
    webhookData: SubscriptionWebhookData,
    options?: { tx?: Transaction }
  ) {
    return this.deps.subscriptionRepo.updateBySubscriptionId(
      webhookData.subscriptionId,
      {
        status: 'on_hold',
      },
      options
    );
  }

  /**
   * Handle subscription failure from webhook
   */
  async handleSubscriptionFailed(
    webhookData: SubscriptionWebhookData,
    options?: { tx?: Transaction }
  ) {
    return this.deps.subscriptionRepo.updateBySubscriptionId(
      webhookData.subscriptionId,
      {
        status: 'failed',
      },
      options
    );
  }

  /**
   * Handle subscription expiration from webhook
   */
  async handleSubscriptionExpired(
    webhookData: SubscriptionWebhookData,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    const subscription = await this.deps.subscriptionRepo.updateBySubscriptionId(
      webhookData.subscriptionId,
      {
        status: 'expired',
      },
      { tx: dbClient as Transaction }
    );

    return subscription;
  }

  /**
   * Update workspace DodoPayments customer ID
   */
  private async updateWorkspaceCustomerId(
    workspaceId: string,
    customerId: string,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    const { workspaces } = await import('@workspace/db');
    const { eq } = await import('@workspace/db');

    await (dbClient as DbClient)
      .update(workspaces)
      .set({ dodoCustomerId: customerId })
      .where(eq(workspaces.workspaceId, workspaceId));
  }

  /**
   * Get subscription status summary for a workspace
   */
  async getSubscriptionStatus(workspaceId: string) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      return {
        hasSubscription: false,
        status: null,
        planId: null,
        planName: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const planId = subscription.planId as PlanId;

    return {
      hasSubscription: true,
      status: subscription.status,
      planId,
      planName: PLAN_NAMES[planId] || 'Unknown',
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }
}
