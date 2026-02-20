/**
 * BillingQueryService - Read-only subscription status and access lookups
 *
 * Handles:
 * - Subscription status computation (with caching)
 * - Access status determination (disputes, refunds, subscription state)
 * - Feature gate lookups
 */

import type { CacheService } from '@workspace/cache';
import type { SubscriptionAccessStatus } from '@workspace/contract';
import type { PlanFeatureGates, PlanId } from '@workspace/pricing';
import { FREE_PLAN_FEATURE_GATES, PLAN_NAMES } from '@workspace/pricing';

import { createLogger } from '@/api/lib/logger';
import type { DisputeRepository } from '@/api/repositories/disputes.repository';
import type { RefundRepository } from '@/api/repositories/refunds.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';

const logger = createLogger('billing-query-service');

// Grace period for on_hold status (14 days in milliseconds)
const ON_HOLD_GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

export interface BillingQueryServiceDeps {
  subscriptionRepo: SubscriptionRepository;
  disputeRepo: DisputeRepository;
  refundRepo: RefundRepository;
  cacheService: CacheService;
  getSubscriptionAccessStatusFeatureFlagOverride: (
    workspaceId: string
  ) => Promise<SubscriptionAccessStatus | null>;
}

export class BillingQueryService {
  constructor(private deps: BillingQueryServiceDeps) {}

  /**
   * Get subscription status summary for a workspace
   * Uses cache-first pattern with TTL for billing page performance.
   */
  async getSubscriptionStatus(workspaceId: string) {
    const cached = await this.deps.cacheService.getSubscriptionStatus(workspaceId);
    if (cached) {
      return cached;
    }

    const result = await this._computeSubscriptionStatus(workspaceId);
    await this.deps.cacheService.setSubscriptionStatus(workspaceId, result);
    return result;
  }

  /**
   * Get subscription access status for entitlement checks
   * Uses cache-first pattern to reduce database queries.
   */
  async getSubscriptionAccessStatus(workspaceId: string): Promise<SubscriptionAccessStatus> {
    const cached = await this.deps.cacheService.getSubscriptionAccessStatus(workspaceId);
    if (cached) {
      return cached as SubscriptionAccessStatus;
    }

    const result = await this._computeSubscriptionAccessStatus(workspaceId);
    await this.deps.cacheService.setSubscriptionAccessStatus(workspaceId, result);
    return result;
  }

  /**
   * Get feature gates for a workspace
   * Free plan: returns hardcoded gates
   * Paid plans: reads from subscription record (populated from Dodo product metadata)
   */
  async getFeatureGates(workspaceId: string): Promise<PlanFeatureGates> {
    const accessStatus = await this.getSubscriptionAccessStatus(workspaceId);

    if (accessStatus.effectivePlanId === 'free') {
      return FREE_PLAN_FEATURE_GATES;
    }

    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      logger.warn({ workspaceId }, 'No subscription found for paid workspace, defaulting to free');
      return FREE_PLAN_FEATURE_GATES;
    }

    return subscription.featureGates ?? FREE_PLAN_FEATURE_GATES;
  }

  private async _computeSubscriptionStatus(workspaceId: string) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    const accessDetail = await this._computeSubscriptionAccessStatus(workspaceId);

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
          trialEnd: null,
        },
        accessDetail,
        featureGates: FREE_PLAN_FEATURE_GATES,
      };
    }

    const planId = subscription.planId as PlanId;
    const hasAccess =
      accessDetail.accessStatus === 'active' ||
      accessDetail.accessStatus === 'trial' ||
      accessDetail.accessStatus === 'grace';
    const featureGates = hasAccess
      ? (subscription.featureGates ?? FREE_PLAN_FEATURE_GATES)
      : FREE_PLAN_FEATURE_GATES;

    return {
      contractDetail: {
        status: subscription.status,
        planId,
        planName: PLAN_NAMES[planId] || 'Custom',
        currentPeriodEnd: subscription.currentPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        onHoldSince: subscription.status === 'on_hold' ? subscription.updatedAt : null,
        trialEnd: subscription.trialEnd ?? null,
      },
      accessDetail,
      featureGates,
    };
  }

  private async _computeSubscriptionAccessStatus(
    workspaceId: string
  ): Promise<SubscriptionAccessStatus> {
    // CHECK DISPUTES FIRST - hard safety latch
    const hasOpenDispute = await this.deps.disputeRepo.hasOpenDispute(workspaceId);
    if (hasOpenDispute) {
      return { effectivePlanId: 'free', accessStatus: 'disputed' };
    }

    // CHECK REFUNDS - hard safety latch
    const hasRefund = await this.deps.refundRepo.hasSuccessfulRefund(workspaceId);
    if (hasRefund) {
      return { effectivePlanId: 'free', accessStatus: 'refunded' };
    }

    // Normal subscription status flow
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    let dbResult: SubscriptionAccessStatus;
    if (!subscription) {
      dbResult = { effectivePlanId: 'free', accessStatus: 'inactive' };
    } else {
      dbResult = this.calculateAccessStatus(subscription);
    }

    // Apply PostHog feature flag override (skip for safety-critical statuses)
    if (dbResult.accessStatus !== 'disputed' && dbResult.accessStatus !== 'refunded') {
      const override = await this.deps.getSubscriptionAccessStatusFeatureFlagOverride(workspaceId);
      if (override) {
        logger.debug({ workspaceId, override, dbResult }, 'Feature flag override applied');
        return override;
      }
    }

    return dbResult;
  }

  private calculateAccessStatus(subscription: {
    status: string;
    planId: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
    updatedAt: Date;
    trialEnd: Date | null;
  }): SubscriptionAccessStatus {
    const now = new Date();
    const planId = subscription.planId as PlanId;

    switch (subscription.status) {
      case 'active': {
        if (subscription.trialEnd && now < new Date(subscription.trialEnd)) {
          return { effectivePlanId: planId, accessStatus: 'trial' };
        }
        return { effectivePlanId: planId, accessStatus: 'active' };
      }

      case 'on_hold': {
        const onHoldSince = subscription.updatedAt;
        const graceEndsAt = new Date(onHoldSince.getTime() + ON_HOLD_GRACE_PERIOD_MS);
        if (now < graceEndsAt) {
          return { effectivePlanId: planId, accessStatus: 'grace' };
        }
        return { effectivePlanId: 'free', accessStatus: 'inactive' };
      }

      case 'cancelled': {
        if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
          const periodEnd = new Date(subscription.currentPeriodEnd);
          if (now < periodEnd) {
            return { effectivePlanId: planId, accessStatus: 'grace' };
          }
        }
        return { effectivePlanId: 'free', accessStatus: 'inactive' };
      }

      case 'expired':
      case 'failed':
      case 'pending':
      default:
        return { effectivePlanId: 'free', accessStatus: 'inactive' };
    }
  }
}
