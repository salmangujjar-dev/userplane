/**
 * Billing contract implementation using oRPC
 * Implements the billing contract defined in @userplane/contract
 *
 * Architecture:
 * - Product configuration (planId → slug mapping) stays server-side
 * - Client calls API with planId (type-safe enum)
 * - API validates permissions and returns slug
 * - Client uses slug with Better Auth DodoPayments plugin for checkout
 *
 * Note: Plan changes (upgrade/downgrade) are handled via the DodoPayments
 * Customer Portal, which provides a native self-service experience.
 * See: https://docs.dodopayments.com/features/customer-portal
 */

import { billingError } from '@userplane/contract';
import type { DodoPayments } from '@userplane/payments/client';
import { buildFlatMetadata, parseFlatMetadata } from '@userplane/payments/metadata';
import { getProductByPlanId, getProductByProductId } from '@userplane/payments/products';
import type { PlanId } from '@userplane/pricing';

import { env } from '@/api/env';
import { authorized } from '@/api/middleware/auth.orpc';
import { billingRateLimitMiddleware } from '@/api/middleware/rate-limit.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { BillingService } from '@/api/services/billing.service';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';

/**
 * GET /billing/:workspaceId/status
 * Get subscription status for a workspace
 * Requires workspace membership
 */
export const getSubscriptionStatusImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.getStatus
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .use(billingRateLimitMiddleware)
    .handler(async ({ input }) => {
      const status = await billingService.getSubscriptionStatus(input.params.workspaceId);

      return {
        message: 'Subscription status retrieved successfully',
        data: status,
      };
    });
};

/**
 * GET /billing/:workspaceId/portal
 * Get customer portal URL for managing subscription
 * Requires workspace admin role
 */
export const getCustomerPortalImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.getPortal
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .use(billingRateLimitMiddleware)
    .handler(async ({ input, context }) => {
      // Check if user is owner or admin
      if (context.workspaceRole !== 'owner' && context.workspaceRole !== 'admin') {
        throw billingError.BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER();
      }

      const portalUrl = await billingService.getCustomerPortalUrl(input.params.workspaceId);

      return {
        message: 'Customer portal URL retrieved',
        data: {
          portalUrl,
        },
      };
    });
};

/**
 * GET /billing/:workspaceId/usage
 * Get entitlement usage summary for a workspace
 * Requires workspace membership
 */
export const getUsageImpl = (
  entitlementService: EntitlementService,
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.getUsage
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .use(billingRateLimitMiddleware)
    .handler(async ({ input }) => {
      const workspaceId = input.params.workspaceId;

      // Get usage summary (internally determines effective plan from billing service)
      const usage = await entitlementService.getUsageSummary(workspaceId);

      return {
        message: 'Usage summary retrieved successfully',
        data: usage,
      };
    });
};

/**
 * GET /billing/:workspaceId/addons
 * Get current add-ons status for a workspace
 * Requires workspace membership
 */
export const getAddonsImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.getAddons
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .use(billingRateLimitMiddleware)
    .handler(async ({ input }) => {
      const data = await billingService.getAddonsStatus(input.params.workspaceId);

      return {
        message: 'Add-ons status retrieved successfully',
        data,
      };
    });
};

/**
 * POST /billing/:workspaceId/addons
 * Unified add-on management endpoint
 * Supports preview and execute flows for seat add-ons
 */
export const manageAddonsImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.manageAddons
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .use(billingRateLimitMiddleware)
    .handler(async ({ input, context }) => {
      const { workspaceId } = input.params;
      const { seatsQuantity, action } = input.body;
      const userRole = context.workspaceRole;

      // Members cannot manage billing — owner/admin only
      if (userRole !== 'owner' && userRole !== 'admin') {
        throw billingError.BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER();
      }

      const resolvedAction = action ?? 'preview';

      if (resolvedAction === 'execute') {
        const result = await billingService.changeAddons(workspaceId, seatsQuantity);
        return {
          message: 'Add-ons changed successfully',
          data: {
            type: 'execute' as const,
            data: result,
          },
        };
      }

      const preview = await billingService.previewAddonChange(workspaceId, seatsQuantity);
      return {
        message: 'Add-on change preview retrieved successfully',
        data: {
          type: 'preview' as const,
          data: preview,
        },
      };
    });
};

/**
 * POST /billing/:workspaceId/plan
 * Unified plan management endpoint
 * Routes to appropriate flow based on subscription status and user role
 */
