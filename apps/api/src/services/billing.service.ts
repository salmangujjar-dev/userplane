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

import type { DisputeRepository } from '@/api/repositories/disputes.repository';
import type { RefundRepository } from '@/api/repositories/refunds.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';

// Grace period for on_hold status (14 days in milliseconds)
const ON_HOLD_GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

export interface BillingServiceDeps {
  subscriptionRepo: SubscriptionRepository;
  disputeRepo: DisputeRepository;
  refundRepo: RefundRepository;
}

/**
 * Subscription access status - determines if user has entitled access
 *
 * effectivePlanId:
 * - PlanId: User has access to this paid plan
 * - 'free': User has no paid access, falls back to free plan
 *
 * accessStatus:
 * - 'active': Full paid access to subscribed plan
 * - 'grace': Temporary access (cancelled but in period, or payment failed in grace period)
 * - 'inactive': No paid access, falls back to free plan
 * - 'disputed': Payment dispute open - access blocked regardless of subscription status
 * - 'refunded': Payment refunded - access blocked regardless of subscription status
 *
 * Note: UI can derive daysRemaining from subscription.onHoldSince or subscription.currentPeriodEnd
 */
export interface SubscriptionAccessStatus {
  effectivePlanId: PlanId | 'free';
  accessStatus: 'active' | 'grace' | 'inactive' | 'disputed' | 'refunded';
}

export class BillingService {
  constructor(private deps: BillingServiceDeps) {}

  /**
   * Get subscription status summary for a workspace
   * Extended with access status for entitlement checks
   *
   * Note: To check if a subscription exists, check if contractDetail.planId is not null
   * or if accessDetail.effectivePlanId is not 'free'
   */
  async getSubscriptionStatus(workspaceId: string) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      return {
        contractDetail: {
          status: null,
          planId: null,
          planName: null,
          currentPeriodEnd: null,
          currentPeriodStart: null,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          onHoldSince: null,
        },
        accessDetail: {
          effectivePlanId: 'free' as const,
          accessStatus: 'inactive' as const,
        },
      };
    }

    const planId = subscription.planId as PlanId;
    const accessStatus = this.calculateAccessStatus(subscription);

    return {
      contractDetail: {
        status: subscription.status,
        planId,
        planName: PLAN_NAMES[planId] || 'Unknown',
        currentPeriodEnd: subscription.currentPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        onHoldSince: subscription.status === 'on_hold' ? subscription.updatedAt : null,
      },
      accessDetail: accessStatus,
    };
  }

  /**
   * Get subscription access status for entitlement checks
   * Determines if a workspace has entitled access based on subscription state
   *
   * Priority order:
   * 1. Check for open disputes (hard safety latch - blocks all access)
   * 2. Check for successful refunds (hard safety latch - blocks all access)
   * 3. Check subscription status (normal flow)
   */
  async getSubscriptionAccessStatus(workspaceId: string): Promise<SubscriptionAccessStatus> {
    // CHECK DISPUTES FIRST - hard safety latch
    // Open disputes override all subscription state and block access
    const hasOpenDispute = await this.deps.disputeRepo.hasOpenDispute(workspaceId);

    if (hasOpenDispute) {
      return {
        effectivePlanId: 'free',
        accessStatus: 'disputed',
      };
    }

    // CHECK REFUNDS - hard safety latch
    // Successful refunds override all subscription state and block access
    const hasRefund = await this.deps.refundRepo.hasSuccessfulRefund(workspaceId);

    if (hasRefund) {
      return {
        effectivePlanId: 'free',
        accessStatus: 'refunded',
      };
    }

    // Normal subscription status flow
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      return {
        effectivePlanId: 'free',
        accessStatus: 'inactive',
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
          effectivePlanId: planId,
          accessStatus: 'active',
        };

      case 'on_hold': {
        // Allow access during 14-day grace period
        const onHoldSince = subscription.updatedAt;
        const graceEndsAt = new Date(onHoldSince.getTime() + ON_HOLD_GRACE_PERIOD_MS);

        if (now < graceEndsAt) {
          return {
            effectivePlanId: planId,
            accessStatus: 'grace',
          };
        }
        // Grace period expired
        return {
          effectivePlanId: 'free',
          accessStatus: 'inactive',
        };
      }

      case 'cancelled': {
        // If cancelAtPeriodEnd, allow access until period end
        if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
          const periodEnd = new Date(subscription.currentPeriodEnd);
          if (now < periodEnd) {
            return {
              effectivePlanId: planId,
              accessStatus: 'grace',
            };
          }
        }
        // Immediate cancellation or period ended
        return {
          effectivePlanId: 'free',
          accessStatus: 'inactive',
        };
      }

      case 'expired':
      case 'failed':
        return {
          effectivePlanId: 'free',
          accessStatus: 'inactive',
        };

      case 'pending':
        // Pending subscriptions don't have access yet
        return {
          effectivePlanId: 'free',
          accessStatus: 'inactive',
        };

      default:
        return {
          effectivePlanId: 'free',
          accessStatus: 'inactive',
        };
    }
  }
}
