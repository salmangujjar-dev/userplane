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

import type { SubscriptionAccessStatus } from '@workspace/contract';
import type { PlanId, PlanName, ResourceType } from '@workspace/pricing';
import {
  getCooldownMultiplier,
  PLAN_ENTITLEMENTS,
  PLAN_NAMES,
  RESOURCE_TYPE_VALUES,
} from '@workspace/pricing';

import type { EntitlementRepository } from '@/api/repositories/entitlements.repository';
import type { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import type { BillingService } from '@/api/services/billing.service';
import type { Transaction } from '@/api/types';

export interface EntitlementServiceDeps {
  entitlementRepo: EntitlementRepository;
  billingService: BillingService;
  subscriptionRepo: SubscriptionRepository;
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
      creditLimit: planEntitlements[resourceType].creditLimit,
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
      creditLimit: planEntitlements[resourceType].creditLimit,
      softLimit: planEntitlements[resourceType].softLimit,
      hardLimit: planEntitlements[resourceType].hardLimit,
    }));

    await this.deps.entitlementRepo.upsertMany(workspaceId, entitlementData, {
      tx: options?.tx,
      preserveConsumed: true, // Plan change, preserve usage
    });
  }

  /**
   * Internal method to check if workspace can consume a resource (enforcement)
   *
   * Enforcement logic:
   * - Checks subscription access status (cancellation, on_hold grace period)
   * - Enforces: current usage + amount <= hardLimit (absolute ceiling)
   * - Limits are clean values that may have been adjusted via applyCredits()
   *
   * Credit system:
   * - creditLimit: Additional capacity from plan (pool of unused credits)
   * - Use applyCredits() to consume from creditLimit and increase soft/hard limits
   * - This keeps enforcement simple: just check current usage vs adjusted limits
   * - Invariant: current usage < softLimit < hardLimit
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

    // If subscription access is revoked, use free plan limits
    if (accessStatus.effectivePlanId === 'free') {
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
          reason: this.getAccessDeniedReason(accessStatus.accessStatus),
          current: currentConsumed,
          limit: freeLimit,
        };
      }

      // If within free limits, still allow
      return {
        allowed: freeLimit === -1 || currentConsumed + amount <= freeLimit,
        reason:
          freeLimit !== -1 && currentConsumed + amount > freeLimit
            ? this.getAccessDeniedReason(accessStatus.accessStatus)
            : undefined,
        current: currentConsumed,
        limit: freeLimit,
      };
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
      };
    }

    const current = entitlement.resourceConsumed;
    let effectiveLimit = entitlement.hardLimit;

    // Apply cooldown if subscription is active (progressive unlock for new subscriptions)
    let cooldownMultiplier = 1.0;
    if (accessStatus.accessStatus === 'active') {
      const subscription = await this.deps.subscriptionRepo.findByWorkspaceId(workspaceId);
      if (subscription?.createdAt && subscription?.planId) {
        cooldownMultiplier = getCooldownMultiplier(
          subscription.createdAt,
          subscription.planId as PlanId
        );
        if (cooldownMultiplier < 1.0 && effectiveLimit !== -1) {
          effectiveLimit = Math.floor(effectiveLimit * cooldownMultiplier);
        }
      }
    }

    // Unlimited = always allowed
    if (effectiveLimit === -1) {
      return {
        allowed: true,
        current,
        limit: effectiveLimit,
      };
    }

    // Check if adding amount would exceed effective limit
    const newTotal = current + amount;

    if (newTotal > effectiveLimit) {
      const reason =
        cooldownMultiplier < 1.0
          ? `Subscription in ramp-up period (${Math.floor(cooldownMultiplier * 100)}% capacity). Limit: ${effectiveLimit}`
          : `Resource limit reached (${current}/${effectiveLimit})`;

      return {
        allowed: false,
        reason,
        current,
        limit: effectiveLimit,
      };
    }

    // TODO: Check soft limit warning threshold
    // if (newTotal >= entitlement.softLimit) {
    //   // Trigger warning email in background
    // }

    return {
      allowed: true,
      current,
      limit: effectiveLimit,
    };
  }

  /**
   * Get user-friendly reason for access denial based on subscription status
   */
  private getAccessDeniedReason(accessStatus: SubscriptionAccessStatus['accessStatus']): string {
    switch (accessStatus) {
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
   */
  private async recordConsumption(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.deps.entitlementRepo.incrementConsumed(workspaceId, resourceType, amount, options);
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
   */
  async releaseSeats(
    workspaceId: string,
    amount: number = 1,
    options?: { tx?: Transaction }
  ): Promise<void> {
    await this.deps.entitlementRepo.decrementConsumed(workspaceId, 'seats', amount, options);
  }

  /**
   * Apply credits to increase limits
   * Consumes from creditLimit pool and increases soft/hard limits
   *
   * Process:
   * 1. Atomically checks if creditLimit >= amount
   * 2. If yes: creditLimit -= amount, softLimit += amount, hardLimit += amount
   * 3. This makes enforcement clean: just check current < hardLimit
   *
   * Uses atomic repository operation to prevent race conditions
   * Multiple concurrent calls are safe - only one will succeed if creditLimit is limited
   *
   * @returns true if credits were applied, false if insufficient creditLimit
   */
  async applyCredits(
    workspaceId: string,
    resourceType: ResourceType,
    amount: number,
    options?: { tx?: Transaction }
  ): Promise<boolean> {
    // Atomic update with creditLimit >= amount check in WHERE clause
    const updated = await this.deps.entitlementRepo.applyCredits(
      workspaceId,
      resourceType,
      amount,
      options
    );

    // If no row was updated, either entitlement doesn't exist or insufficient creditLimit
    if (!updated) {
      // Check if entitlement exists to provide better error message
      const entitlement = await this.deps.entitlementRepo.findByWorkspaceAndResource(
        workspaceId,
        resourceType,
        options
      );

      if (!entitlement) {
        throw new Error('No entitlement found for this resource');
      }

      // Entitlement exists but insufficient creditLimit
      return false;
    }

    return true;
  }

  /**
   * Get usage summary for all resources (for UI)
   * Uses billing service to determine effective plan based on subscription access status
   */
  async getUsageSummary(workspaceId: string): Promise<UsageSummary> {
    const entitlementsList = await this.deps.entitlementRepo.findByWorkspaceId(workspaceId);

    // Get effective plan from billing service (handles subscription state logic)
    const accessStatus = await this.deps.billingService.getSubscriptionAccessStatus(workspaceId);
    const effectivePlanId = accessStatus.effectivePlanId as PlanId;
    const planName = (PLAN_NAMES[effectivePlanId] || 'Free') as PlanName;

    // Build resource usage map
    const resources = {} as Record<ResourceType, ResourceUsage>;

    for (const resourceType of RESOURCE_TYPE_VALUES) {
      const entitlement = entitlementsList.find((e) => e.resourceType === resourceType);

      if (entitlement) {
        const consumed = entitlement.resourceConsumed;
        const limit = entitlement.quotedLimit;

        // Calculate percent used against limit for user-facing display
        let percentUsed = 0;
        if (limit !== -1 && limit > 0) {
          percentUsed = Math.round((consumed / limit) * 100);
        }

        resources[resourceType] = {
          consumed,
          limit,
          percentUsed,
        };
      } else {
        // No entitlement - use plan defaults or zeros
        const planDefaults = PLAN_ENTITLEMENTS[effectivePlanId]?.[resourceType];

        if (planDefaults) {
          resources[resourceType] = {
            consumed: 0,
            limit: planDefaults.quotedLimit,
            percentUsed: 0,
          };
        } else {
          // Fallback to zeros
          resources[resourceType] = {
            consumed: 0,
            limit: 0,
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
   * Reset period-based usage (recordings)
   * Called on subscription renewal
   */
  async resetPeriodUsage(workspaceId: string, options?: { tx?: Transaction }): Promise<void> {
    await this.deps.entitlementRepo.resetPeriodResources(workspaceId, options);
  }
}
