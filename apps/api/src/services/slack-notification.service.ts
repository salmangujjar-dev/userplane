/**
 * SlackNotificationService - Posts messages to Slack channels
 * when recordings are received for links created via Slack
 */

import { postMessage } from '@/api/clients/slack';
import { createLogger } from '@/api/lib/logger';
import { buildRecordingReceivedMessage } from '@/api/lib/slack-blocks';
import { captureException } from '@/api/posthog';
import {
  IntegrationHelper,
  type IntegrationRepository,
} from '@/api/repositories/integrations.repository';

const logger = createLogger('slack-notification-service');

export class SlackNotificationService {
  constructor(private deps: { integrationRepo: IntegrationRepository }) {}

  /**
   * Post a notification to a Slack channel when a recording is received
   * Fire-and-forget: logs errors but does not throw
   */
  async notifyRecordingReceived(params: {
    workspaceId: string;
    channelId: string;
    userId?: string;
    recordingId: string;
    recordingUrl: string;
  }): Promise<void> {
    const { workspaceId, channelId, userId, recordingId, recordingUrl } = params;

    try {
      const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
        workspaceId,
        'slack'
      );

      if (!integration) {
        logger.debug({ workspaceId }, 'No active Slack integration found, skipping notification');
        return;
      }

      const accessToken = IntegrationHelper.getAccessToken(integration);
      const { blocks, text } = buildRecordingReceivedMessage({ recordingUrl });

      // Try posting to the channel
      const ts = await postMessage(accessToken, channelId, blocks, text);

      if (ts) {
        logger.debug(
          { workspaceId, channelId, recordingId },
          'Slack recording notification posted'
        );
        return;
      }

      // Channel post failed - try DM as fallback if userId is provided
      logger.warn(
        { workspaceId, channelId, recordingId },
        'Failed to post Slack recording notification to channel'
      );

      if (userId) {
        const dmTs = await postMessage(accessToken, userId, blocks, text);

        if (dmTs) {
          logger.debug(
            { workspaceId, userId, recordingId },
            'Slack recording notification sent via DM fallback'
          );
        } else {
          logger.warn(
            { workspaceId, userId, recordingId },
            'Failed to send Slack recording notification via DM fallback'
          );
          captureException(new Error('failed to post slack recording notification'), undefined, {
            operation: 'notify_recording_slack',
            channel_id: channelId,
            user_id: userId,
            workspace_id: workspaceId,
            recording_id: recordingId,
          });
        }
      } else {
        captureException(new Error('failed to post slack recording notification'), undefined, {
          operation: 'notify_recording_slack',
          channel_id: channelId,
          workspace_id: workspaceId,
          recording_id: recordingId,
        });
      }
    } catch (error) {
      logger.error(
        { err: error, workspaceId, channelId, recordingId },
        'Error posting Slack recording notification'
      );
      captureException(error, undefined, {
        component: 'slack_notification',
        operation: 'notify_recording_received',
        workspace_id: workspaceId,
        channel_id: channelId,
        recording_id: recordingId,
      });
    }
  }
}