export const managePlanImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  dodoClient: DodoPayments,
  dashboardBaseUrl: string
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.managePlan
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .use(billingRateLimitMiddleware)
    .handler(async ({ input, context }) => {
      const { workspaceId } = input.params;
      const { planId, productId, action } = input.body;
      const userRole = context.workspaceRole;

      // Resolve planId/productId to concrete values
      let resolvedProductId: string;
      let resolvedPlanId: PlanId;
      let resolvedSlug: string;

      if (planId) {
        const product = getProductByPlanId(planId as PlanId);
        if (!product) {
          throw billingError.INVALID_PLAN();
        }
        resolvedProductId = product.productId;
        resolvedPlanId = planId as PlanId;
        resolvedSlug = product.slug;
      } else if (productId) {
        const knownProduct = getProductByProductId(productId);
        resolvedProductId = productId;
        resolvedPlanId = knownProduct?.planId ?? ('custom' as PlanId);
        resolvedSlug = knownProduct?.slug ?? productId;
      } else {
        throw billingError.INVALID_PLAN();
      }

      // Get subscription status to determine flow
      const subscriptionStatus = await billingService.getSubscriptionStatus(workspaceId);
      const hasActiveSubscription =
        subscriptionStatus.contractDetail.planId !== null &&
        (subscriptionStatus.contractDetail.status === 'active' ||
          (subscriptionStatus.contractDetail.status === 'cancelled' &&
            subscriptionStatus.contractDetail.cancelAtPeriodEnd));

      // Members cannot manage billing — owner/admin only
      if (userRole !== 'owner' && userRole !== 'admin') {
        throw billingError.BILLING_MANAGEMENT_UNAVAILABLE_FOR_MEMBER();
      }

      // Route 1: No active subscription -> Checkout
      if (!hasActiveSubscription) {
        // Snapshot plan metadata at checkout time so the subscription object (and all
        // subsequent webhooks) carry an immutable copy of the agreed entitlements.
        // Non-fatal: webhook processor falls back to a live product fetch if absent.
        let planMetadataSnapshot: Record<string, string> = {};
        try {
          const product = await dodoClient.products.retrieve(resolvedProductId);
          const raw = (product.metadata ?? {}) as Record<string, unknown>;
          const parsed = parseFlatMetadata(raw);
          if (parsed.featureLimits && parsed.featureGates) {
            planMetadataSnapshot = buildFlatMetadata(
              parsed.featureLimits,
              parsed.featureGates,
              parsed.billingCadence
            );
          }
        } catch {
          // Swallow — webhook will fall back to live fetch
        }

        const session = await dodoClient.checkoutSessions.create({
          product_cart: [{ product_id: resolvedProductId, quantity: 1 }],
          subscription_data: {
            trial_period_days: env.billing.trialPeriodDays,
          },
          metadata: {
            workspace_id: workspaceId,
            // snapshot_product_id lets the webhook verify this snapshot belongs to the
            // subscription's current product. Without it a plan-change subscription would
            // inherit the old checkout's Plan A snapshot and be misread as Plan B.
            snapshot_product_id: resolvedProductId,
            ...planMetadataSnapshot,
          },
          return_url: `${dashboardBaseUrl}/workspace/${workspaceId}/settings?tab=plan-usage`,
          customization: { theme: 'light', show_order_details: true, show_on_demand_tag: false },
          customer: { email: context.user.email, name: context.user.name },
        });

        return {
          message: 'Checkout session created',
          data: {
            type: 'checkout' as const,
            data: {
              checkoutUrl: session.checkout_url ?? '',
              slug: resolvedSlug,
              sessionId: session.session_id,
            },
          },
        };
      }

      // Route 2: Active subscription + execute -> Execute
      if (action === 'execute') {
        const result = await billingService.changePlan(
          workspaceId,
          resolvedProductId,
          resolvedPlanId
        );

        return {
          message: 'Plan changed successfully',
          data: {
            type: 'execute' as const,
            data: result,
          },
        };
      }

      // Route 3: Active subscription + (no action or 'preview') -> Preview
      const preview = await billingService.previewPlanChange(
        workspaceId,
        resolvedProductId,
        resolvedPlanId
      );

      return {
        message: 'Plan change preview retrieved successfully',
        data: {
          type: 'preview' as const,
          data: preview,
        },
      };
    });
};

/**
 * Create all billing procedures
 */
export function createBillingProcedures(
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  entitlementService: EntitlementService,
  dodoClient: DodoPayments,
  dashboardBaseUrl: string
) {
  return {
    getStatus: getSubscriptionStatusImpl(billingService, workspaceMemberService, workspaceService),
    getPortal: getCustomerPortalImpl(billingService, workspaceMemberService, workspaceService),
    getUsage: getUsageImpl(
      entitlementService,
      billingService,
      workspaceMemberService,
      workspaceService
    ),
    getAddons: getAddonsImpl(billingService, workspaceMemberService, workspaceService),
    manageAddons: manageAddonsImpl(billingService, workspaceMemberService, workspaceService),
    managePlan: managePlanImpl(
      billingService,
      workspaceMemberService,
      workspaceService,
      dodoClient,
      dashboardBaseUrl
    ),
  };
}
