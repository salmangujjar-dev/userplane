/**
 * SlackNotificationService - Posts recording notifications to Slack
 *
 * When a recording is received for a Slack-created link, sends a DM
 * to the link creator with a deep link back to the original conversation.
 */

import { getPermalink, postMessage } from '@/api/clients/slack';
import { createLogger } from '@/api/lib/logger';
import { buildRecordingDmMessage } from '@/api/lib/slack-blocks';
import { captureException } from '@/api/posthog';
import {
  IntegrationHelper,
  type IntegrationRepository,
} from '@/api/repositories/integrations.repository';

const logger = createLogger('slack-notification-service');

export class SlackNotificationService {
  constructor(private deps: { integrationRepo: IntegrationRepository }) {}

  /**
   * Send a DM to the link creator when a recording is received.
   * Includes a deep link back to the original message when thread context is available.
   * Fire-and-forget: logs errors but does not throw.
   */
  async notifyRecordingReceived(params: {
    workspaceId: string;
    channelId: string;
    channelName?: string;
    userId?: string;
    threadTs?: string;
    recordingId: string;
    recordingUrl: string;
  }): Promise<void> {
    const { workspaceId, channelId, channelName, userId, threadTs, recordingId, recordingUrl } =
      params;

    if (!userId) {
      logger.debug(
        { workspaceId, recordingId },
        'No userId available, skipping Slack notification'
      );
      return;
    }

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

      // Get a permalink to the original message/thread if we have context
      let permalink: string | undefined;
      if (threadTs && channelId) {
        permalink = (await getPermalink(accessToken, channelId, threadTs)) ?? undefined;
      }

      const { blocks, text } = buildRecordingDmMessage({ recordingUrl, permalink, channelName });
      const ts = await postMessage(accessToken, userId, blocks, text);

      if (ts) {
        logger.debug({ userId, recordingId }, 'DM recording notification sent');
      } else {
        logger.warn({ userId, recordingId }, 'Failed to send DM recording notification');
        captureException(new Error('failed to send slack DM recording notification'), undefined, {
          operation: 'notify_recording_slack_dm',
          user_id: userId,
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
