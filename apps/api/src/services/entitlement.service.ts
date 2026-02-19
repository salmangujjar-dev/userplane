/**
 * EntitlementService - Business logic for entitlement operations
 *
 * Handles:
 * - Provisioning entitlements for new workspaces (free plan from config, paid plans from metadata)
 * - Updating entitlements on plan changes (from Dodo product metadata)
 * - Checking and enforcing resource limits
 * - Tracking resource consumption
 * - Providing usage summaries for UI
 * - Caching usage summaries for dashboard performance
 */

import type { CacheService } from '@workspace/cache';
import type {
  AddonItem,
  AdminUpdateEntitlementItem,
  SubscriptionAccessStatus,
} from '@workspace/contract';
import { isSeatsAddonId } from '@workspace/payments';
import type { DodoFeatureLimits } from '@workspace/payments/types';
import type { PlanId, PlanName, ResourceType } from '@workspace/pricing';
import {
  FREE_PLAN_ENTITLEMENTS,
  getCooldownMultiplier,
  PLAN_NAMES,
  RESOURCE_TYPE_VALUES,
  UNLIMITED_QUOTED_LIMIT,
} from '@workspace/pricing';

import type { EntitlementRepository } from '@/api/repositories/entitlements.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import type { BillingService } from '@/api/services/billing.service';
import type { Transaction } from '@/api/types';

export interface EntitlementServiceDeps {
  entitlementRepo: EntitlementRepository;
  billingService: BillingService;
  subscriptionRepo: SubscriptionRepository;
  cacheService: CacheService;
}

/**
 * Result from checking if resource can be consumed
 * - allowed: Whether the consumption is permitted
 * - reason: Human-readable reason if not allowed (for UI display)
 * - current: Current resource consumption (resourceConsumed)
 * - limit: Hard limit (absolute ceiling, -1 for unlimited)
 */
export interface CanConsumeResult {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
}

/**
 * Resource usage details for UI
 * - consumed: Current resource consumption (resourceConsumed)
 * - limit: Quoted limit (advertised/displayed limit for users, -1 for unlimited)
 * - percentUsed: Percentage of quoted limit consumed
 */
export interface ResourceUsage {
  consumed: number;
  limit: number;
  percentUsed: number;
}

/**
 * Complete usage summary for a workspace
 */
export interface UsageSummary {
  planId: PlanId;
  planName: PlanName;
  resources: Record<ResourceType, ResourceUsage>;
}

export class EntitlementService {
  constructor(private deps: EntitlementServiceDeps) {}

  private getAdditionalSeatsFromAddons(addons: AddonItem[] = []): number {
    const seatsAddon = addons.find((addon) => isSeatsAddonId(addon.addonId));
    return (seatsAddon?.quantity ?? 0) * 5;
  }

  private buildEntitlementData(featureLimits: DodoFeatureLimits, addons: AddonItem[] = []) {
    const additionalSeats = this.getAdditionalSeatsFromAddons(addons);

    return RESOURCE_TYPE_VALUES.map((resourceType) => {
      const base = featureLimits[resourceType];
      if (resourceType !== 'seats') {
        return {
          resourceType,
          quotedLimit: base.quotedLimit,
          softLimit: base.softLimit,
          hardLimit: base.hardLimit,
        };
      }

      return {
        resourceType,
        quotedLimit: base.quotedLimit + additionalSeats,
        softLimit: base.softLimit + additionalSeats,
        hardLimit: base.hardLimit + additionalSeats,
      };
    });
  }

  /**
   * Reusable function for entitlement threshold math
   * Computes whether consumption is allowed and which thresholds are exceeded
   */
  private checkLimitThresholds(
    consumed: number,
    softLimit: number,
    hardLimit: number,
    amount: number
  ): { canConsume: boolean; exceedsSoftLimit: boolean; exceedsHardLimit: boolean } {
    const newTotal = consumed + amount;
    return {
      canConsume: newTotal <= hardLimit,
      exceedsSoftLimit: newTotal > softLimit,
      exceedsHardLimit: newTotal > hardLimit,
    };
  }

