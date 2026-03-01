/**
 * BillingService - Backward-compatible facade
 *
 * Delegates to BillingQueryService (read-only) and BillingMutationService (writes).
 * No logic lives here — this exists solely so that all existing consumers of
 * BillingService continue to work with zero changes.
 */

import type { SubscriptionAccessStatus } from '@userplane/contract';
import type { PlanFeatureGates, PlanId } from '@userplane/pricing';

import type { BillingMutationService } from './billing-mutation.service';
import type { BillingQueryService } from './billing-query.service';

export type { SubscriptionAccessStatus };

export interface BillingServiceDeps {
  queryService: BillingQueryService;
  mutationService: BillingMutationService;
}

export class BillingService {
  constructor(private deps: BillingServiceDeps) {}

  // --- Query delegates ---

  getSubscriptionStatus(workspaceId: string) {
    return this.deps.queryService.getSubscriptionStatus(workspaceId);
  }

  getSubscriptionAccessStatus(workspaceId: string): Promise<SubscriptionAccessStatus> {
    return this.deps.queryService.getSubscriptionAccessStatus(workspaceId);
  }

  getFeatureGates(workspaceId: string): Promise<PlanFeatureGates> {
    return this.deps.queryService.getFeatureGates(workspaceId);
  }

  // --- Mutation delegates ---

  getAddonsStatus(workspaceId: string) {
    return this.deps.mutationService.getAddonsStatus(workspaceId);
  }

  previewAddonChange(workspaceId: string, seatsQuantity: number) {
    return this.deps.mutationService.previewAddonChange(workspaceId, seatsQuantity);
  }

  changeAddons(workspaceId: string, seatsQuantity: number) {
    return this.deps.mutationService.changeAddons(workspaceId, seatsQuantity);
  }

  getCustomerPortalUrl(workspaceId: string): Promise<string> {
    return this.deps.mutationService.getCustomerPortalUrl(workspaceId);
  }

  previewPlanChange(workspaceId: string, productId: string, newPlanId: PlanId) {
    return this.deps.mutationService.previewPlanChange(workspaceId, productId, newPlanId);
  }

  changePlan(workspaceId: string, productId: string, newPlanId: PlanId) {
    return this.deps.mutationService.changePlan(workspaceId, productId, newPlanId);
  }
}
