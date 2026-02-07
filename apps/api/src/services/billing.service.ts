/**
 * BillingService - Domain service for billing and subscription operations
 *
 * Provides read-only operations for subscription status and plan change operations.
 * Webhook processing is handled by WebhookProcessorService.
 * Supports optional caching for high-frequency access checks.
 */

import type { CacheService } from '@workspace/cache';
import { billingError, type SubscriptionAccessStatus } from '@workspace/contract';
import type { DodoPayments } from '@workspace/payments/client';
import { getProductByPlanId } from '@workspace/payments/products';
import type { PlanId } from '@workspace/pricing';
import { PLAN_NAMES } from '@workspace/pricing';

import { createLogger } from '@/api/lib/logger';
import type { DisputeRepository } from '@/api/repositories/disputes.repository';
import type { RefundRepository } from '@/api/repositories/refunds.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';

const logger = createLogger('billing-service');

// Grace period for on_hold status (14 days in milliseconds)
const ON_HOLD_GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

export interface BillingServiceDeps {
  subscriptionRepo: SubscriptionRepository;
  disputeRepo: DisputeRepository;
  refundRepo: RefundRepository;
  dodoClient: DodoPayments;
  cacheService: CacheService;
}

/**
 * Subscription access status - determines if user has entitled access
 *
 * Type is defined in @workspace/contract for type safety across the codebase.
 * See: packages/contract/src/schemas/billing.ts
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
export type { SubscriptionAccessStatus };

export class BillingService {
  constructor(private deps: BillingServiceDeps) {}

  /**
   * Get subscription status summary for a workspace
   * Extended with access status for entitlement checks
   *
   * Uses cache-first pattern with 300s TTL for billing page performance.
   *
   * Note: To check if a subscription exists, check if contractDetail.planId is not null
   * or if accessDetail.effectivePlanId is not 'free'
   */
  async getSubscriptionStatus(workspaceId: string) {
    // Try cache first
    const cached = await this.deps.cacheService.getSubscriptionStatus(workspaceId);
    if (cached) {
      return cached;
    }

    // Compute status from database
    const result = await this._computeSubscriptionStatus(workspaceId);

    // Cache the result
    await this.deps.cacheService.setSubscriptionStatus(workspaceId, result);

    return result;
  }

  /**
   * Internal method to compute subscription status from database
   * Called when cache miss occurs
   */
  private async _computeSubscriptionStatus(workspaceId: string) {
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
   * Uses cache-first pattern to reduce database queries.
   *
   * Priority order:
   * 1. Check cache for subscription access status
   * 2. Check for open disputes (hard safety latch - blocks all access)
   * 3. Check for successful refunds (hard safety latch - blocks all access)
   * 4. Check subscription status (normal flow)
   * 5. Cache result for future requests
   */
  async getSubscriptionAccessStatus(workspaceId: string): Promise<SubscriptionAccessStatus> {
    // Try cache first
    const cached = await this.deps.cacheService.getSubscriptionAccessStatus(workspaceId);
    if (cached) {
      return cached as SubscriptionAccessStatus;
    }

    // Compute access status from database
    const result = await this._computeSubscriptionAccessStatus(workspaceId);

    // Cache the result
    await this.deps.cacheService.setSubscriptionAccessStatus(workspaceId, result);

    return result;
  }

  /**
   * Internal method to compute subscription access status from database
   * Called when cache miss occurs
   */
  private async _computeSubscriptionAccessStatus(
    workspaceId: string
  ): Promise<SubscriptionAccessStatus> {
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

  /**
   * Preview plan change - shows proration details before confirming
   */
  async previewPlanChange(workspaceId: string, newPlanId: PlanId) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    this.validateSubscriptionForChange(subscription);

    if (subscription.planId === newPlanId) {
      throw billingError.SAME_PLAN_SELECTED();
    }

    const product = getProductByPlanId(newPlanId);
    if (!product) {
      throw billingError.INVALID_PLAN();
    }

    const currentPlanName = PLAN_NAMES[subscription.planId as PlanId] || 'Unknown';
    const newPlanName = PLAN_NAMES[newPlanId] || 'Unknown';

    try {
      const preview = await this.deps.dodoClient.subscriptions.previewChangePlan(
        subscription.subscriptionId,
        {
          product_id: product.productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
        }
      );

      const summary = preview.immediate_charge.summary;
      const totalAmount = summary.total_amount;
      const currency = summary.currency;
      const lineItems = preview.immediate_charge.line_items || [];

      // Determine if this is an upgrade by checking if total_amount is positive
      // Positive = upgrade (charge), negative or zero with credits = downgrade
      const isUpgrade = totalAmount > 0;

      // For downgrades with prorated_immediately, credits may be applied
      // The customer_credits field in summary indicates credits applied
      const hasCredit = summary.customer_credits > 0;

      // Map line items from DodoPayments format to our format
      // Filter for subscription/addon line items (exclude meters)
      const mappedLineItems = lineItems
        .filter(
          (item): item is Extract<typeof item, { unit_price: number }> => 'unit_price' in item
        )
        .map((item) => ({
          name: item.name || 'Subscription',
          description: item.description || null,
          unitPrice: item.unit_price / 100, // Convert from cents to dollars
          quantity: item.quantity,
          tax: item.tax ? item.tax / 100 : null, // Convert from cents to dollars
          taxRate: item.tax_rate || null,
          prorationFactor: item.proration_factor || null,
          type: item.type,
        }));

      return {
        immediateCharge: isUpgrade
          ? {
              currency,
              total: totalAmount / 100, // Convert from cents to dollars
              summary: `${currency} ${(totalAmount / 100).toFixed(2)} due today`,
              lineItems: mappedLineItems,
              chargeSummary: {
                currency,
                totalAmount: totalAmount / 100, // Convert from cents to dollars
                tax: summary.tax ? summary.tax / 100 : null, // Convert from cents to dollars
                customerCredits: summary.customer_credits / 100, // Convert from cents to dollars
              },
            }
          : null,
        creditAmount: hasCredit
          ? {
              currency,
              amount: summary.customer_credits / 100, // Convert from cents to dollars
              summary: `${currency} ${(summary.customer_credits / 100).toFixed(2)} credit applied to future billing`,
            }
          : null,
        newPlan: {
          planId: newPlanId,
          planName: newPlanName,
          billingInterval: newPlanId.includes('annual') ? 'annual' : 'monthly',
          nextBillingDate: new Date(preview.new_plan.next_billing_date),
          recurringPreTaxAmount: preview.new_plan.recurring_pre_tax_amount / 100, // Convert from cents to dollars
          paymentFrequencyInterval: preview.new_plan.payment_frequency_interval,
        },
        currentPlan: {
          planId: subscription.planId,
          planName: currentPlanName,
        },
        isUpgrade,
      };
    } catch (error) {
      logger.error({ err: error, workspaceId }, 'Failed to preview plan change');
      const dodoError = error as {
        status?: number;
        error?: { code?: string; message?: string };
        message?: string;
      };
      throw billingError.UPSTREAM_PAYMENT_ERROR({
        code: dodoError?.error?.code || `HTTP_${dodoError?.status}` || 'PREVIEW_FAILED',
        message: dodoError?.error?.message || dodoError?.message || 'Failed to preview plan change',
      });
    }
  }

  /**
   * Execute plan change
   */
  async changePlan(workspaceId: string, newPlanId: PlanId) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    this.validateSubscriptionForChange(subscription);

    if (subscription.planId === newPlanId) {
      throw billingError.SAME_PLAN_SELECTED();
    }

    const product = getProductByPlanId(newPlanId);
    if (!product) {
      throw billingError.INVALID_PLAN();
    }

    const newPlanName = PLAN_NAMES[newPlanId] || 'Unknown';

    try {
      await this.deps.dodoClient.subscriptions.changePlan(subscription.subscriptionId, {
        product_id: product.productId,
        proration_billing_mode: 'prorated_immediately',
        quantity: 1,
      });

      // Note: DB update happens via webhook handler for subscription.plan_changed
      // The changePlan API returns void, so we return a constructed response
      return {
        subscriptionId: subscription.subscriptionId,
        status: 'processing',
        newPlanId,
        newPlanName,
      };
    } catch (error) {
      logger.error({ err: error, workspaceId }, 'Failed to change plan');
      const dodoError = error as {
        status?: number;
        error?: { code?: string; message?: string };
        message?: string;
      };
      throw billingError.UPSTREAM_PAYMENT_ERROR({
        code: dodoError?.error?.code || `HTTP_${dodoError?.status}` || 'PLAN_CHANGE_FAILED',
        message: dodoError?.error?.message || dodoError?.message || 'Failed to change plan',
      });
    }
  }

  /**
   * Validate subscription is in a state that allows plan changes
   */
  private validateSubscriptionForChange(subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
  }): void {
    // Block if subscription is on hold (payment failed)
    if (subscription.status === 'on_hold') {
      throw billingError.SUBSCRIPTION_ON_HOLD();
    }

    // Allow plan change for:
    // 1. Active subscriptions
    // 2. Cancelled subscriptions with cancelAtPeriodEnd=true (user still has access until period end)
    const isActive = subscription.status === 'active';
    const isCancelledWithAccess =
      subscription.status === 'cancelled' && subscription.cancelAtPeriodEnd;

    if (!isActive && !isCancelledWithAccess) {
      throw billingError.PLAN_CHANGE_NOT_ALLOWED();
    }
  }
}
