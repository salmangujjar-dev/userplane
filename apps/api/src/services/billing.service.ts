/**
 * BillingService - Domain service for billing and subscription operations
 * Contains business logic for DodoPayments integration
 */

import type { DbClient } from '@workspace/db';
import type { SubscriptionStatus } from '@workspace/payments';
import type { PlanId } from '@workspace/pricing';
import { PLAN_IDS, PLAN_NAMES } from '@workspace/pricing';

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
   */
  async handleSubscriptionActive(
    webhookData: SubscriptionWebhookData,
    planId: PlanId,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    // Find existing subscription
    let subscription = await this.deps.subscriptionRepo.findBySubscriptionId(
      webhookData.subscriptionId
    );

    if (!subscription) {
      // Extract workspace ID from metadata
      const workspaceId = webhookData.metadata?.workspace_id || webhookData.metadata?.workspaceId;
      if (!workspaceId) {
        throw new Error('Workspace ID not found in subscription metadata');
      }

      // Create new subscription
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

    // Update subscription status
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

    // Update workspace plan
    await this.updateWorkspacePlan(subscription.workspaceId, planId, {
      tx: dbClient as Transaction,
    });

    // Update workspace dodoCustomerId if not set
    await this.updateWorkspaceCustomerId(subscription.workspaceId, webhookData.customerId, {
      tx: dbClient as Transaction,
    });

    return subscription;
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
   */
  async handleSubscriptionPlanChanged(
    webhookData: SubscriptionWebhookData,
    newPlanId: PlanId,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    // Update subscription
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

    if (subscription) {
      // Update workspace plan
      await this.updateWorkspacePlan(subscription.workspaceId, newPlanId, {
        tx: dbClient as Transaction,
      });
    }

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

    // Downgrade workspace to free plan
    if (subscription) {
      await this.updateWorkspacePlan(subscription.workspaceId, 'free', {
        tx: dbClient as Transaction,
      });
    }

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

    // Downgrade workspace to free plan
    if (subscription) {
      await this.updateWorkspacePlan(subscription.workspaceId, 'free', {
        tx: dbClient as Transaction,
      });
    }

    return subscription;
  }

  /**
   * Update workspace plan
   * Also updates entitlements based on new plan
   */
  private async updateWorkspacePlan(
    workspaceId: string,
    planId: PlanId,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.deps.db;

    // Validate plan ID
    if (!PLAN_IDS.includes(planId)) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Update workspace plan directly via raw query since workspaceRepo
    // doesn't have a dedicated method for this
    const { workspaces } = await import('@workspace/db');
    const { eq } = await import('@workspace/db');

    await (dbClient as DbClient)
      .update(workspaces)
      .set({ workspacePlan: planId })
      .where(eq(workspaces.workspaceId, workspaceId));

    return { workspaceId, planId };
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
