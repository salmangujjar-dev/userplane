/**
 * EntitlementService - Business logic for entitlement operations
 *
 * Handles:
 * - Provisioning entitlements for new workspaces (free plan from config, paid plans from metadata)
 * - Updating entitlements on plan changes (from Dodo product metadata)
 * - Checking and enforcing resource limits (generic canConsume / consume)
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
import type { DodoFeatureLimits } from '@workspace/payments/types';
import type { BillingCadence, PlanId, PlanName, ResourceType } from '@workspace/pricing';
import {
  calculateFairShareLimit,
  FREE_PLAN_ENTITLEMENTS,
  PERIOD_BASED_RESOURCES,
  PLAN_NAMES,
  RESOURCE_TYPE_VALUES,
  UNLIMITED_QUOTED_LIMIT,
} from '@workspace/pricing';

import type { EntitlementRepository } from '@/api/repositories/entitlements.repository';
import type { BillingService } from '@/api/services/billing.service';
import type { Transaction } from '@/api/types';

import type { AddonMapper } from './addon-mapper';

export interface EntitlementServiceDeps {
  entitlementRepo: EntitlementRepository;
  billingService: BillingService;
  addonMapper: AddonMapper;
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

  private buildEntitlementData(
    featureLimits: DodoFeatureLimits,
    addons: AddonItem[] = [],
    billingCadence?: BillingCadence | null
  ) {
    const additionalSeats = this.deps.addonMapper.getAdditionalSeats(addons);

    return RESOURCE_TYPE_VALUES.map((resourceType) => {
      const base = featureLimits[resourceType];
      if (resourceType !== 'seats') {
        return {
          resourceType,
          quotedLimit: base.quotedLimit,
          actualLimit: base.actualLimit,
          ...(billingCadence !== undefined && { billingCadence }),
        };
      }

      return {
        resourceType,
        quotedLimit: base.quotedLimit + additionalSeats,
        actualLimit: base.actualLimit + additionalSeats,
        ...(billingCadence !== undefined && { billingCadence }),
      };
    });
  }

  /**
   * Reusable function for entitlement threshold math
   * Computes whether consumption is allowed based on the actual limit
   */
  private checkLimitThresholds(
    consumed: number,
    actualLimit: number,
    amount: number
  ): { canConsume: boolean } {
    const newTotal = consumed + amount;
    return {
      canConsume: newTotal <= actualLimit,
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
      actualLimit: FREE_PLAN_ENTITLEMENTS[resourceType].actualLimit,
      billingCadence: null as BillingCadence | null,
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
    options?: { tx?: Transaction; addons?: AddonItem[]; billingCadence?: BillingCadence | null }
  ): Promise<void> {
    const entitlementData = this.buildEntitlementData(
      featureLimits,
      options?.addons,
      options?.billingCadence
    );

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
    options?: { tx?: Transaction; addons?: AddonItem[]; billingCadence?: BillingCadence | null }
  ): Promise<void> {
    const entitlementData = this.buildEntitlementData(
      featureLimits,
      options?.addons,
      options?.billingCadence
    );

    await this.deps.entitlementRepo.upsertMany(workspaceId, entitlementData, {
      tx: options?.tx,
      preserveConsumed: true,
    });

    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  // --- Generic resource consumption methods ---

  /**
   * Check if workspace can consume a resource (enforcement)
   *
   * Enforcement logic:
   * - Checks subscription access status (cancellation, on_hold grace period)
   * - Enforces: current usage + amount <= actualLimit (absolute ceiling)
   *
   * Returns -1 actualLimit as unlimited
   */
  async canConsume(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1
  ): Promise<CanConsumeResult> {
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
    let effectiveActualLimit = entitlement.actualLimit;

    // Apply fair-share for annual cadence on period-based resources
    const billingCadence = entitlement.billingCadence;
    if (
      billingCadence === 'annual' &&
      (PERIOD_BASED_RESOURCES as readonly string[]).includes(resourceType)
    ) {
      const subscriptionStatus = await this.deps.billingService.getSubscriptionStatus(workspaceId);
      const currentPeriodStart = subscriptionStatus.contractDetail.currentPeriodStart;
      effectiveActualLimit = calculateFairShareLimit(
        entitlement.actualLimit,
        billingCadence,
        currentPeriodStart
      );
    }

    const thresholds = this.checkLimitThresholds(current, effectiveActualLimit, amount);

    if (!thresholds.canConsume) {
      const reason = this.getSubscriptionAccessDeniedReason(
        accessStatus.accessStatus,
        current,
        effectiveActualLimit
      );

      return {
        allowed: false,
        reason,
        current,
        limit: effectiveActualLimit,
      };
    }

    return {
      allowed: true,
      current,
      limit: effectiveActualLimit,
    };
  }

  /**
   * Record resource consumption
   * Called after successful resource creation
   * Invalidates usage summary cache after consumption
   */
  async consume(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.deps.entitlementRepo.incrementConsumed(workspaceId, resourceType, amount, options);
    await this.deps.cacheService.invalidateUsage(workspaceId);
  }

  // --- Resource-specific aliases (retained for existing callers) ---

  async canConsumeSeats(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.canConsume(workspaceId, 'seats', amount);
  }

  async consumeSeats(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.consume(workspaceId, 'seats', amount, options);
  }

  async canConsumeRecordings(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.canConsume(workspaceId, 'recordings', amount);
  }

  async consumeRecordings(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.consume(workspaceId, 'recordings', amount, options);
  }

  async canConsumeLinks(workspaceId: string, amount: number = 1): Promise<CanConsumeResult> {
    return this.canConsume(workspaceId, 'links', amount);
  }

  async consumeLinks(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.consume(workspaceId, 'links', amount, options);
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
    const cached = await this.deps.cacheService.getUsageSummary(workspaceId);
    if (cached) {
      return cached as UsageSummary;
    }

    const result = await this._computeUsageSummary(workspaceId);
    await this.deps.cacheService.setUsageSummary(workspaceId, result);
    return result;
  }

  /**
   * Internal method to compute usage summary from database
   * Reads quotedLimit from the entitlement row's DB column (not hardcoded config)
   */
  private async _computeUsageSummary(workspaceId: string): Promise<UsageSummary> {
    const entitlementsList = await this.deps.entitlementRepo.findByWorkspaceId(workspaceId);

    const accessStatus = await this.deps.billingService.getSubscriptionAccessStatus(workspaceId);
    const effectivePlanId = accessStatus.effectivePlanId as PlanId;
    const planName = (PLAN_NAMES[effectivePlanId] || 'Free') as PlanName;

    const resources = {} as Record<ResourceType, ResourceUsage>;

    for (const resourceType of RESOURCE_TYPE_VALUES) {
      const entitlement = entitlementsList.find((e) => e.resourceType === resourceType);
      let quotedLimit = entitlement?.quotedLimit ?? 0;

      // For annual plans on period-based resources, show monthly fair share (limit / 12)
      const billingCadence = entitlement?.billingCadence ?? null;
      if (
        billingCadence === 'annual' &&
        quotedLimit > 0 &&
        quotedLimit !== UNLIMITED_QUOTED_LIMIT &&
        (PERIOD_BASED_RESOURCES as readonly string[]).includes(resourceType)
      ) {
        quotedLimit = Math.floor(quotedLimit / 12);
      }

      if (entitlement) {
        const consumed = entitlement.resourceConsumed;

        let percentUsed = 0;
        if (quotedLimit === UNLIMITED_QUOTED_LIMIT) {
          percentUsed = 13;
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
        actualLimit: update.actualLimit ?? existing.actualLimit,
      };

      await this.deps.entitlementRepo.updateLimits(
        workspaceId,
        update.resourceType as ResourceType,
        newLimits
      );
    }

    await this.deps.cacheService.invalidateUsage(workspaceId);
    return this.deps.entitlementRepo.findByWorkspaceId(workspaceId);
  }

  /**
   * Get user-friendly reason for access denial based on subscription status
   */
  private getSubscriptionAccessDeniedReason(
    accessStatus: SubscriptionAccessStatus['accessStatus'],
    currentUsage: number,
    effectiveActualLimit: number
  ): string {
    switch (accessStatus) {
      case 'active':
        return `Resource limit reached (${currentUsage}/${effectiveActualLimit})`;
      case 'trial':
        return `Resource limit reached (${currentUsage}/${effectiveActualLimit})`;
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
}
