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
import { getProductByPlanId } from '@workspace/payments/products';
import { PLAN_NAMES, type PlanId } from '@workspace/pricing';
import { nanoid } from 'nanoid';

import { authorized } from '@/api/middleware/auth.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { BillingService } from '@/api/services/billing.service';
import type { EmailService } from '@/api/services/email.service';
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
 * Validates permissions and returns product slug for checkout
 * Client then uses Better Auth's DodoPayments plugin to create the actual checkout session
 * Requires authentication and workspace ownership/admin
 */
export const createCheckoutSessionImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService
) => {
  return authorized.billing.createCheckout.handler(async ({ input, context }) => {
    const { workspaceId, planId } = input.body;

    // Verify user has access to the workspace (owner or admin)
    const member = await workspaceMemberService.getMember(context.user.id, workspaceId);
    if (!member) {
      throw billingError.SUBSCRIPTION_NOT_FOUND();
    }

    if (member.workspaceRole !== 'owner' && member.workspaceRole !== 'admin') {
      throw billingError.PORTAL_UNAVAILABLE();
    }

    // Check subscription status - prevent checkout if user has active access
    const subscriptionStatus = await billingService.getSubscriptionStatus(workspaceId);

    // Block checkout if subscription exists and is active
    if (
      subscriptionStatus.contractDetail.planId !== null &&
      (subscriptionStatus.contractDetail.status === 'active' ||
        (subscriptionStatus.contractDetail.status === 'cancelled' &&
          subscriptionStatus.contractDetail.cancelAtPeriodEnd))
    ) {
      throw billingError.SUBSCRIPTION_ALREADY_EXISTS();
    }

    // Find the product by planId and convert to slug for checkout
    const product = getProductByPlanId(planId);
    if (!product) {
      throw billingError.INVALID_PLAN();
    }

    // Return the slug so client can call Better Auth's DodoPayments plugin
    // Product config stays server-side, but slug is needed for checkout session
    return {
      message: 'Checkout session details retrieved',
      data: {
        checkoutUrl: `/api/auth/dodopayments/checkout?slug=${product.slug}&metadata[workspace_id]=${workspaceId}`,
        slug: product.slug,
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
 * POST /billing/:workspaceId/preview-plan-change
 * Preview proration details before changing subscription plan
 * Requires workspace admin/owner role
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
      // Check if user is owner or admin
      if (context.workspaceRole !== 'owner' && context.workspaceRole !== 'admin') {
        throw billingError.PORTAL_UNAVAILABLE();
      }

      const { workspaceId } = input.params;
      const { planId } = input.body;

      const preview = await billingService.previewPlanChange(workspaceId, planId as PlanId);

      return {
        message: 'Plan change preview retrieved successfully',
        data: preview,
      };
    });
};

/**
 * POST /billing/:workspaceId/change-plan
 * Execute subscription plan change
 * Requires workspace admin/owner role
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
      // Check if user is owner or admin
      if (context.workspaceRole !== 'owner' && context.workspaceRole !== 'admin') {
        throw billingError.PORTAL_UNAVAILABLE();
      }

      const { workspaceId } = input.params;
      const { planId } = input.body;

      const result = await billingService.changePlan(workspaceId, planId as PlanId);

      return {
        message: 'Plan changed successfully',
        data: result,
      };
    });
};

/**
 * POST /billing/:workspaceId/request-plan-change
 * Request a plan change (for non-admins)
 * Sends email notification to workspace owner
 * Requires workspace membership
 */
export const requestPlanChangeImpl = (
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.requestPlanChange
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const { workspaceId } = input.params;
      const { planId, message: customMessage } = input.body;

      // Get the plan name
      const planName = PLAN_NAMES[planId as PlanId] || 'Unknown';

      // Get workspace owners to send notification
      const owners = await workspaceMemberService.getOwners(workspaceId);

      if (owners.length === 0) {
        throw billingError.PLAN_CHANGE_REQUEST_FAILED();
      }

      // Get the workspace name
      const workspace = await workspaceService.getById(workspaceId);
      if (!workspace) {
        throw billingError.SUBSCRIPTION_NOT_FOUND();
      }

      // Get the requester info from the session
      const requesterEmail = context.user.email;
      const requesterName = context.user.name || requesterEmail;

      // Generate a request ID for tracking
      const requestId = nanoid();

      // Send email to all workspace owners
      const ownerEmails = owners.map((o) => o.email);

      await emailService.sendSafePlanChangeRequest(
        { to: ownerEmails },
        {
          workspaceName: workspace.workspaceName,
          requesterName,
          requesterEmail,
          planName,
          billingUrl: '', // Will be generated internally by email service
          customMessage,
          workspaceId,
          planId,
        }
      );

      return {
        message: 'Plan change request submitted',
        data: {
          requestId,
          status: 'submitted' as const,
          planId,
          planName,
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
  emailService: EmailService
) {
  return {
    getStatus: getSubscriptionStatusImpl(billingService, workspaceMemberService, workspaceService),
    createCheckout: createCheckoutSessionImpl(billingService, workspaceMemberService),
    getPortal: getCustomerPortalImpl(billingService, workspaceMemberService, workspaceService),
    getUsage: getUsageImpl(
      entitlementService,
      billingService,
      workspaceMemberService,
      workspaceService
    ),
    previewPlanChange: previewPlanChangeImpl(
      billingService,
      workspaceMemberService,
      workspaceService
    ),
    changePlan: changePlanImpl(billingService, workspaceMemberService, workspaceService),
    requestPlanChange: requestPlanChangeImpl(
      workspaceMemberService,
      workspaceService,
      emailService
    ),
  };
}
