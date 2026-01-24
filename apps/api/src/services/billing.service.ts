/**
 * BillingService - Domain service for billing and subscription operations
 *
 * Provides read-only operations for subscription status.
 * Webhook processing is handled by WebhookProcessorService.
 *
 * Note: Plan changes (upgrade/downgrade) are handled via the DodoPayments
 * Customer Portal, which provides a native self-service experience.
 * See: https://docs.dodopayments.com/features/customer-portal
 */

import type { PlanId } from '@workspace/pricing';
import { PLAN_NAMES } from '@workspace/pricing';

import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';

export interface BillingServiceDeps {
  subscriptionRepo: SubscriptionRepository;
}

export class BillingService {
  constructor(private deps: BillingServiceDeps) {}

  /**
   * Check if workspace has an active subscription
   */
  async hasActiveSubscription(workspaceId: string): Promise<boolean> {
    return this.deps.subscriptionRepo.hasActiveSubscription(workspaceId);
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
