/**
 * EmailService - Infrastructure service for sending emails
 * Uses @workspace/email package and React Email templates
 * Emails are sent from configured inboxes with sender context in content
 */

import { createAppLogger } from '@workspace/logger';
import { emailClient } from '@/api/clients/email';
import { renderWorkspaceInvite, renderAccessRequest } from '@workspace/email';
import { env } from '@/api/env';
import type { WorkspaceInviteEmailParams, AccessRequestEmailParams } from '@/api/types';

const logger = createAppLogger('email-service');

export class EmailService {
  /**
   * Send workspace invitation email
   * Uses React Email template and idempotency key to prevent duplicate invites
   * Email is sent from configured invite inbox with inviter details in content
   */
  async sendWorkspaceInvite(params: WorkspaceInviteEmailParams): Promise<void> {
    const idempotencyKey = `workspace-invite/${params.workspaceName}/${params.to}`;

    // Render React Email template to HTML and text
    const { html, text } = await renderWorkspaceInvite({
      workspaceName: params.workspaceName,
      inviterName: params.inviterName,
      inviteUrl: params.inviteUrl,
    });

    await emailClient.send(
      {
        from: `${params.workspaceName} (via Userplane) <${env.email.inboxes.invite}>`,
        to: params.to,
        subject: `${params.inviterName} invited you to ${params.workspaceName}`,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspace: params.workspaceName,
        inviterName: params.inviterName,
        inviterEmail: params.inviterEmail,
        fromInbox: env.email.inboxes.invite,
        provider: emailClient.getProvider(),
      },
      'Workspace invitation sent'
    );
  }

  /**
   * Send workspace access request email to owner
   * Uses React Email template
   * Email is sent from configured invite inbox with requester details in content
   */
  async sendAccessRequest(params: AccessRequestEmailParams): Promise<void> {
    const idempotencyKey = `access-request/${params.workspaceName}/${params.requesterEmail}/${params.to}`;

    // Render React Email template to HTML and text
    const { html, text } = await renderAccessRequest({
      workspaceName: params.workspaceName,
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      reviewUrl: params.reviewUrl,
    });

    await emailClient.send(
      {
        from: `${params.workspaceName} (via Userplane) <${env.email.inboxes.invite}>`,
        to: params.to,
        subject: `${params.requesterName} requested to join ${params.workspaceName}`,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspace: params.workspaceName,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        fromInbox: env.email.inboxes.invite,
        provider: emailClient.getProvider(),
      },
      'Workspace access request sent'
    );
  }
}

export const emailService = new EmailService();
