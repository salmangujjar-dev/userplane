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

import { createMemberIdentityMeta, extractProviderUserId } from '@userplane/contract';

import { getPermalink, lookupByEmail, postMessage } from '@/api/clients/slack';
import { generateMemberIdentityId } from '@/api/lib/id';
import { createLogger } from '@/api/lib/logger';
import { buildRecordingReceivedMessage } from '@/api/lib/slack-blocks';
import { captureException } from '@/api/posthog';
import {
  IntegrationHelper,
  type IntegrationRepository,
} from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberIdentityRepository } from '@/api/repositories/workspace-member-identities.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';

const logger = createLogger('slack-notification-service');

export interface SlackNotificationServiceDeps {
  integrationRepo: IntegrationRepository;
  memberIdentityRepo: WorkspaceMemberIdentityRepository;
  memberRepo: WorkspaceMemberRepository;
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
      // 1. Get integration token (needed for both identity resolution and sending)
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

      // 2. Look up member identity, lazily resolve if missing
      let identity = await this.deps.memberIdentityRepo.findByMemberAndProvider(
        workspaceMemberId,
        'slack'
      );
      if (!identity) {
        identity = await this.lazyResolveSlackIdentity(
          workspaceMemberId,
          workspaceId,
          accessToken,
          integration.providerMeta.teamId
        );
        if (!identity) {
          return; // lazyResolveSlackIdentity already logged, will retry on next notification
        }
      }

      const slackUserId = extractProviderUserId('slack', identity.providerMeta);

      // 3. Dedup: skip if context-tied notification already sent to this user
      if (skipUserId && skipUserId === slackUserId) {
        logger.debug(
          { workspaceMemberId, slackUserId },
          'Skipping preference-based Slack DM (already sent via context-tied notification)'
        );
        return;
      }

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

  /**
   * Lazily resolve a Slack identity for a member who has slack enabled
   * but no identity record. Creates the identity if email matches a Slack user.
   * Does NOT modify preferences on failure — the issue may be transient.
   */
  private async lazyResolveSlackIdentity(
    workspaceMemberId: string,
    workspaceId: string,
    accessToken: string,
    teamId: string
  ) {
    try {
      const member = await this.deps.memberRepo.findByIdWithUser(workspaceMemberId);
      if (!member) {
        logger.warn(
          { workspaceMemberId },
          'Member not found during lazy Slack identity resolution'
        );
        return null;
      }

      const slackUser = await lookupByEmail(accessToken, member.userEmail);
      if (!slackUser) {
        logger.warn(
          { workspaceMemberId, workspaceId, email: member.userEmail },
          'Slack user not found by email during lazy identity resolution'
        );
        return null;
      }

      const meta = createMemberIdentityMeta('slack', {
        userId: slackUser.id,
        teamId,
        email: member.userEmail,
      });

      // Race-safe: if another notification already created the identity, use it
      const existingIdentity = await this.deps.memberIdentityRepo.findByMemberAndProvider(
        workspaceMemberId,
        'slack'
      );
      if (existingIdentity) {
        return existingIdentity;
      }

      const identity = await this.deps.memberIdentityRepo.create({
        id: generateMemberIdentityId(),
        workspaceMemberId,
        workspaceId,
        provider: 'slack',
        providerMeta: meta,
      });

      logger.info(
        { workspaceMemberId, workspaceId, slackUserId: slackUser.id },
        'Lazily resolved Slack identity'
      );

      return identity;
    } catch (error) {
      logger.error(
        { err: error, workspaceMemberId, workspaceId },
        'Failed to lazily resolve Slack identity'
      );
      captureException(error, undefined, {
        component: 'slack_notification',
        operation: 'lazy_resolve_slack_identity',
        workspace_member_id: workspaceMemberId,
        workspace_id: workspaceId,
      });
      return null;
    }
  }
}
