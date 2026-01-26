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
 * POST /billing/:workspaceId/plan
 * Unified plan management endpoint
 * Routes to appropriate flow based on subscription status and user role
 */
export const managePlanImpl = (
  billingService: BillingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService
) => {
  const workspaceMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.billing.managePlan
    .use(workspaceMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const { workspaceId } = input.params;
      const { planId, action, message: customMessage } = input.body;
      const userRole = context.workspaceRole;

      // Get subscription status to determine flow
      const subscriptionStatus = await billingService.getSubscriptionStatus(workspaceId);
      const hasActiveSubscription =
        subscriptionStatus.contractDetail.planId !== null &&
        (subscriptionStatus.contractDetail.status === 'active' ||
          (subscriptionStatus.contractDetail.status === 'cancelled' &&
            subscriptionStatus.contractDetail.cancelAtPeriodEnd));

      // Route 1: No active subscription -> Checkout (owner/admin only)
      if (!hasActiveSubscription) {
        if (userRole !== 'owner' && userRole !== 'admin') {
          throw billingError.PORTAL_UNAVAILABLE();
        }

        const product = getProductByPlanId(planId as PlanId);
        if (!product) {
          throw billingError.INVALID_PLAN();
        }

        return {
          message: 'Checkout session details retrieved',
          data: {
            type: 'checkout' as const,
            data: {
              checkoutUrl: `/api/auth/dodopayments/checkout?slug=${product.slug}&metadata[workspace_id]=${workspaceId}`,
              slug: product.slug,
              sessionId: undefined,
            },
          },
        };
      }

      // Route 2: Active subscription + member -> Request
      if (userRole !== 'owner' && userRole !== 'admin') {
        const planName = PLAN_NAMES[planId as PlanId] || 'Unknown';
        const owners = await workspaceMemberService.getOwners(workspaceId);

        if (owners.length === 0) {
          throw billingError.PLAN_CHANGE_REQUEST_FAILED();
        }

        const workspace = await workspaceService.getById(workspaceId);
        if (!workspace) {
          throw billingError.SUBSCRIPTION_NOT_FOUND();
        }

        const requesterEmail = context.user.email;
        const requesterName = context.user.name || requesterEmail;
        const requestId = nanoid();

        await emailService.sendSafePlanChangeRequest(
          { to: owners.map((o) => o.email) },
          {
            workspaceName: workspace.workspaceName,
            requesterName,
            requesterEmail,
            planName,
            billingUrl: '',
            customMessage,
            workspaceId,
            planId: planId as PlanId,
          }
        );

        return {
          message: 'Plan change request submitted',
          data: {
            type: 'request' as const,
            data: {
              requestId,
              status: 'submitted' as const,
              planId: planId as PlanId,
              planName,
            },
          },
        };
      }

      // Route 3: Active subscription + owner/admin + execute -> Execute
      if (action === 'execute') {
        const result = await billingService.changePlan(workspaceId, planId as PlanId);

        return {
          message: 'Plan changed successfully',
          data: {
            type: 'execute' as const,
            data: result,
          },
        };
      }

      // Route 4: Active subscription + owner/admin + (no action or 'preview') -> Preview
      const preview = await billingService.previewPlanChange(workspaceId, planId as PlanId);

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
  emailService: EmailService
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
      emailService
    ),
  };
}
