/**
 * ZendeskNotificationService - Posts internal notes to Zendesk tickets
 * when recordings are received for links created via Zendesk
 */

import { addTicketComment } from '@/api/clients/zendesk';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import {
  IntegrationHelper,
  type IntegrationRepository,
} from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-notification-service');

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export class ZendeskNotificationService {
  constructor(private deps: { integrationRepo: IntegrationRepository }) {}

  /**
   * Post an internal note to a Zendesk ticket when a recording is received
   * Fire-and-forget: logs errors but does not throw
   */
  async notifyRecordingReceived(params: {
    workspaceId: string;
    ticketId: string;
    recordingId: string;
    recordingUrl: string;
  }): Promise<void> {
    const { workspaceId, ticketId, recordingId, recordingUrl } = params;

    try {
      const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
        workspaceId,
        'zendesk'
      );

      if (!integration) {
        logger.debug({ workspaceId }, 'No active Zendesk integration found, skipping notification');
        return;
      }

      const accessToken = IntegrationHelper.getAccessToken(integration);
      const subdomain = integration.providerMeta.subdomain;

      const safeUrl = escapeHtmlAttr(recordingUrl);
      const body = [
        '<b>Recording received</b>',
        `<p>You've received a new recording.</p>`,
        `<p><a href="${safeUrl}">View recording &#8594;</a></p>`,
      ].join('');

      const success = await addTicketComment(subdomain, accessToken, ticketId, body, true);

      if (success) {
        logger.debug({ workspaceId, ticketId, recordingId }, 'Zendesk recording note posted');
      } else {
        logger.warn(
          { workspaceId, ticketId, recordingId },
          'Failed to post Zendesk recording note'
        );
        captureException(new Error('failed to post zendesk recording note'), undefined, {
          operation: 'zendesk_notify_recording',
          ticketId,
          workspaceId,
          recordingId,
        });
      }
    } catch (error) {
      logger.error(
        { err: error, workspaceId, ticketId, recordingId },
        'Error posting Zendesk recording note'
      );
      captureException(error, undefined, {
        component: 'zendesk_notification',
        operation: 'notify_recording_received',
        workspace_id: workspaceId,
        ticket_id: ticketId,
        recording_id: recordingId,
      });
    }
  }
}
