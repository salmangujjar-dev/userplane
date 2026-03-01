/**
 * BillingMutationService - Plan change and addon change operations
 *
 * All write operations against the Dodo Payments API live here.
 * Includes plan change previews, plan changes, addon changes,
 * and customer portal URL generation.
 */

import type { CacheService } from '@userplane/cache';
import {
  billingError,
  type PlanChangePreviewData,
  type PlanChangeResultData,
  SEATS_ADDON_MAX_PACKS,
} from '@userplane/contract';
import type { DodoPayments } from '@userplane/payments/client';
import type { PlanId } from '@userplane/pricing';
import { PLAN_NAMES } from '@userplane/pricing';

import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';

import type { AddonMapper } from './addon-mapper';

const logger = createLogger('billing-mutation-service');

export interface BillingMutationServiceDeps {
  subscriptionRepo: SubscriptionRepository;
  dodoClient: DodoPayments;
  addonMapper: AddonMapper;
  cacheService: CacheService;
}

/**
 * Validate subscription is in a state that allows mutations (plan or addon changes).
 */
function validateSubscriptionForMutation(
  subscription: { status: string; cancelAtPeriodEnd: boolean; trialEnd: Date | null },
  errorFactory: () => Error
): void {
  // Block mutations during trial
  if (subscription.trialEnd) {
    const now = new Date();
    if (now < new Date(subscription.trialEnd)) {
      throw billingError.SUBSCRIPTION_IN_TRIAL();
    }
  }

  if (subscription.status === 'on_hold') {
    throw billingError.SUBSCRIPTION_ON_HOLD();
  }

  const isActive = subscription.status === 'active';
  const isCancelledWithAccess =
    subscription.status === 'cancelled' && subscription.cancelAtPeriodEnd;

  if (!isActive && !isCancelledWithAccess) {
    throw errorFactory();
  }
}

/**
 * Wrap a Dodo API call with consistent error handling.
 */
async function wrapDodoCall<T>(
  fn: () => Promise<T>,
  opts: { operation: string; workspaceId: string; errorCode: string; errorMessage: string }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error({ err: error, workspaceId: opts.workspaceId }, `Failed to ${opts.operation}`);
    captureException(error, undefined, {
      operation: opts.operation,
      workspace_id: opts.workspaceId,
    });
    const dodoError = error as {
      status?: number;
      error?: { code?: string; message?: string };
      message?: string;
    };
    throw billingError.UPSTREAM_PAYMENT_ERROR({
      code: dodoError?.error?.code || `HTTP_${dodoError?.status}` || opts.errorCode,
      message: dodoError?.error?.message || dodoError?.message || opts.errorMessage,
    });
  }
}

export class BillingMutationService {
  constructor(private deps: BillingMutationServiceDeps) {}

  async getAddonsStatus(workspaceId: string) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    const addons = subscription.addons ?? [];
    const seatsQuantity = this.deps.addonMapper.getSeatsPackCount(addons);

