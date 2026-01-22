/**
 * Provisioner contract implementation using oRPC
 * Implements workspace creation and provisioning
 */

import type { PlanId } from '@workspace/pricing';

import { authorized } from '@/api/middleware/auth.orpc';
import type { EmailService } from '@/api/services/email.service';
import type { ProvisionerService } from '@/api/services/provisioner.service';

/**
 * POST /workspace - Create a new workspace
 * Requires authentication
 * Optionally accepts an invite token for workspace creation with predetermined details
 * Sends welcome email from founder to new workspace creators
 */
export const createWorkspaceImpl = (
  provisionerService: ProvisionerService,
  emailService: EmailService
) => {
  return authorized.provisioner.createWorkspace.handler(async ({ input, context }) => {
    const result = await provisionerService.createWorkspace({
      url: input.body.type === 'manual' ? input.body.url : undefined,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      inviteToken: input.body.type === 'invite' ? input.body.inviteToken : undefined,
      plan: input.body.type === 'manual' ? (input.body.plan as PlanId) : undefined,
    });

    // Send welcome email based on whether invite token was used
    // Only send if workspace was created (not if it already existed)
    if (result.created) {
      if (input.body.type === 'invite') {
        // Pilot user - invited with token
        await emailService.sendSafeWelcomeEmailPilot(
          { to: context.user.email },
          {
            workspaceName: result.workspaceName,
            workspaceId: result.workspaceId,
          }
        );
      } else {
        // Subscription user - organic signup without invite token
        await emailService.sendSafeWelcomeEmailSubscription(
          { to: context.user.email },
          {
            workspaceName: result.workspaceName,
            workspaceId: result.workspaceId,
          }
        );
      }
    }

    return {
      message: 'Workspace created successfully',
      data: result,
    };
  });
};

/**
 * Create the provisioner procedures object
 */
export const createProvisionerProcedures = (
  provisionerService: ProvisionerService,
  emailService: EmailService
) => {
  return {
    createWorkspace: createWorkspaceImpl(provisionerService, emailService),
  };
};
