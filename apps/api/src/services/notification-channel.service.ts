/**
 * NotificationChannelService - Channel configuration management
 *
 * Manages notification channel preferences (enable/disable/available)
 * and identity resolution for workspace members. Does NOT dispatch
 * notifications — that is handled by NotificationService.
 *
 * Channels are stored in the notifyIncomingEvents JSONB column on
 * workspace_members. Identity resolution for Slack happens at enable-time.
 */

import type { MemberIdentityProvider } from '@userplane/contract';
import { createMemberIdentityMeta } from '@userplane/contract';

import { lookupByEmail } from '@/api/clients/slack';
import { generateMemberIdentityId } from '@/api/lib/id';
import {
  IntegrationHelper,
  type IntegrationRepository,
} from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberIdentityRepository } from '@/api/repositories/workspace-member-identities.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { Transaction } from '@/api/types';

export interface NotificationChannelServiceDeps {
  memberRepo: WorkspaceMemberRepository;
  memberIdentityRepo: WorkspaceMemberIdentityRepository;
  integrationRepo: IntegrationRepository;
}

export class NotificationChannelService {
  constructor(private deps: NotificationChannelServiceDeps) {}

  /**
   * Enable a notification channel for a workspace member.
   * For Slack: resolves identity via email match, stores mapping, updates JSONB.
   * For Intercom/Zendesk: no identity needed, just updates JSONB.
   */
  async enableChannel(
    workspaceMemberId: string,
    workspaceId: string,
    userEmail: string,
    channel: MemberIdentityProvider,
    options?: { tx?: Transaction }
  ): Promise<void> {
    if (channel === 'slack') {
      await this.enableSlackChannel(workspaceMemberId, workspaceId, userEmail, options);
    } else {
      // Intercom/Zendesk — no identity resolution, just toggle the JSONB key
      await this.deps.memberRepo.updateNotificationPreferences(
        workspaceMemberId,
        { notifyIncomingEvents: { [channel]: true } },
        options
      );
    }
  }

  /**
   * Disable a notification channel for a workspace member.
   * Removes the channel from notifyIncomingEvents JSONB.
   * For Slack: also soft-deletes the identity.
   */
  async disableChannel(
    workspaceMemberId: string,
    channel: MemberIdentityProvider,
    options?: { tx?: Transaction }
  ): Promise<void> {
    // Set channel to false in JSONB
    await this.deps.memberRepo.updateNotificationPreferences(
      workspaceMemberId,
      { notifyIncomingEvents: { [channel]: false } },
      options
    );

    // For Slack, also soft-delete the identity
    if (channel === 'slack') {
      await this.deps.memberIdentityRepo.softDelete(
        workspaceMemberId,
        channel,
        new Date(),
        options
      );
    }
  }

  /**
   * Get available notification channels for a workspace.
   * Returns channels that have an active integration.
   */
  async getAvailableChannels(workspaceId: string): Promise<string[]> {
    const integrations = await this.deps.integrationRepo.findByWorkspaceId(workspaceId);
    const activeProviders = new Set(integrations.map((i) => i.provider));

    return (['slack', 'intercom', 'zendesk'] as const).filter((p) => activeProviders.has(p));
  }

  // ===========================================================================
  // Private helpers
  // ===========================================================================

  private async enableSlackChannel(
    workspaceMemberId: string,
    workspaceId: string,
    userEmail: string,
    options?: { tx?: Transaction }
  ): Promise<void> {
    // 1. Check for active Slack integration
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'slack'
    );
    if (!integration) {
      throw new Error('Slack is not connected to this workspace');
    }

    const accessToken = IntegrationHelper.getAccessToken(integration);

    // 2. Resolve Slack user by email
    const slackUser = await lookupByEmail(accessToken, userEmail);
    if (!slackUser) {
      throw new Error('Could not find your Slack account. Make sure your email addresses match.');
    }

    // 3. Create or update identity mapping
    const existing = await this.deps.memberIdentityRepo.findByMemberAndProvider(
      workspaceMemberId,
      'slack'
    );

    const meta = createMemberIdentityMeta('slack', {
      userId: slackUser.id,
      teamId: integration.providerMeta.teamId,
      email: userEmail,
    });

    if (existing) {
      await this.deps.memberIdentityRepo.updateProviderMeta(existing.id, meta, options);
    } else {
      await this.deps.memberIdentityRepo.create(
        {
          id: generateMemberIdentityId(),
          workspaceMemberId,
          workspaceId,
          provider: 'slack',
          providerMeta: meta,
        },
        options
      );
    }

    // 4. Enable slack in notifyIncomingEvents JSONB
    await this.deps.memberRepo.updateNotificationPreferences(
      workspaceMemberId,
      { notifyIncomingEvents: { slack: true } },
      options
    );
  }
}