  /**
   * Provision entitlements for free plan
   * Called when a new workspace is created (before any subscription)
   * Uses hardcoded FREE_PLAN_ENTITLEMENTS since free plan has no Dodo product
   */
  async provisionFreePlan(workspaceId: string, options?: { tx?: Transaction }): Promise<void> {
    const entitlementData = RESOURCE_TYPE_VALUES.map((resourceType) => ({
      resourceType,
      quotedLimit: FREE_PLAN_ENTITLEMENTS[resourceType].quotedLimit,
      softLimit: FREE_PLAN_ENTITLEMENTS[resourceType].softLimit,
      hardLimit: FREE_PLAN_ENTITLEMENTS[resourceType].hardLimit,
    }));

    await this.deps.entitlementRepo.upsertMany(workspaceId, entitlementData, {
      tx: options?.tx,
      preserveConsumed: false,
    });

    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  /**
   * Provision entitlements from Dodo product metadata
   * Called when a new subscription is created
   * Reads limits from the featureLimits parameter (fetched from Dodo API)
   */
  async provisionFromMetadata(
    workspaceId: string,
    featureLimits: DodoFeatureLimits,
    options?: { tx?: Transaction; addons?: AddonItem[] }
  ): Promise<void> {
    const entitlementData = this.buildEntitlementData(featureLimits, options?.addons);

    await this.deps.entitlementRepo.upsertMany(workspaceId, entitlementData, {
      tx: options?.tx,
      preserveConsumed: false,
    });

    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  /**
   * Update entitlements from Dodo product metadata on plan change
   * Preserves consumption but updates limits from metadata
   */
  async updateFromMetadata(
    workspaceId: string,
    featureLimits: DodoFeatureLimits,
    options?: { tx?: Transaction; addons?: AddonItem[] }
  ): Promise<void> {
    const entitlementData = this.buildEntitlementData(featureLimits, options?.addons);

    await this.deps.entitlementRepo.upsertMany(workspaceId, entitlementData, {
      tx: options?.tx,
      preserveConsumed: true,
    });

    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  /**
   * Internal method to check if workspace can consume a resource (enforcement)
   *
   * Enforcement logic:
   * - Checks subscription access status (cancellation, on_hold grace period)
   * - Enforces: current usage + amount <= hardLimit (absolute ceiling)
   *
   * Soft limit warnings:
   * - TODO: Trigger warning email when current usage >= softLimit
   *
   * Returns -1 hardLimit as unlimited
   */
  private async checkCanConsume(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1
  ): Promise<CanConsumeResult> {
    // Check subscription access status first
    const accessStatus = await this.deps.billingService.getSubscriptionAccessStatus(workspaceId);

    const entitlement = await this.deps.entitlementRepo.findByWorkspaceAndResource(
      workspaceId,
      resourceType
    );

    if (!entitlement) {
      return {
        allowed: false,
        reason: 'No entitlement found for this resource',
        current: 0,
        limit: 0,
      };
    }

    const current = entitlement.resourceConsumed;
    let effectiveHardLimit = entitlement.hardLimit;
    let effectiveSoftLimit = entitlement.softLimit;

    // Apply cooldown if subscription is active (progressive unlock for new subscriptions)
    let cooldownMultiplier = 1.0;
    if (accessStatus.accessStatus === 'active') {
      const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
      if (subscription?.createdAt && subscription?.planId) {
        cooldownMultiplier = getCooldownMultiplier(
          subscription.createdAt,
          subscription.planId as PlanId
        );
        if (cooldownMultiplier < 1.0) {
          effectiveHardLimit = Math.floor(effectiveHardLimit * cooldownMultiplier);
          effectiveSoftLimit = Math.floor(effectiveSoftLimit * cooldownMultiplier);
        }
      }
    }

    // Use reusable threshold function for consistent math
    const thresholds = this.checkLimitThresholds(
      current,
      effectiveSoftLimit,
      effectiveHardLimit,
      amount
    );

    if (!thresholds.canConsume) {
      const reason = this.getSubscriptionAccessDeniedReason(
        accessStatus.accessStatus,
        cooldownMultiplier,
        current,
        effectiveHardLimit
      );

      return {
        allowed: false,
        reason,
        current,
        limit: effectiveHardLimit,
      };
    }

    return {
      allowed: true,
      current,
      limit: effectiveHardLimit,
    };
  }

  /**
   * Get user-friendly reason for access denial based on subscription status
   */
  private getSubscriptionAccessDeniedReason(
    accessStatus: SubscriptionAccessStatus['accessStatus'],
    cooldownMultiplier: number,
    currentUsage: number,
    effectiveHardLimit: number
  ): string {
    switch (accessStatus) {
      case 'active':
        return cooldownMultiplier < 1.0
          ? `Subscription in ramp-up period (${Math.floor(cooldownMultiplier * 100)}% capacity). Limit: ${effectiveHardLimit}`
          : `Resource limit reached (${currentUsage}/${effectiveHardLimit})`;
      case 'inactive':
        return 'No active subscription. Upgrade to access more resources.';
      case 'grace':
        return 'Subscription in grace period. Update payment or reactivate to continue.';
      case 'disputed':
        return 'Your subscription is under review due to a payment dispute. Please contact support.';
      case 'refunded':
        return 'Your subscription payment was refunded. Please contact support to reactivate.';
      default:
        return 'Subscription access denied.';
    }
  }

  /**
   * Internal method to record resource consumption
   * Called after successful resource creation
   * Invalidates usage summary cache after consumption
   */
  private async recordConsumption(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.deps.entitlementRepo.incrementConsumed(workspaceId, resourceType, amount, options);
    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  // Explicit consumption methods for each resource type

  async canConsumeSeats(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.checkCanConsume(workspaceId, 'seats', amount);
  }

  async consumeSeats(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.recordConsumption(workspaceId, 'seats', amount, options);
  }

  async canConsumeRecordings(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.checkCanConsume(workspaceId, 'recordings', amount);
  }

  async consumeRecordings(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.recordConsumption(workspaceId, 'recordings', amount, options);
  }

  async canConsumeScreenshots(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.checkCanConsume(workspaceId, 'screenshots', amount);
  }

  async consumeScreenshots(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.recordConsumption(workspaceId, 'screenshots', amount, options);
  }

  async canConsumeFiles(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.checkCanConsume(workspaceId, 'files', amount);
  }

  async consumeFiles(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.recordConsumption(workspaceId, 'files', amount, options);
  }

  async canConsumeLinks(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.checkCanConsume(workspaceId, 'links', amount);
  }

  async consumeLinks(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.recordConsumption(workspaceId, 'links', amount, options);
  }

  /**
   * Release seats when members leave workspace
   * Seats are the only resource that can decrease (other resources only grow or reset)
   * Invalidates usage summary cache after release
   */
  async releaseSeats(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.deps.entitlementRepo.decrementConsumed(workspaceId, 'seats', amount, options);
    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  /**
   * Get usage summary for all resources (for UI)
   * Uses billing service to determine effective plan based on subscription access status
   * Supports caching for dashboard performance
   */
  async getUsageSummary(workspaceId: string): Promise<UsageSummary> {
    // Try cache first
    const cached = await this.deps.cacheService.getUsageSummary(workspaceId);
    if (cached) {
      return cached as UsageSummary;
    }

    // Compute usage summary from database
    const result = await this._computeUsageSummary(workspaceId);

    // Cache the result
    await this.deps.cacheService.setUsageSummary(workspaceId, result);

    return result;
  }

  /**
   * Internal method to compute usage summary from database
   * Reads quotedLimit from the entitlement row's DB column (not hardcoded config)
   */
  private async _computeUsageSummary(workspaceId: string): Promise<UsageSummary> {
    const entitlementsList = await this.deps.entitlementRepo.findByWorkspaceId(workspaceId);

    // Get effective plan from billing service (handles subscription state logic)
    const accessStatus = await this.deps.billingService.getSubscriptionAccessStatus(workspaceId);
    const effectivePlanId = accessStatus.effectivePlanId as PlanId;
    const planName = (PLAN_NAMES[effectivePlanId] || 'Free') as PlanName;

    // Build resource usage map
    const resources = {} as Record<ResourceType, ResourceUsage>;

    for (const resourceType of RESOURCE_TYPE_VALUES) {
      const entitlement = entitlementsList.find((e) => e.resourceType === resourceType);
      // Read quotedLimit from DB column (populated by metadata or free plan config)
      const quotedLimit = entitlement?.quotedLimit ?? 0;

      if (entitlement) {
        const consumed = entitlement.resourceConsumed;

        // Calculate percent used against quotedLimit for user-facing display
        // Handle -1 (unlimited) by showing small arbitrary percentage (13%) for clean UI rendering
        let percentUsed = 0;
        if (quotedLimit === UNLIMITED_QUOTED_LIMIT) {
          percentUsed = 13; // Small arbitrary percentage for "unlimited" plans
        } else if (quotedLimit > 0) {
          percentUsed = Math.round((consumed / quotedLimit) * 100);
        }

        resources[resourceType] = {
          consumed,
          limit: quotedLimit,
          percentUsed,
        };
      } else {
        resources[resourceType] = {
          consumed: 0,
          limit: quotedLimit,
          percentUsed: 0,
        };
      }
    }

    return {
      planId: effectivePlanId,
      planName,
      resources,
    };
  }

  /**
   * Reset period-based usage (recordings)
   * Called on subscription renewal
   * Invalidates usage summary cache after reset
   */
  async resetPeriodUsage(workspaceId: string, options?: { tx?: Transaction }): Promise<void> {
    await this.deps.entitlementRepo.resetPeriodResources(workspaceId, options);
    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  /**
   * Get all raw entitlements for a workspace (admin use)
   */
  async getAllEntitlements(workspaceId: string) {
    return this.deps.entitlementRepo.findByWorkspaceId(workspaceId);
  }

  /**
   * Admin update entitlement limits for a workspace
   * Applies partial updates (only specified fields) per resource type.
   * Invalidates usage cache and returns fresh state.
   */
  async adminUpdateEntitlements(workspaceId: string, updates: AdminUpdateEntitlementItem[]) {
    for (const update of updates) {
      const existing = await this.deps.entitlementRepo.findByWorkspaceAndResource(
        workspaceId,
        update.resourceType as ResourceType
      );

      if (!existing) continue;

      const newLimits = {
        quotedLimit: update.quotedLimit ?? existing.quotedLimit,
        softLimit: update.softLimit ?? existing.softLimit,
        hardLimit: update.hardLimit ?? existing.hardLimit,
      };

      await this.deps.entitlementRepo.updateLimits(
        workspaceId,
        update.resourceType as ResourceType,
        newLimits
      );
    }

    // Invalidate usage cache after update
    await this.deps.cacheService.invalidateUsage(workspaceId);

    // Return fresh state
    return this.deps.entitlementRepo.findByWorkspaceId(workspaceId);
  }
}