    return {
      subscriptionId: subscription.subscriptionId,
      seatsQuantity,
      additionalSeats: this.deps.addonMapper.getAdditionalSeats(addons),
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

    validateSubscriptionForMutation(subscription, () => billingError.ADDON_CHANGE_NOT_ALLOWED());

    const nextAddons = this.deps.addonMapper.buildForTargetPlan(
      subscription.addons ?? [],
      subscription.planId,
      seatsQuantity
    );

    const preview = await wrapDodoCall(
      () =>
        this.deps.dodoClient.subscriptions.previewChangePlan(subscription.subscriptionId, {
          product_id: subscription.productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
          on_payment_failure: 'prevent_change',
          addons: this.deps.addonMapper.toDodoPayload(nextAddons),
        }),
      {
        operation: 'preview_addon_change',
        workspaceId,
        errorCode: 'ADDON_PREVIEW_FAILED',
        errorMessage: 'Failed to preview add-on change',
      }
    );

    const currentPlanName = PLAN_NAMES[subscription.planId as PlanId] || 'Custom';
    return this.mapPreviewResponse(
      preview,
      subscription.planId,
      currentPlanName,
      subscription.planId as PlanId,
      currentPlanName
    );
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

    validateSubscriptionForMutation(subscription, () => billingError.ADDON_CHANGE_NOT_ALLOWED());

    const nextAddons = this.deps.addonMapper.buildForTargetPlan(
      subscription.addons ?? [],
      subscription.planId,
      seatsQuantity
    );

    await wrapDodoCall(
      () =>
        this.deps.dodoClient.subscriptions.changePlan(subscription.subscriptionId, {
          product_id: subscription.productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
          on_payment_failure: 'prevent_change',
          addons: this.deps.addonMapper.toDodoPayload(nextAddons),
        }),
      {
        operation: 'change_addons',
        workspaceId,
        errorCode: 'ADDON_CHANGE_FAILED',
        errorMessage: 'Failed to change add-ons',
      }
    );

    return {
      subscriptionId: subscription.subscriptionId,
      status: 'processing',
      newPlanId: subscription.planId,
      newPlanName: PLAN_NAMES[subscription.planId as PlanId] || 'Custom',
    };
  }

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
   */
  async previewPlanChange(workspaceId: string, productId: string, newPlanId: PlanId) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    validateSubscriptionForMutation(subscription, () => billingError.PLAN_CHANGE_NOT_ALLOWED());

    // Same-plan guard
    if (newPlanId === 'custom') {
      if (subscription.productId === productId) {
        throw billingError.SAME_PLAN_SELECTED();
      }
    } else if (subscription.planId === newPlanId) {
      throw billingError.SAME_PLAN_SELECTED();
    }

    const currentPlanName = PLAN_NAMES[subscription.planId as PlanId] || 'Custom';
    const newPlanName = PLAN_NAMES[newPlanId] || 'Custom';
    const nextAddons = this.deps.addonMapper.buildForTargetPlan(
      subscription.addons ?? [],
      newPlanId
    );

    const preview = await wrapDodoCall(
      () =>
        this.deps.dodoClient.subscriptions.previewChangePlan(subscription.subscriptionId, {
          product_id: productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
          on_payment_failure: 'prevent_change',
          addons: this.deps.addonMapper.toDodoPayload(nextAddons),
        }),
      {
        operation: 'preview_plan_change',
        workspaceId,
        errorCode: 'PREVIEW_FAILED',
        errorMessage: 'Failed to preview plan change',
      }
    );

    return this.mapPreviewResponse(
      preview,
      subscription.planId,
      currentPlanName,
      newPlanId,
      newPlanName
    );
  }

  /**
   * Execute plan change
   */
  async changePlan(workspaceId: string, productId: string, newPlanId: PlanId) {
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    validateSubscriptionForMutation(subscription, () => billingError.PLAN_CHANGE_NOT_ALLOWED());

    // Same-plan guard
    if (newPlanId === 'custom') {
      if (subscription.productId === productId) {
        throw billingError.SAME_PLAN_SELECTED();
      }
    } else if (subscription.planId === newPlanId) {
      throw billingError.SAME_PLAN_SELECTED();
    }

    const newPlanName = PLAN_NAMES[newPlanId] || 'Custom';
    const nextAddons = this.deps.addonMapper.buildForTargetPlan(
      subscription.addons ?? [],
      newPlanId
    );

    await wrapDodoCall(
      () =>
        this.deps.dodoClient.subscriptions.changePlan(subscription.subscriptionId, {
          product_id: productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
          on_payment_failure: 'prevent_change',
          addons: this.deps.addonMapper.toDodoPayload(nextAddons),
        }),
      {
        operation: 'change_plan',
        workspaceId,
        errorCode: 'PLAN_CHANGE_FAILED',
        errorMessage: 'Failed to change plan',
      }
    );

    return {
      subscriptionId: subscription.subscriptionId,
      status: 'processing',
      newPlanId,
      newPlanName,
    };
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
        billingInterval:
          preview.new_plan.payment_frequency_interval === 'Year' ||
          (preview.new_plan.payment_frequency_interval === 'Month' &&
            preview.new_plan.payment_frequency_count >= 12)
            ? 'annual'
            : 'monthly',
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
}
