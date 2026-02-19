/**
 * Billing contract implementation using oRPC
 * Implements the billing contract defined in @workspace/contract
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

import { billingError } from '@workspace/contract';
import type { DodoPayments } from '@workspace/payments/client';
import { getProductByPlanId, getProductByProductId } from '@workspace/payments/products';
import type { PlanId } from '@workspace/pricing';

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
        const session = await dodoClient.checkoutSessions.create({
          product_cart: [{ product_id: resolvedProductId, quantity: 1 }],
          metadata: { workspace_id: workspaceId },
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
    managePlan: managePlanImpl(
      billingService,
      workspaceMemberService,
      workspaceService,
      dodoClient,
      dashboardBaseUrl
    ),
  };
}
