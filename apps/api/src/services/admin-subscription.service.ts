/**
 * AdminSubscriptionService - Update workspace subscription via DodoPayments
 *
 * Routes admin overrides (feature gates + entitlements) through DodoPayments
 * subscription metadata so it remains the single source of truth. The webhook
 * processor then picks up changes via the embedded snapshot mechanism.
 */

import { adminError } from '@userplane/contract';
import type { DodoPayments } from '@userplane/payments/client';
import { mergeAndBuildFlatMetadata } from '@userplane/payments/metadata';
import type { PlanFeatureGates, ResourceLimits, ResourceType } from '@userplane/pricing';

import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';

import type { PlanMetadataResolver } from './plan-metadata-resolver';

const logger = createLogger('admin-subscription-service');

export interface AdminSubscriptionServiceDeps {
  subscriptionRepo: SubscriptionRepository;
  metadataResolver: PlanMetadataResolver;
  dodoClient: DodoPayments;
}

export class AdminSubscriptionService {
  constructor(private deps: AdminSubscriptionServiceDeps) {}

  /**
   * Update a workspace's subscription by writing merged overrides to
   * DodoPayments subscription metadata. The webhook processor will
   * pick up the changes on the next `subscription.updated` event.
   */
  async updateSubscription(
    workspaceId: string,
    overrides: {
      featureGates?: Partial<PlanFeatureGates>;
      entitlements?: Partial<Record<ResourceType, Partial<ResourceLimits>>>;
    }
  ): Promise<{ subscriptionId: string; updated: boolean }> {
    // 1. Look up local subscription
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw adminError.SUBSCRIPTION_NOT_FOUND();
    }

    const { subscriptionId, productId } = subscription;
    if (!productId) {
      throw adminError.SUBSCRIPTION_NOT_FOUND();
    }

    logger.debug(
      { workspaceId, subscriptionId, productId },
      'Fetching product metadata for admin override'
    );

    // 2. Fetch product metadata (plan defaults)
    const productMetadata = await this.deps.metadataResolver.fetchForProduct(productId);
    if (!productMetadata?.featureLimits || !productMetadata?.featureGates) {
      logger.error(
        { productId, subscriptionId },
        'Missing product metadata for admin subscription update'
      );
      throw adminError.SUBSCRIPTION_UPDATE_FAILED();
    }

    // 3. Merge admin overrides with plan defaults and build flat metadata
    const flatMetadata = mergeAndBuildFlatMetadata(
      {
        featureLimits: productMetadata.featureLimits,
        featureGates: productMetadata.featureGates,
      },
      {
        featureGates: overrides.featureGates,
        featureLimits: overrides.entitlements,
      },
      productMetadata.billingCadence
    );

    // 4. Write merged metadata to DodoPayments subscription
    try {
      await this.deps.dodoClient.subscriptions.update(subscriptionId, {
        metadata: {
          workspace_id: workspaceId,
          snapshot_product_id: productId,
          ...flatMetadata,
        },
      });

      logger.info(
        { workspaceId, subscriptionId },
        'Admin subscription override written to DodoPayments'
      );
    } catch (error) {
      logger.error(
        { workspaceId, subscriptionId, err: error },
        'Failed to update DodoPayments subscription metadata'
      );
      captureException(error, undefined, {
        operation: 'admin_subscription_update',
        workspaceId,
        subscriptionId,
      });
      throw adminError.SUBSCRIPTION_UPDATE_FAILED();
    }

    return { subscriptionId, updated: true };
  }

  /**
   * Extend a workspace's trial period by pushing the next_billing_date
   * forward in DodoPayments. Only valid when the subscription is currently
   * in trial (trialEnd exists and is in the future).
   */
  async extendTrial(
    workspaceId: string,
    extensionDays: number
  ): Promise<{ subscriptionId: string; newTrialEnd: string }> {
    // 1. Look up local subscription
    const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      throw adminError.SUBSCRIPTION_NOT_FOUND();
    }

    const { subscriptionId, trialEnd } = subscription;

    // 2. Verify the subscription is currently in trial
    if (!trialEnd || new Date(trialEnd) <= new Date()) {
      throw adminError.TRIAL_NOT_ACTIVE();
    }

    // 3. Calculate new trial end date
    const currentTrialEnd = new Date(trialEnd);
    const newTrialEnd = new Date(currentTrialEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + extensionDays);

    const newBillingDate = newTrialEnd.toISOString();

    logger.debug(
      { workspaceId, subscriptionId, currentTrialEnd, newTrialEnd: newBillingDate, extensionDays },
      'Extending trial via DodoPayments'
    );

    // 4. Update next_billing_date in DodoPayments
    try {
      await this.deps.dodoClient.subscriptions.update(subscriptionId, {
        next_billing_date: newBillingDate,
      });

      logger.info(
        { workspaceId, subscriptionId, newTrialEnd: newBillingDate },
        'Trial extended via DodoPayments'
      );
    } catch (error) {
      logger.error(
        { workspaceId, subscriptionId, err: error },
        'Failed to extend trial in DodoPayments'
      );
      captureException(error, undefined, {
        operation: 'admin_extend_trial',
        workspaceId,
        subscriptionId,
      });
      throw adminError.TRIAL_EXTENSION_FAILED();
    }

    return { subscriptionId, newTrialEnd: newBillingDate };
  }
}
