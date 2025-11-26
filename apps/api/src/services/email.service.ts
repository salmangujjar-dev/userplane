/**
 * EmailService - Infrastructure service for sending emails
 * Uses @workspace/email package and React Email templates
 */

import { createAppLogger } from '@workspace/logger';
import { emailClient } from '@/api/clients/email';
import { renderWorkspaceInvite } from '@workspace/email';
import type { WorkspaceInviteEmailParams } from '@/api/types';

const logger = createAppLogger('email-service');

export class EmailService {
  /**
   * Send workspace invitation email
   * Uses React Email template and idempotency key to prevent duplicate invites
   */
  async sendWorkspaceInvite(params: WorkspaceInviteEmailParams): Promise<void> {
    const idempotencyKey = `workspace-invite/${params.workspaceName}/${params.to}`;

    // Render React Email template to HTML
    const html = await renderWorkspaceInvite({
      workspaceName: params.workspaceName,
      inviterName: params.inviterName,
      inviteUrl: params.inviteUrl,
    });

    await emailClient.send(
      {
        from: `${params.inviterName} <${params.inviterEmail}>`,
        to: params.to,
        subject: `${params.inviterName} invited you to ${params.workspaceName}`,
        html,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspace: params.workspaceName,
        provider: emailClient.getProvider(),
      },
      'Workspace invitation sent'
    );
  }
}

export const emailService = new EmailService();
