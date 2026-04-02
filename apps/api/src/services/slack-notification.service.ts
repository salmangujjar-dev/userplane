/**
 * SlackNotificationService - All Slack notification dispatch
 *
 * Handles two types of Slack DMs for recording notifications:
 * 1. Context-tied: DM to link creator when recording originates from Slack
 * 2. Preference-based: DM to any member who enabled Slack as a notification channel
 *
 * Both paths share integration lookup, token extraction, and message building.
 * Fire-and-forget: logs errors but does not throw.
 */

import { extractProviderUserId } from '@userplane/contract';

import { getPermalink, postMessage } from '@/api/clients/slack';
import { createLogger } from '@/api/lib/logger';
import { buildRecordingReceivedMessage } from '@/api/lib/slack-blocks';
import { captureException } from '@/api/posthog';
import {
  IntegrationHelper,
  type IntegrationRepository,
} from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberIdentityRepository } from '@/api/repositories/workspace-member-identities.repository';

const logger = createLogger('slack-notification-service');

export interface SlackNotificationServiceDeps {
  integrationRepo: IntegrationRepository;
  memberIdentityRepo: WorkspaceMemberIdentityRepository;
}

export class SlackNotificationService {
  constructor(private deps: SlackNotificationServiceDeps) {}

  /**
   * Context-tied: DM the link creator when a recording is received
   * for a Slack-originated link. Includes deep link to original message.
   *
   * Returns the Slack user ID that was notified (for dedup), or undefined.
   */
  async notifyRecordingReceived(params: {
    workspaceId: string;
    channelId: string;
    channelName?: string;
    userId?: string;
    threadTs?: string;
    recordingId: string;
    recordingUrl: string;
  }): Promise<string | undefined> {
    const { workspaceId, channelId, channelName, userId, threadTs, recordingId, recordingUrl } =
      params;

    if (!userId) {
      logger.debug(
        { workspaceId, recordingId },
        'No userId available, skipping Slack notification'
      );
      return undefined;
    }

    try {
      const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
        workspaceId,
        'slack'
      );

      if (!integration) {
        logger.debug({ workspaceId }, 'No active Slack integration found, skipping notification');
        return undefined;
      }

      const accessToken = IntegrationHelper.getAccessToken(integration);

      // Get a permalink to the original message/thread if we have context
      let permalink: string | undefined;
      if (threadTs && channelId) {
        permalink = (await getPermalink(accessToken, channelId, threadTs)) ?? undefined;
      }

      const { blocks, text } = buildRecordingReceivedMessage({
        recordingUrl,
        permalink,
        channelName,
      });
      const ts = await postMessage(accessToken, userId, blocks, text);

      if (ts) {
        logger.debug({ userId, recordingId }, 'Context-tied Slack DM sent');
        return userId;
      }

      logger.warn({ userId, recordingId }, 'Failed to send context-tied Slack DM');
      captureException(new Error('failed to send slack DM recording notification'), undefined, {
        operation: 'notify_recording_slack_dm',
        user_id: userId,
        workspace_id: workspaceId,
        recording_id: recordingId,
      });
      return undefined;
    } catch (error) {
      logger.error(
        { err: error, workspaceId, channelId, recordingId },
        'Error posting context-tied Slack notification'
      );
      captureException(error, undefined, {
        component: 'slack_notification',
        operation: 'notify_recording_received',
        workspace_id: workspaceId,
        channel_id: channelId,
        recording_id: recordingId,
      });
      return undefined;
    }
  }

  /**
   * Preference-based: DM a member who has Slack enabled as a notification channel.
   * Resolves the member's Slack user ID from their stored identity.
   * Skips if the same user was already notified via context-tied path (dedup).
   */
  async notifyByPreference(params: {
    workspaceMemberId: string;
    workspaceId: string;
    recordingId: string;
    recordingUrl: string;
    skipUserId?: string;
  }): Promise<void> {
    const { workspaceMemberId, workspaceId, recordingId, recordingUrl, skipUserId } = params;

    try {
      // 1. Look up member identity
      const identity = await this.deps.memberIdentityRepo.findByMemberAndProvider(
        workspaceMemberId,
        'slack'
      );
      if (!identity) {
        logger.warn(
          { workspaceMemberId, workspaceId },
          'Slack channel enabled but no identity found, skipping'
        );
        return;
      }

      const slackUserId = extractProviderUserId('slack', identity.providerMeta);

      // 2. Dedup: skip if context-tied notification already sent to this user
      if (skipUserId && skipUserId === slackUserId) {
        logger.debug(
          { workspaceMemberId, slackUserId },
          'Skipping preference-based Slack DM (already sent via context-tied notification)'
        );
        return;
      }

      // 3. Get integration token
      const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
        workspaceId,
        'slack'
      );
      if (!integration) {
        logger.debug(
          { workspaceId },
          'No active Slack integration, skipping preference-based notification'
        );
        return;
      }

      const accessToken = IntegrationHelper.getAccessToken(integration);

      // 4. Build message and send DM
      const { blocks, text } = buildRecordingReceivedMessage({ recordingUrl });
      const ts = await postMessage(accessToken, slackUserId, blocks, text);

      if (ts) {
        logger.debug(
          { workspaceMemberId, slackUserId, recordingId },
          'Preference-based Slack DM sent'
        );
      } else {
        logger.warn(
          { workspaceMemberId, slackUserId, recordingId },
          'Failed to send preference-based Slack DM'
        );
        captureException(new Error('failed to send preference-based slack DM'), undefined, {
          operation: 'notify_recording_slack_preference',
          workspace_member_id: workspaceMemberId,
          slack_user_id: slackUserId,
          workspace_id: workspaceId,
          recording_id: recordingId,
        });
      }
    } catch (error) {
      logger.error(
        { err: error, workspaceMemberId, workspaceId, recordingId },
        'Error dispatching preference-based Slack notification'
      );
      captureException(error, undefined, {
        component: 'slack_notification',
        operation: 'notify_recording_by_preference',
        workspace_member_id: workspaceMemberId,
        workspace_id: workspaceId,
        recording_id: recordingId,
      });
    }
  }
}
