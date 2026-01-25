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

// Grace period for on_hold status (14 days in milliseconds)
const ON_HOLD_GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

export interface BillingServiceDeps {
  subscriptionRepo: SubscriptionRepository;
}

/**
 * Subscription access status - determines if user has entitled access
 */
export interface SubscriptionAccessStatus {
  hasAccess: boolean;
  effectivePlanId: PlanId | 'free';
  reason:
    | 'active'
    | 'cancelled_in_period'
    | 'on_hold_grace'
    | 'no_subscription'
    | 'expired'
    | 'revoked';
  expiresAt?: Date | null;
  daysRemaining?: number;
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
   * Extended with access status for entitlement checks
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
        currentPeriodStart: null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        onHoldSince: null,
        accessStatus: {
          hasAccess: false,
          effectivePlanId: 'free' as const,
          reason: 'no_subscription' as const,
        },
      };
    }

    const planId = subscription.planId as PlanId;
    const accessStatus = this.calculateAccessStatus(subscription);

    return {
      hasSubscription: true,
      status: subscription.status,
      planId,
      planName: PLAN_NAMES[planId] || 'Unknown',
      currentPeriodEnd: subscription.currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt,
      onHoldSince: subscription.updatedAt, // When status changed to on_hold
      accessStatus,
    };
  }

  /**
   * Get subscription access status for entitlement checks
   * Determines if a workspace has entitled access based on subscription state
   */
  async getSubscriptionAccessStatus(workspaceId: string): Promise<SubscriptionAccessStatus> {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      return {
        hasAccess: false,
        effectivePlanId: 'free',
        reason: 'no_subscription',
      };
    }

    return this.calculateAccessStatus(subscription);
  }

  /**
   * Calculate access status based on subscription state
   */
  private calculateAccessStatus(subscription: {
    status: string;
    planId: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
    updatedAt: Date;
  }): SubscriptionAccessStatus {
    const now = new Date();
    const planId = subscription.planId as PlanId;

    switch (subscription.status) {
      case 'active':
        return {
          hasAccess: true,
          effectivePlanId: planId,
          reason: 'active',
        };

      case 'on_hold': {
        // Allow access during 14-day grace period
        const onHoldSince = subscription.updatedAt;
        const graceEndsAt = new Date(onHoldSince.getTime() + ON_HOLD_GRACE_PERIOD_MS);
        const daysRemaining = Math.max(
          0,
          Math.ceil((graceEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        );

        if (now < graceEndsAt) {
          return {
            hasAccess: true,
            effectivePlanId: planId,
            reason: 'on_hold_grace',
            expiresAt: graceEndsAt,
            daysRemaining,
          };
        }
        // Grace period expired
        return {
          hasAccess: false,
          effectivePlanId: 'free',
          reason: 'revoked',
        };
      }

      case 'cancelled': {
        // If cancelAtPeriodEnd, allow access until period end
        if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
          const periodEnd = new Date(subscription.currentPeriodEnd);
          if (now < periodEnd) {
            const daysRemaining = Math.max(
              0,
              Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            );
            return {
              hasAccess: true,
              effectivePlanId: planId,
              reason: 'cancelled_in_period',
              expiresAt: periodEnd,
              daysRemaining,
            };
          }
        }
        // Immediate cancellation or period ended
        return {
          hasAccess: false,
          effectivePlanId: 'free',
          reason: 'expired',
        };
      }

      case 'expired':
      case 'failed':
        return {
          hasAccess: false,
          effectivePlanId: 'free',
          reason: 'expired',
        };

      case 'pending':
        // Pending subscriptions don't have access yet
        return {
          hasAccess: false,
          effectivePlanId: 'free',
          reason: 'no_subscription',
        };

      default:
        return {
          hasAccess: false,
          effectivePlanId: 'free',
          reason: 'no_subscription',
        };
    }
  }
}
