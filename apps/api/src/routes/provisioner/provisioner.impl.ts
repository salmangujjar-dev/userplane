/**
 * Provisioner contract implementation using oRPC
 * Implements workspace creation and provisioning
 */

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
    // Call the appropriate method based on the discriminated union type
    const result =
      input.body.type === 'invite'
        ? await provisionerService.createWorkspaceByInviteToken({
            inviteToken: input.body.inviteToken,
            userId: context.user.id,
            userName: context.user.name,
            userEmail: context.user.email,
          })
        : await provisionerService.createWorkspaceByURL({
            url: input.body.url,
            plan: input.body.plan,
            userId: context.user.id,
            userName: context.user.name,
            userEmail: context.user.email,
          });

    // Send welcome email based on creation type
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
