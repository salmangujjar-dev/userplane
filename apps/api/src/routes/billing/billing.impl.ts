/**
 * Billing contract implementation using oRPC
 * Implements the billing contract defined in @workspace/contract
 *
 * Error Handling:
 * Uses type-safe DodoPayments error classes (ConflictError, NotFoundError, etc.)
 * instead of checking status codes or parsing error messages.
 * See: https://docs.dodopayments.com/developer-resources/subscription-upgrade-downgrade.md
 */

import { billingError } from '@workspace/contract';
import { ConflictError, getProductBySlug } from '@workspace/payments';

import { getDodoClient } from '@/api/clients/dodo';
import { authorized } from '@/api/middleware/auth.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { BillingService } from '@/api/services/billing.service';
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
    .handler(async ({ input }) => {
      const status = await billingService.getSubscriptionStatus(input.params.workspaceId);

      return {
        message: 'Subscription status retrieved successfully',
        data: status,
      };
    });
};

/**
 * POST /billing/checkout
 * Create a checkout session for subscribing to a plan
 * Requires authentication and workspace ownership/admin
 */
export const createCheckoutSessionImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService
) => {
  return authorized.billing.createCheckout.handler(async ({ input, context }) => {
    const { workspaceId, planSlug } = input.body;

    // Verify user has access to the workspace (owner or admin)
    const member = await workspaceMemberService.getMember(context.user.id, workspaceId);
    if (!member) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    if (member.workspaceRole !== 'owner' && member.workspaceRole !== 'admin') {
      throw billingError.PORTAL_UNAVAILABLE();
    }

    // Check if workspace already has an active subscription
    const hasSubscription = await billingService.hasActiveSubscription(workspaceId);
    if (hasSubscription) {
      throw billingError.SUBSCRIPTION_ALREADY_EXISTS();
    }

    // Find the product by slug
    const product = getProductBySlug(planSlug);
    if (!product) {
      throw billingError.INVALID_PLAN();
    }

    // The actual checkout session is created via Better Auth's DodoPayments plugin
    // This endpoint provides the information needed to construct the checkout URL
    // The frontend should use the Better Auth client: authClient.dodopayments.checkoutSession()

    return {
      message: 'Checkout session details retrieved',
      data: {
        checkoutUrl: `/api/auth/dodopayments/checkout?slug=${planSlug}&metadata[workspace_id]=${workspaceId}`,
        sessionId: undefined,
      },
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
    .handler(async ({ context }) => {
      // Check if user is owner or admin
      if (context.workspaceRole !== 'owner' && context.workspaceRole !== 'admin') {
        throw billingError.PORTAL_UNAVAILABLE();
      }

      // The customer portal is accessed via Better Auth's DodoPayments plugin
      // This endpoint provides the portal URL
      // The frontend should use: authClient.dodopayments.customer.portal()

      return {
        message: 'Customer portal URL retrieved',
        data: {
          portalUrl: '/api/auth/dodopayments/portal',
        },
      };
    });
};

/**
 * POST /billing/:workspaceId/preview-plan-change
 * Preview subscription plan change for a workspace
 * Shows proration details without committing the change
 * Requires workspace admin role and active subscription
 */
export const previewPlanChangeImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.previewPlanChange
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const { workspaceId } = input.params;
      const { planSlug } = input.body;

      // Check if user is owner or admin
      if (context.workspaceRole !== 'owner' && context.workspaceRole !== 'admin') {
        throw billingError.PORTAL_UNAVAILABLE();
      }

      // Find the product by slug
      const product = getProductBySlug(planSlug);
      if (!product) {
        throw billingError.INVALID_PLAN();
      }

      try {
        // Get the DodoPayments client
        const dodoClient = getDodoClient();

        // Preview the plan change
        const result = await billingService.previewPlanChange(
          workspaceId,
          product.productId,
          dodoClient
        );

        return {
          message: result.alreadyOnPlan ? 'Already on this plan' : 'Plan change preview retrieved',
          data: result,
        };
      } catch (error) {
        // Handle DodoPayments-specific errors using type-safe error classes
        // See: https://docs.dodopayments.com/developer-resources/subscription-upgrade-downgrade.md#subscription-on-hold-after-plan-change

        // 409 Conflict - subscription on hold or pending payment
        if (error instanceof ConflictError) {
          throw billingError.PENDING_PAYMENT();
        }

        // Check for subscription state errors
        if (error instanceof Error) {
          if (
            error.message.includes('No active subscription') ||
            error.message.includes('not active')
          ) {
            throw billingError.NO_ACTIVE_SUBSCRIPTION();
          }
        }

        // Generic plan change failure
        throw billingError.PLAN_CHANGE_FAILED();
      }
    });
};

/**
 * POST /billing/:workspaceId/change-plan
 * Change subscription plan for a workspace (upgrade/downgrade)
 * Requires workspace admin role and active subscription
 */
export const changePlanImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.changePlan
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const { workspaceId } = input.params;
      const { planSlug } = input.body;

      // Check if user is owner or admin
      if (context.workspaceRole !== 'owner' && context.workspaceRole !== 'admin') {
        throw billingError.PORTAL_UNAVAILABLE();
      }

      // Find the product by slug
      const product = getProductBySlug(planSlug);
      if (!product) {
        throw billingError.INVALID_PLAN();
      }

      try {
        // Get the DodoPayments client
        const dodoClient = getDodoClient();

        // Change the plan (proration mode is controlled server-side)
        const result = await billingService.changePlan(
          workspaceId,
          product.productId,
          product.planId,
          dodoClient
        );

        return {
          message: result.alreadyOnPlan
            ? 'Already on this plan'
            : 'Subscription plan change initiated',
          data: {
            success: true,
            previousPlanId: result.previousPlanId,
            newPlanId: result.newPlanId,
            alreadyOnPlan: result.alreadyOnPlan,
          },
        };
      } catch (error) {
        // Handle DodoPayments-specific errors using type-safe error classes
        // See: https://docs.dodopayments.com/developer-resources/subscription-upgrade-downgrade.md#subscription-on-hold-after-plan-change

        // 409 Conflict - subscription on hold or pending payment
        if (error instanceof ConflictError) {
          throw billingError.PENDING_PAYMENT();
        }

        // Check for subscription state errors
        if (error instanceof Error) {
          if (
            error.message.includes('No active subscription') ||
            error.message.includes('not active')
          ) {
            throw billingError.NO_ACTIVE_SUBSCRIPTION();
          }
        }

        // Generic plan change failure
        throw billingError.PLAN_CHANGE_FAILED();
      }
    });
};

/**
 * Create all billing procedures
 */
export function createBillingProcedures(
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) {
  return {
    getStatus: getSubscriptionStatusImpl(billingService, workspaceMemberService, workspaceService),
    createCheckout: createCheckoutSessionImpl(billingService, workspaceMemberService),
    getPortal: getCustomerPortalImpl(billingService, workspaceMemberService, workspaceService),
    previewPlanChange: previewPlanChangeImpl(
      billingService,
      workspaceMemberService,
      workspaceService
    ),
    changePlan: changePlanImpl(billingService, workspaceMemberService, workspaceService),
  };
}
