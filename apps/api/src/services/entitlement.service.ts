/**
 * EntitlementService - Business logic for entitlement operations
 *
 * Handles:
 * - Provisioning entitlements for new workspaces
 * - Updating entitlements on plan changes
 * - Checking and enforcing resource limits
 * - Tracking resource consumption
 * - Providing usage summaries for UI
 */

import type { PlanId, PlanName, ResourceType } from '@workspace/pricing';
import { PLAN_ENTITLEMENTS, PLAN_NAMES, RESOURCE_TYPE_VALUES } from '@workspace/pricing';

import type { EntitlementRepository } from '@/api/repositories/entitlements.repository';
import type { BillingService, SubscriptionAccessStatus } from '@/api/services/billing.service';
import type { Transaction } from '@/api/types';

export interface EntitlementServiceDeps {
  entitlementRepo: EntitlementRepository;
  billingService?: BillingService;
}

/**
 * Result of a consumption check
 */
export interface CanConsumeResult {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  isUnlimited: boolean;
  accessStatus?: SubscriptionAccessStatus;
}

/**
 * Resource usage details for UI
 */
export interface ResourceUsage {
  consumed: number;
  limit: number;
  isUnlimited: boolean;
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

  /**
   * Provision entitlements for a workspace based on plan
   * Called when: workspace created, subscription activated
   */
  async provisionForPlan(
    workspaceId: string,
    planId: PlanId,
    options?: { tx?: Transaction }
  ): Promise<void> {
    const planEntitlements = PLAN_ENTITLEMENTS[planId];

    if (!planEntitlements) {
      throw new Error(`Unknown plan ID: ${planId}`);
    }

    const entitlementData = RESOURCE_TYPE_VALUES.map((resourceType) => ({
      resourceType,
      quotedLimit: planEntitlements[resourceType].quotedLimit,
      softLimit: planEntitlements[resourceType].softLimit,
      hardLimit: planEntitlements[resourceType].hardLimit,
    }));

    await this.deps.entitlementRepo.upsertMany(workspaceId, entitlementData, {
      tx: options?.tx,
      preserveConsumed: false, // New provisioning, start fresh
    });
  }

  /**
   * Update entitlements when plan changes (upgrade/downgrade)
   * Preserves consumption but updates limits
   */
  async updateForPlan(
    workspaceId: string,
    newPlanId: PlanId,
    options?: { tx?: Transaction }
  ): Promise<void> {
    const planEntitlements = PLAN_ENTITLEMENTS[newPlanId];

    if (!planEntitlements) {
      throw new Error(`Unknown plan ID: ${newPlanId}`);
    }

    const entitlementData = RESOURCE_TYPE_VALUES.map((resourceType) => ({
      resourceType,
      quotedLimit: planEntitlements[resourceType].quotedLimit,
      softLimit: planEntitlements[resourceType].softLimit,
      hardLimit: planEntitlements[resourceType].hardLimit,
    }));

    await this.deps.entitlementRepo.upsertMany(workspaceId, entitlementData, {
      tx: options?.tx,
      preserveConsumed: true, // Plan change, preserve usage
    });
  }

  /**
   * Check if workspace can consume a resource (enforcement)
   * First checks subscription access status (cancellation, on_hold grace period)
   * Then compares consumed + amount against hardLimit
   * Returns -1 hardLimit as unlimited
   */
  async canConsume(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1
  ): Promise<CanConsumeResult> {
    // Check subscription access status first
    let accessStatus: SubscriptionAccessStatus | undefined;

    if (this.deps.billingService) {
      accessStatus = await this.deps.billingService.getSubscriptionAccessStatus(workspaceId);

      // If subscription access is revoked, use free plan limits
      if (!accessStatus.hasAccess) {
        // Get free plan limits for this resource
        const freePlanLimits = PLAN_ENTITLEMENTS['free']?.[resourceType];
        const freeLimit = freePlanLimits?.hardLimit ?? 0;

        // Get current consumption
        const entitlement = await this.deps.entitlementRepo.findByWorkspaceAndResource(
          workspaceId,
          resourceType
        );
        const currentConsumed = entitlement?.resourceConsumed ?? 0;

        // Check against free plan limits
        if (freeLimit !== -1 && currentConsumed + amount > freeLimit) {
          return {
            allowed: false,
            reason: this.getAccessDeniedReason(accessStatus.reason),
            current: currentConsumed,
            limit: freeLimit,
            isUnlimited: false,
            accessStatus,
          };
        }

        // If within free limits, still allow
        return {
          allowed: freeLimit === -1 || currentConsumed + amount <= freeLimit,
          reason:
            freeLimit !== -1 && currentConsumed + amount > freeLimit
              ? this.getAccessDeniedReason(accessStatus.reason)
              : undefined,
          current: currentConsumed,
          limit: freeLimit,
          isUnlimited: freeLimit === -1,
          accessStatus,
        };
      }
    }

    const entitlement = await this.deps.entitlementRepo.findByWorkspaceAndResource(
      workspaceId,
      resourceType
    );

    if (!entitlement) {
      // No entitlement found - default to disallowed
      return {
        allowed: false,
        reason: 'No entitlement found for this resource',
        current: 0,
        limit: 0,
        isUnlimited: false,
        accessStatus,
      };
    }

    const current = entitlement.resourceConsumed + entitlement.resourceCredited;
    const limit = entitlement.hardLimit;
    const isUnlimited = limit === -1;

    // Unlimited = always allowed
    if (isUnlimited) {
      return {
        allowed: true,
        current,
        limit,
        isUnlimited: true,
        accessStatus,
      };
    }

    // Check if adding amount would exceed hard limit
    const newTotal = entitlement.resourceConsumed + amount;
    const effectiveLimit = limit + entitlement.resourceCredited;

    if (newTotal > effectiveLimit) {
      return {
        allowed: false,
        reason: `Resource limit reached (${current}/${effectiveLimit})`,
        current: entitlement.resourceConsumed,
        limit: effectiveLimit,
        isUnlimited: false,
        accessStatus,
      };
    }

    return {
      allowed: true,
      current: entitlement.resourceConsumed,
      limit: effectiveLimit,
      isUnlimited: false,
      accessStatus,
    };
  }

