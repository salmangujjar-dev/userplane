/**
 * IntercomNotificationService - Posts admin notes to Intercom conversations
 * when recordings are received for links created via Intercom
 */

import { replyToConversation } from '@/api/clients/intercom';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import {
  IntegrationHelper,
  type IntegrationRepository,
} from '@/api/repositories/integrations.repository';

const logger = createLogger('intercom-notification-service');

export class IntercomNotificationService {
  constructor(private deps: { integrationRepo: IntegrationRepository }) {}

  /**
   * Post an admin note to an Intercom conversation when a recording is received
   * Fire-and-forget: logs errors but does not throw
   */
  async notifyRecordingReceived(params: {
    workspaceId: string;
    conversationId: string;
    adminId: string;
    recordingId: string;
    recordingUrl: string;
  }): Promise<void> {
    const { workspaceId, conversationId, adminId, recordingId, recordingUrl } = params;

    try {
      const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
        workspaceId,
        'intercom'
      );

      if (!integration) {
        logger.debug(
          { workspaceId },
          'No active Intercom integration found, skipping notification'
        );
        return;
      }

      const accessToken = IntegrationHelper.getAccessToken(integration);
      const region = integration.providerMeta.region;

      const body = [
        '<b>Recording received</b>',
        `<p>You've received a new recording.</p>`,
        `<p><a href="${recordingUrl}">View recording &#8594;</a></p>`,
      ].join('');

      const success = await replyToConversation(accessToken, region, conversationId, adminId, body);

      if (success) {
        logger.debug(
          { workspaceId, conversationId, recordingId },
          'Intercom recording note posted'
        );
      } else {
        logger.warn(
          { workspaceId, conversationId, recordingId },
          'Failed to post Intercom recording note'
        );
        captureException(new Error('failed to post intercom recording note'), undefined, {
          operation: 'create_link_intercom',
          conversationId,
          workspaceId,
          recordingId,
        });
      }
    } catch (error) {
      logger.error(
        { err: error, workspaceId, conversationId, recordingId },
        'Error posting Intercom recording note'
      );
      captureException(error, undefined, {
        component: 'intercom_notification',
        operation: 'notify_recording_received',
        workspace_id: workspaceId,
        conversation_id: conversationId,
        recording_id: recordingId,
      });
    }
  }
}
