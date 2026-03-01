/**
 * PlanMetadataResolver - Resolve plan metadata for subscriptions
 *
 * Prefer the immutable snapshot embedded at checkout time; fall back to a
 * live Dodo product fetch for legacy subscriptions, plan-change-via-API
 * subscriptions, or any case where the snapshot is absent/incomplete.
 *
 * After a live fetch the metadata is backfilled onto the Dodo subscription
 * so every subsequent webhook carries the snapshot directly.
 */

import type { getDodoPaymentsClient } from '@userplane/payments/client';
import {
  buildFlatMetadata,
  fetchProductMetadata,
  parseFlatMetadata,
} from '@userplane/payments/metadata';
import type { DodoSubscription, ProductPlanMetadata } from '@userplane/payments/types';

import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';

const logger = createLogger('plan-metadata-resolver');

export interface PlanMetadataResolverDeps {
  dodoClient?: ReturnType<typeof getDodoPaymentsClient>;
}

export class PlanMetadataResolver {
  constructor(private deps: PlanMetadataResolverDeps) {}

  /**
   * Resolve plan metadata for a subscription.
   *
   * Tries the embedded snapshot first. If that's missing or stale (product ID
   * mismatch after a plan change), falls back to a live product fetch.
   */
  resolveForSubscription(subscription: DodoSubscription): Promise<ProductPlanMetadata | null> {
    const embedded = this.parseEmbeddedMetadata(subscription);
    if (embedded) {
      return Promise.resolve(embedded);
    }
    return this.fetchForProduct(subscription.product_id);
  }

  /**
   * Fetch plan metadata from the Dodo product API.
   */
  async fetchForProduct(productId: string): Promise<ProductPlanMetadata | null> {
    try {
      if (this.deps.dodoClient) {
        return await fetchProductMetadata(this.deps.dodoClient, productId);
      }
    } catch (error) {
      logger.error({ err: error, productId }, 'Failed to fetch product metadata');
      captureException(error, undefined, {
        operation: 'fetch_product_metadata',
        productId,
      });
    }
    return null;
  }

  /**
   * Fire-and-forget: write the live-fetched plan metadata back onto the Dodo
   * subscription so every subsequent webhook carries an embedded snapshot and
   * avoids another product fetch.
   *
   * Called after a live product fetch — never awaited on the critical path.
   * If it fails the next webhook simply live-fetches again; no data is lost.
   */
  backfillSnapshot(
    subscriptionId: string,
    workspaceId: string,
    productId: string,
    metadata: ProductPlanMetadata
  ): void {
    if (!this.deps.dodoClient || !metadata.featureLimits || !metadata.featureGates) return;

    const flatMetadata = buildFlatMetadata(
      metadata.featureLimits,
      metadata.featureGates,
      metadata.billingCadence
    );

    void this.deps.dodoClient.subscriptions
      .update(subscriptionId, {
        metadata: {
          workspace_id: workspaceId,
          snapshot_product_id: productId,
          ...flatMetadata,
        },
      })
      .then(() => {
        logger.debug({ subscriptionId }, 'Backfilled subscription metadata snapshot on Dodo');
      })
      .catch((error: unknown) => {
        logger.warn(
          { subscriptionId, err: error },
          'Failed to backfill subscription metadata (non-fatal)'
        );
        captureException(error, undefined, {
          operation: 'backfill_subscription_metadata',
          subscriptionId,
        });
      });
  }

  /**
   * Try to parse the plan metadata snapshot embedded in the subscription at
   * checkout time.
   *
   * Returns null when:
   * - The snapshot is absent or incomplete (legacy subscriptions, failed
   *   product fetch at checkout)
   * - `snapshot_product_id` doesn't match the subscription's current product
   *   — this is the plan-change case where DodoPayments carries the old
   *   checkout's snapshot forward to the new subscription. Without this guard
   *   we'd apply Plan A entitlements to a Plan B subscription.
   */
  private parseEmbeddedMetadata(subscription: DodoSubscription): ProductPlanMetadata | null {
    const raw = (subscription.metadata ?? {}) as Record<string, unknown>;

    // Require an exact product match so plan-change subscriptions fall through to a live fetch.
    const snapshotProductId = raw['snapshot_product_id'];
    if (!snapshotProductId || snapshotProductId !== subscription.product_id) {
      return null;
    }

    const parsed = parseFlatMetadata(raw);
    if (parsed.featureLimits && parsed.featureGates) {
      return parsed;
    }
    return null;
  }
}
