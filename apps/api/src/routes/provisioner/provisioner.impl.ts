/**
 * Provisioner contract implementation using oRPC
 * Implements workspace creation and provisioning
 */

import { env } from '@/api/env';
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
      url: input.body.url,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      inviteToken: input.body.inviteToken,
    });

    // Send welcome email based on whether invite token was used
    // Only send if workspace was created (not if it already existed)
    // This is non-blocking - if it fails, workspace creation still succeeds
    if (result.created) {
      try {
        const dashboardUrl = `${env.invite.appUrl}/${result.workspaceId}`;

        if (input.body.inviteToken) {
          // Pilot user - invited with token
          await emailService.sendWelcomeEmailPilot({
            to: context.user.email,
            userName: context.user.name,
            workspaceName: result.workspaceName,
            dashboardUrl,
            calendarUrl: 'https://cal.com/userplane/intro',
          });
        } else {
          // Subscription user - organic signup without invite token
          await emailService.sendWelcomeEmailSubscription({
            to: context.user.email,
            userName: context.user.name,
            workspaceName: result.workspaceName,
            dashboardUrl,
          });
        }
      } catch (error) {
        // Log error but don't fail the request
        console.error('Failed to send welcome email:', error);
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
