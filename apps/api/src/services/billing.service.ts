/**
 * BillingService - Domain service for billing and subscription operations
 *
 * Provides read-only operations for subscription status and plan change operations.
 * Webhook processing is handled by WebhookProcessorService.
 * Supports optional caching for high-frequency access checks.
 */

import type { CacheService } from '@workspace/cache';
import {
  type AddonItems,
  billingError,
  type PlanChangePreviewData,
  type PlanChangeResultData,
  SEATS_ADDON_MAX_PACKS,
  SEATS_ADDON_PACK_SIZE,
  type SubscriptionAccessStatus,
} from '@workspace/contract';
import { getSeatsAddonIdForPlanId, isSeatsAddonId } from '@workspace/payments';
import type { DodoPayments } from '@workspace/payments/client';
import type { PlanFeatureGates, PlanId } from '@workspace/pricing';
import { FREE_PLAN_FEATURE_GATES, PLAN_NAMES } from '@workspace/pricing';

import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
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
  getSubscriptionAccessStatusFeatureFlagOverride: (
    workspaceId: string
  ) => Promise<SubscriptionAccessStatus | null>;
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
        },
        accessDetail,
        featureGates: FREE_PLAN_FEATURE_GATES,
      };
    }

    const planId = subscription.planId as PlanId;

    // Feature gates: only grant paid plan gates when access is active or grace
    const hasAccess =
      accessDetail.accessStatus === 'active' || accessDetail.accessStatus === 'grace';
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
      },
      accessDetail,
      featureGates,
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
   * Get feature gates for a workspace
   * Free plan: returns hardcoded gates
   * Paid plans: reads from subscription record (populated from Dodo product metadata)
   */
  async getFeatureGates(workspaceId: string): Promise<PlanFeatureGates> {
    const accessStatus = await this.getSubscriptionAccessStatus(workspaceId);

    // Free plan: hardcoded (no subscription)
    if (accessStatus.effectivePlanId === 'free') {
      return FREE_PLAN_FEATURE_GATES;
    }

    // Paid plans: read from subscription record (repo parses via zod)
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      logger.warn({ workspaceId }, 'No subscription found for paid workspace, defaulting to free');
      return FREE_PLAN_FEATURE_GATES;
    }

    return subscription.featureGates ?? FREE_PLAN_FEATURE_GATES;
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

    let dbResult: SubscriptionAccessStatus;
    if (!subscription) {
      dbResult = {
        effectivePlanId: 'free',
        accessStatus: 'inactive',
      };
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

  private getSeatsAddonQuantity(addons: AddonItems): number {
    const seatsAddon = addons.find((addon) => isSeatsAddonId(addon.addonId));
    return seatsAddon?.quantity ?? 0;
  }

  private toDodoAddonPayload(addons: AddonItems): Array<{ addon_id: string; quantity: number }> {
    return addons
      .filter((addon) => addon.quantity > 0)
      .map((addon) => ({
        addon_id: addon.addonId,
        quantity: addon.quantity,
      }));
  }

  private buildAddonsForTargetPlan(
    currentAddons: AddonItems,
    targetPlanId: string,
    nextSeatsQuantity?: number
  ): AddonItems {
    const currentSeatsQuantity = this.getSeatsAddonQuantity(currentAddons);
    const seatsQuantity = nextSeatsQuantity ?? currentSeatsQuantity;
    const nonSeatAddons = currentAddons.filter((addon) => !isSeatsAddonId(addon.addonId));

    if (seatsQuantity <= 0) {
      return nonSeatAddons;
    }

    const targetSeatsAddonId = getSeatsAddonIdForPlanId(targetPlanId);
    if (!targetSeatsAddonId) {
      throw billingError.ADDON_MAPPING_MISSING_FOR_INTERVAL();
    }

    return [
      ...nonSeatAddons,
      {
        addonId: targetSeatsAddonId,
        quantity: seatsQuantity,
      },
    ];
  }

  private mapPreviewResponse(
    preview: Awaited<ReturnType<DodoPayments['subscriptions']['previewChangePlan']>>,
    currentPlanId: string,
    currentPlanName: string,
    newPlanId: PlanId,
    newPlanName: string
  ): PlanChangePreviewData {
    const summary = preview.immediate_charge.summary;
    const totalAmount = summary.total_amount;
    const currency = summary.currency;
    const lineItems = preview.immediate_charge.line_items || [];
    const isUpgrade = totalAmount > 0;
    const hasCredit = summary.customer_credits > 0;

    const mappedLineItems = lineItems
      .filter((item): item is Extract<typeof item, { unit_price: number }> => 'unit_price' in item)
      .map((item) => ({
        name: item.name || 'Subscription',
        description: item.description || null,
        unitPrice: item.unit_price / 100,
        quantity: item.quantity,
        tax: item.tax ? item.tax / 100 : null,
        taxRate: item.tax_rate || null,
        prorationFactor: item.proration_factor || null,
        type: item.type,
      }));

    return {
      immediateCharge: isUpgrade
        ? {
            currency,
            total: totalAmount / 100,
            summary: `${currency} ${(totalAmount / 100).toFixed(2)} due today`,
            lineItems: mappedLineItems,
            chargeSummary: {
              currency,
              totalAmount: totalAmount / 100,
              tax: summary.tax ? summary.tax / 100 : null,
              customerCredits: summary.customer_credits / 100,
            },
          }
        : null,
      creditAmount: hasCredit
        ? {
            currency,
            amount: summary.customer_credits / 100,
            summary: `${currency} ${(summary.customer_credits / 100).toFixed(2)} credit applied to future billing`,
          }
        : null,
      newPlan: {
        planId: newPlanId,
        planName: newPlanName,
        billingInterval: newPlanId.includes('annual') ? 'annual' : 'monthly',
        nextBillingDate: new Date(preview.new_plan.next_billing_date),
        recurringPreTaxAmount: preview.new_plan.recurring_pre_tax_amount / 100,
        paymentFrequencyInterval: preview.new_plan.payment_frequency_interval,
      },
      currentPlan: {
        planId: currentPlanId,
        planName: currentPlanName,
      },
      isUpgrade,
    };
  }

  async getAddonsStatus(workspaceId: string) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    const addons = subscription.addons ?? [];
    const seatsQuantity = this.getSeatsAddonQuantity(addons);

    return {
      subscriptionId: subscription.subscriptionId,
      seatsQuantity,
      additionalSeats: seatsQuantity * SEATS_ADDON_PACK_SIZE,
      addons,
    };
  }

  async previewAddonChange(workspaceId: string, seatsQuantity: number) {
    if (
      !Number.isInteger(seatsQuantity) ||
      seatsQuantity < 0 ||
      seatsQuantity > SEATS_ADDON_MAX_PACKS
    ) {
      throw billingError.INVALID_ADDON_QUANTITY();
    }

    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    this.validateSubscriptionForAddonChange(subscription);

    const nextAddons = this.buildAddonsForTargetPlan(
      subscription.addons ?? [],
      subscription.planId,
      seatsQuantity
    );

    try {
      const preview = await this.deps.dodoClient.subscriptions.previewChangePlan(
        subscription.subscriptionId,
        {
          product_id: subscription.productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
          on_payment_failure: 'prevent_change',
          addons: this.toDodoAddonPayload(nextAddons),
        }
      );

      const currentPlanId = subscription.planId;
      const currentPlanName = PLAN_NAMES[subscription.planId as PlanId] || 'Custom';
      return this.mapPreviewResponse(
        preview,
        currentPlanId,
        currentPlanName,
        subscription.planId as PlanId,
        currentPlanName
      );
    } catch (error) {
      logger.error({ err: error, workspaceId }, 'Failed to preview addon change');
      captureException(error, undefined, {
        operation: 'preview_addon_change',
        workspace_id: workspaceId,
      });
      const dodoError = error as {
        status?: number;
        error?: { code?: string; message?: string };
        message?: string;
      };
      throw billingError.UPSTREAM_PAYMENT_ERROR({
        code: dodoError?.error?.code || `HTTP_${dodoError?.status}` || 'ADDON_PREVIEW_FAILED',
        message:
          dodoError?.error?.message || dodoError?.message || 'Failed to preview add-on change',
      });
    }
  }

  async changeAddons(workspaceId: string, seatsQuantity: number): Promise<PlanChangeResultData> {
    if (
      !Number.isInteger(seatsQuantity) ||
      seatsQuantity < 0 ||
      seatsQuantity > SEATS_ADDON_MAX_PACKS
    ) {
      throw billingError.INVALID_ADDON_QUANTITY();
    }

    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    this.validateSubscriptionForAddonChange(subscription);

    const nextAddons = this.buildAddonsForTargetPlan(
      subscription.addons ?? [],
      subscription.planId,
      seatsQuantity
    );

    try {
      await this.deps.dodoClient.subscriptions.changePlan(subscription.subscriptionId, {
        product_id: subscription.productId,
        proration_billing_mode: 'prorated_immediately',
        quantity: 1,
        on_payment_failure: 'prevent_change',
        addons: this.toDodoAddonPayload(nextAddons),
      });

      return {
        subscriptionId: subscription.subscriptionId,
        status: 'processing',
        newPlanId: subscription.planId,
        newPlanName: PLAN_NAMES[subscription.planId as PlanId] || 'Custom',
      };
    } catch (error) {
      logger.error({ err: error, workspaceId }, 'Failed to change addons');
      captureException(error, undefined, {
        operation: 'change_addons',
        workspace_id: workspaceId,
      });
      const dodoError = error as {
        status?: number;
        error?: { code?: string; message?: string };
        message?: string;
      };
      throw billingError.UPSTREAM_PAYMENT_ERROR({
        code: dodoError?.error?.code || `HTTP_${dodoError?.status}` || 'ADDON_CHANGE_FAILED',
        message: dodoError?.error?.message || dodoError?.message || 'Failed to change add-ons',
      });
    }
  }

  /**
   * Get customer portal URL for a workspace
   */
  async getCustomerPortalUrl(workspaceId: string): Promise<string> {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    const withWorkspace = await this.deps.subscriptionRepo.findWithWorkspace(
      subscription.subscriptionId
    );
    const customerId = withWorkspace?.workspace.dodoCustomerId;
    if (!customerId) {
      throw billingError.PORTAL_UNAVAILABLE();
    }

    const portal = await this.deps.dodoClient.customers.customerPortal.create(customerId);
    return portal.link;
  }

  /**
   * Preview plan change - shows proration details before confirming
   * @param productId - The resolved DodoPayments product ID
   * @param newPlanId - The resolved plan ID (may be 'custom' for sales-led products)
   */
  async previewPlanChange(workspaceId: string, productId: string, newPlanId: PlanId) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    this.validateSubscriptionForChange(subscription);

    // Same-plan guard: for custom plans, compare productId; for standard plans, compare planId
    if (newPlanId === 'custom') {
      if (subscription.productId === productId) {
        throw billingError.SAME_PLAN_SELECTED();
      }
    } else if (subscription.planId === newPlanId) {
      throw billingError.SAME_PLAN_SELECTED();
    }

    const currentPlanName = PLAN_NAMES[subscription.planId as PlanId] || 'Custom';
    const newPlanName = PLAN_NAMES[newPlanId] || 'Custom';
    const nextAddons = this.buildAddonsForTargetPlan(subscription.addons ?? [], newPlanId);

    try {
      const preview = await this.deps.dodoClient.subscriptions.previewChangePlan(
        subscription.subscriptionId,
        {
          product_id: productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
          on_payment_failure: 'prevent_change',
          addons: this.toDodoAddonPayload(nextAddons),
        }
      );
      return this.mapPreviewResponse(
        preview,
        subscription.planId,
        currentPlanName,
        newPlanId,
        newPlanName
      );
    } catch (error) {
      logger.error({ err: error, workspaceId }, 'Failed to preview plan change');
      captureException(error, undefined, {
        operation: 'preview_plan_change',
        workspace_id: workspaceId,
      });
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
   * @param productId - The resolved DodoPayments product ID
   * @param newPlanId - The resolved plan ID (may be 'custom' for sales-led products)
   */
  async changePlan(workspaceId: string, productId: string, newPlanId: PlanId) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);

    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    this.validateSubscriptionForChange(subscription);

    // Same-plan guard: for custom plans, compare productId; for standard plans, compare planId
    if (newPlanId === 'custom') {
      if (subscription.productId === productId) {
        throw billingError.SAME_PLAN_SELECTED();
      }
    } else if (subscription.planId === newPlanId) {
      throw billingError.SAME_PLAN_SELECTED();
    }

    const newPlanName = PLAN_NAMES[newPlanId] || 'Custom';
    const nextAddons = this.buildAddonsForTargetPlan(subscription.addons ?? [], newPlanId);

    try {
      await this.deps.dodoClient.subscriptions.changePlan(subscription.subscriptionId, {
        product_id: productId,
        proration_billing_mode: 'prorated_immediately',
        quantity: 1,
        on_payment_failure: 'prevent_change',
        addons: this.toDodoAddonPayload(nextAddons),
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
      captureException(error, undefined, { operation: 'change_plan', workspace_id: workspaceId });
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

  /**
   * Validate subscription is in a state that allows add-on changes
   */
  private validateSubscriptionForAddonChange(subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
  }): void {
    // Block if subscription is on hold (payment failed)
    if (subscription.status === 'on_hold') {
      throw billingError.SUBSCRIPTION_ON_HOLD();
    }

    // Allow add-on changes for:
    // 1. Active subscriptions
    // 2. Cancelled subscriptions with cancelAtPeriodEnd=true
    const isActive = subscription.status === 'active';
    const isCancelledWithAccess =
      subscription.status === 'cancelled' && subscription.cancelAtPeriodEnd;

    if (!isActive && !isCancelledWithAccess) {
      throw billingError.ADDON_CHANGE_NOT_ALLOWED();
    }
  }
}