  /**
   * Get user-friendly reason for access denial based on subscription status
   */
  private getAccessDeniedReason(reason: SubscriptionAccessStatus['reason']): string {
    switch (reason) {
      case 'expired':
        return 'Your subscription has expired. Please renew to continue.';
      case 'revoked':
        return 'Your subscription access has been revoked due to payment issues.';
      case 'no_subscription':
        return 'No active subscription. Upgrade to access more resources.';
      default:
        return 'Subscription access denied.';
    }
  }

  /**
   * Record resource consumption
   * Called after successful resource creation
   */
  async consume(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.deps.entitlementRepo.incrementConsumed(workspaceId, resourceType, amount, options);
  }

  /**
   * Release resource (e.g., when recording deleted)
   */
  async release(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.deps.entitlementRepo.decrementConsumed(workspaceId, resourceType, amount, options);
  }

  /**
   * Get usage summary for all resources (for UI)
   * Uses billing service to determine effective plan based on subscription access status
   */
  async getUsageSummary(workspaceId: string): Promise<UsageSummary> {
    const entitlementsList = await this.deps.entitlementRepo.findByWorkspaceId(workspaceId);

    // Get effective plan from billing service (handles subscription state logic)
    let effectivePlanId: PlanId = 'free';
    let planName: PlanName = 'Free';

    if (this.deps.billingService) {
      const accessStatus = await this.deps.billingService.getSubscriptionAccessStatus(workspaceId);
      effectivePlanId = accessStatus.effectivePlanId as PlanId;
      planName = (PLAN_NAMES[effectivePlanId] || 'Free') as PlanName;
    }

    // Build resource usage map
    const resources = {} as Record<ResourceType, ResourceUsage>;

    for (const resourceType of RESOURCE_TYPE_VALUES) {
      const entitlement = entitlementsList.find((e) => e.resourceType === resourceType);

      if (entitlement) {
        const consumed = entitlement.resourceConsumed;
        const limit = entitlement.quotedLimit;
        const isUnlimited = entitlement.hardLimit === -1;

        // Calculate percent used against limit for user-facing display
        let percentUsed = 0;
        if (!isUnlimited && limit > 0) {
          percentUsed = Math.round((consumed / limit) * 100);
        }

        resources[resourceType] = {
          consumed,
          limit,
          isUnlimited,
          percentUsed,
        };
      } else {
        // No entitlement - use plan defaults or zeros
        const planDefaults = PLAN_ENTITLEMENTS[effectivePlanId]?.[resourceType];

        if (planDefaults) {
          const isUnlimited = planDefaults.hardLimit === -1;
          resources[resourceType] = {
            consumed: 0,
            limit: planDefaults.quotedLimit,
            isUnlimited,
            percentUsed: 0,
          };
        } else {
          // Fallback to zeros
          resources[resourceType] = {
            consumed: 0,
            limit: 0,
            isUnlimited: false,
            percentUsed: 0,
          };
        }
      }
    }

    return {
      planId: effectivePlanId,
      planName,
      resources,
    };
  }

  /**
   * Reset period-based usage (recordings, logs)
   * Called on subscription renewal
   */
  async resetPeriodUsage(workspaceId: string, options?: { tx?: Transaction }): Promise<void> {
    await this.deps.entitlementRepo.resetPeriodResources(workspaceId, options);
  }

  /**
   * Sync current member count to entitlements
   * Used to initialize seat consumption based on actual members
   */
  async syncSeatCount(
    workspaceId: string,
    memberCount: number,
    options?: { tx?: Transaction }
  ): Promise<void> {
    const entitlement = await this.deps.entitlementRepo.findByWorkspaceAndResource(
      workspaceId,
      'seats',
      options
    );

    if (entitlement) {
      // Reset and set to actual count
      await this.deps.entitlementRepo.resetConsumed(workspaceId, 'seats', options);
      if (memberCount > 0) {
        await this.deps.entitlementRepo.incrementConsumed(
          workspaceId,
          'seats',
          memberCount,
          options
        );
      }
    }
  }
}
