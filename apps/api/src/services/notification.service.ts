/**
 * NotificationService - Unified notification dispatch center
 *
 * Single entry point for all recording notifications. Callers pass recording
 * data once; all channel logic is handled internally. Every channel is
 * preference-gated via the notifyIncomingEvents JSONB column:
 * - channels.email → email to creator
 * - channels.slack → Slack DM to creator (with context if link was from Slack)
 * - channels.intercom → admin note on Intercom conversation (when link from Intercom)
 * - channels.zendesk → internal note on Zendesk ticket (when link from Zendesk)
 */

import { parseLinkProviderData } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { EmailService } from '@/api/services/email.service';
import type { IntercomNotificationService } from '@/api/services/intercom-notification.service';
import type { SlackNotificationService } from '@/api/services/slack-notification.service';
import type { ZendeskNotificationService } from '@/api/services/zendesk-notification.service';
import type { AccessRequestEmailParams, ReceipientEmailParams } from '@/api/types';
import { emailUrls } from '@/api/utils/email-urls';

const logger = createLogger('notification-service');

/**
 * Recording data shape returned by RecordingRepository.findByIdWithDetailsAndStatusGroup
 */
export interface RecordingNotificationContext {
  recordingId: string;
  workspaceId: string;
  creatorId: string;
  linkProviderType: string | null;
  linkProviderId: string | null;
  linkProviderData: unknown;
}

export interface NotificationServiceDeps {
  emailService: EmailService;
  memberRepo: WorkspaceMemberRepository;
  slackNotificationService: SlackNotificationService;
  intercomNotificationService: IntercomNotificationService;
  zendeskNotificationService: ZendeskNotificationService;
}

export class NotificationService {
  constructor(private deps: NotificationServiceDeps) {}

  // ===========================================================================
  // Public API — callers use these
  // ===========================================================================

  /**
   * Send all recording-received notifications across all channels.
   * Single entry point — reads the creator's notifyIncomingEvents JSONB
   * and dispatches to each enabled channel.
   */
  async sendSafeRecordingReceived(recording: RecordingNotificationContext): Promise<void> {
    const creator = await this.deps.memberRepo.findByIdWithUser(recording.creatorId);
    if (!creator) return;

    // Read creator's full member record for the JSONB column
    const creatorMember = await this.deps.memberRepo.findById(creator.workspaceMemberId);
    if (!creatorMember) return;

    const channels = this.deps.memberRepo.parseIncomingEventChannels(
      creatorMember.notifyIncomingEvents
    );

    const recordingUrl = emailUrls.recording.view(recording.workspaceId, recording.recordingId);

    // Email channel
    if (channels.email) {
      await this.dispatchEmail(recording, creator.userEmail);
    }

    // Slack channel — single path, enriched with context if link was from Slack
    if (channels.slack) {
      await this.dispatchSlack(recording, creator.workspaceMemberId, recordingUrl);
    }

    // Intercom channel — only when link originated from Intercom
    if (
      channels.intercom &&
      recording.linkProviderType === 'intercom' &&
      recording.linkProviderId
    ) {
      await this.dispatchIntercom(recording, recordingUrl);
    }

    // Zendesk channel — only when link originated from Zendesk
    if (channels.zendesk && recording.linkProviderType === 'zendesk' && recording.linkProviderId) {
      await this.dispatchZendesk(recording, recordingUrl);
    }
  }

  /**
   * Send access request email, gated on notifyAdminEvents preference
   */
  async sendSafeAccessRequest(
    workspaceId: string,
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccessRequestEmailParams
  ): Promise<void> {
    const emails = normalizeRecipients(receipientParams.to);
    const filtered = await this.filterRecipientsByPreference(
      workspaceId,
      emails,
      'notifyAdminEvents'
    );

    if (filtered.length === 0) return;

    await this.deps.emailService.sendSafeAccessRequest(
      { ...receipientParams, to: filtered },
      emailContentParams
    );
  }

  // ===========================================================================
  // Private — channel dispatch
  // ===========================================================================

  private async dispatchEmail(
    recording: RecordingNotificationContext,
    creatorEmail: string
  ): Promise<void> {
    // Use the preference filter to verify email channel is enabled
    // (this also checks active membership)
    const filtered = await this.filterRecipientsByPreference(
      recording.workspaceId,
      [creatorEmail],
      'notifyIncomingEvents'
    );

    if (filtered.length === 0) return;

    await this.deps.emailService.sendSafeRecordingReceived(
      { to: filtered },
      { workspaceId: recording.workspaceId, recordingId: recording.recordingId }
    );
  }

  private async dispatchSlack(
    recording: RecordingNotificationContext,
    creatorMemberId: string,
    recordingUrl: string
  ): Promise<void> {
    // If link was from Slack, use context-tied path (includes permalink/channel context)
    if (recording.linkProviderType === 'slack' && recording.linkProviderId) {
      const providerData = parseLinkProviderData('slack', recording.linkProviderData);
      if (providerData?.channelId) {
        await this.deps.slackNotificationService.notifyRecordingReceived({
          workspaceId: recording.workspaceId,
          channelId: providerData.channelId,
          channelName: providerData.channelName,
          userId: providerData.userId,
          threadTs: providerData.threadTs,
          recordingId: recording.recordingId,
          recordingUrl,
        });
        return;
      }
    }

    // Otherwise use preference-based path (identity-resolved Slack user ID)
    await this.deps.slackNotificationService.notifyByPreference({
      workspaceMemberId: creatorMemberId,
      workspaceId: recording.workspaceId,
      recordingId: recording.recordingId,
      recordingUrl,
    });
  }

  private async dispatchIntercom(
    recording: RecordingNotificationContext,
    recordingUrl: string
  ): Promise<void> {
    const providerData = parseLinkProviderData('intercom', recording.linkProviderData);
    if (!providerData?.adminId) return;

    await this.deps.intercomNotificationService.notifyRecordingReceived({
      workspaceId: recording.workspaceId,
      conversationId: recording.linkProviderId!,
      adminId: providerData.adminId,
      recordingId: recording.recordingId,
      recordingUrl,
    });
  }

  private async dispatchZendesk(
    recording: RecordingNotificationContext,
    recordingUrl: string
  ): Promise<void> {
    await this.deps.zendeskNotificationService.notifyRecordingReceived({
      workspaceId: recording.workspaceId,
      ticketId: recording.linkProviderId!,
      recordingId: recording.recordingId,
      recordingUrl,
    });
  }

  // ===========================================================================
  // Private — email preference filtering
  // ===========================================================================

  private async filterRecipientsByPreference(
    workspaceId: string,
    emails: string[],
    preferenceKey: 'notifyIncomingEvents' | 'notifyAdminEvents'
  ): Promise<string[]> {
    const optedIn = await this.deps.memberRepo.findMembersWithPreferenceEnabled(
      workspaceId,
      emails,
      preferenceKey
    );

    const filtered = emails.filter((email) => optedIn.has(email.toLowerCase()));

    const removedCount = emails.length - filtered.length;
    if (removedCount > 0) {
      logger.debug(
        { workspaceId, preferenceKey, removedCount, totalRecipients: emails.length },
        'Filtered recipients by notification preference'
      );
    }

    return filtered;
  }
}

function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}
