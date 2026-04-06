/**
 * SlackService - Handles Slack OAuth flow and integration management
 * Orchestrates OAuth V2 authorization, token exchange, and workspace integration
 * Supports two flows:
 * 1. Onboarding flow: Creates a new workspace during OAuth (no workspaceId in state)
 * 2. Workspace integration flow: Connects to existing workspace (workspaceId in state)
 * Handles re-installation by updating existing tokens rather than failing
 */

import type { CacheService } from '@userplane/cache';
import {
  createMemberIdentityMeta,
  createProviderMeta,
  createProviderToken,
  FormEmailSchema,
  provisionerError,
  type SlackMemberItem,
  workspaceError,
} from '@userplane/contract';

import {
  authTest,
  exchangeCodeForToken,
  getAuthorizationUrl,
  getUserInfo,
  listUsers,
  listUsersAll,
  type SlackUser,
} from '@/api/clients/slack';
import { generateIntegrationId, generateMemberIdentityId } from '@/api/lib/id';
import { createLogger } from '@/api/lib/logger';
import { deriveWorkspaceUrl } from '@/api/lib/workspace';
import { captureException } from '@/api/posthog';
import type {
  IntegrationRepository,
  TypedIntegration,
} from '@/api/repositories/integrations.repository';
import type {
  CreateMemberIdentityInput,
  WorkspaceMemberIdentityRepository,
} from '@/api/repositories/workspace-member-identities.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { TokenService } from '@/api/services/token.service';

const logger = createLogger('slack-oauth');

/** Maximum number of member suggestions to return */
const MAX_MEMBER_SUGGESTIONS = 10;

export interface SlackServiceDeps {
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
  provisionerService: ProvisionerService;
  memberRepo: WorkspaceMemberRepository;
  memberIdentityRepo: WorkspaceMemberIdentityRepository;
}

/**
 * Integration status result
 */
export interface SlackIntegrationStatus {
  connected: boolean;
  providerWorkspaceId: string | null;
  connectedAt: Date | null;
}

/**
 * Integration connect result
 */
export interface SlackIntegrationConnectResult {
  connected: true;
  providerWorkspaceId: string;
  accessToken: string;
  authedSlackUserId: string;
}

type WorkspaceCreationResult =
  | { created: false; workspaceUrl?: string }
  | {
      created: true;
      workspaceId: string;
      workspaceName: string;
      accessToken: string;
      authedSlackUserId: string;
    };

export class SlackService {
  constructor(private deps: SlackServiceDeps) {}

  /**
   * Generate OAuth authorization URL with signed state token
   * @param userId - The user initiating the OAuth flow
   * @param workspaceId - Optional workspace ID (absent for onboarding, present for integration)
   */
  generateAuthorizationUrl(
    userId: string,
    workspaceId?: string
  ): { authorizationUrl: string; state: string } {
    const state = this.deps.tokenService.signSlackOAuthState(userId, workspaceId);
    const authorizationUrl = getAuthorizationUrl(state);

    return { authorizationUrl, state };
  }

  // ============================================================================
  // ONBOARDING FLOW (workspace creation via Slack OAuth)
  // ============================================================================

  /**
   * Validate OAuth state token
   * Returns true if state is valid for the given user and optional workspace
   */
  private validateState(state: string, userId: string, workspaceId?: string): boolean {
    const payload = this.deps.tokenService.verifySlackOAuthState(state, userId, workspaceId);
    return payload !== null;
  }

  /**
   * Handle OAuth callback for onboarding flow
   * Exchanges code for token, fetches user info from Slack, and creates workspace
   */
  async handleCallback(params: {
    code: string;
    state: string;
    userId: string;
    userName?: string;
    userEmail: string;
    userRole?: string | null;
  }): Promise<WorkspaceCreationResult> {
    const { code, state, userId, userName, userEmail, userRole } = params;

    // 1. Validate state token (no workspaceId verification — onboarding mode)
    if (!this.validateState(state, userId)) {
      throw provisionerError.SLACK_OAUTH_STATE_INVALID();
    }

    // 2. Exchange code for bot access token
    const tokenResponse = await exchangeCodeForToken(code);
    if (!tokenResponse) {
      throw provisionerError.SLACK_TOKEN_EXCHANGE_FAILED();
    }

    // 3. Validate token via auth.test
    const authResult = await authTest(tokenResponse.access_token);
    if (!authResult) {
      throw provisionerError.SLACK_AUTH_VALIDATION_FAILED();
    }

    const teamId = tokenResponse.team.id;
    const teamName = tokenResponse.team.name;

    // 4. Get installing user's email from Slack to derive workspace URL
    // Slack profile email is typically their work email, better for workspace domain
    let workspaceUrl: string;
    const slackUser = await getUserInfo(tokenResponse.access_token, tokenResponse.authed_user.id);
    if (slackUser?.profile?.email) {
      workspaceUrl = deriveWorkspaceUrl(slackUser.profile.email);
    } else {
      // Fall back to the authenticated user's email
      logger.warn({ userId, teamId }, 'Could not get Slack user email, falling back to auth email');
      workspaceUrl = deriveWorkspaceUrl(userEmail);
    }

    // 5. Check if this Slack team is already connected
    const existingIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'slack',
      teamId
    );
    if (existingIntegration) {
      throw provisionerError.SLACK_WORKSPACE_ALREADY_CONNECTED();
    }

    // 6. Create workspace using ProvisionerService
    const result = await this.deps.provisionerService.createWorkspaceByURLAndName({
      url: workspaceUrl,
      workspaceName: teamName,
      userId,
      userName,
      userEmail,
      userRole,
    });

    if (!result.created) {
      throw provisionerError.PROVISIONER_WORKSPACE_CREATE_FAILED();
    }

    // 7. Create integration record
    const integration = await this.deps.integrationRepo.create({
      id: generateIntegrationId(),
      workspaceId: result.workspaceId,
      provider: 'slack',
      providerWorkspaceId: teamId,
      providerToken: createProviderToken('slack', {
        accessToken: tokenResponse.access_token,
        botUserId: tokenResponse.bot_user_id,
        appId: tokenResponse.app_id,
        authedUserId: tokenResponse.authed_user.id,
      }),
      providerMeta: createProviderMeta('slack', {
        teamId: tokenResponse.team.id,
        teamName: tokenResponse.team.name,
        enterpriseId: tokenResponse.enterprise?.id,
        isEnterpriseInstall: tokenResponse.is_enterprise_install,
      }),
    });

    // 8. Enable Slack channel for all workspace members
    try {
      await this.deps.memberRepo.enableIncomingEventChannel(result.workspaceId, 'slack');
    } catch (error) {
      logger.error(
        { err: error, workspaceId: result.workspaceId },
        'Failed to enable Slack channel for members'
      );
    }

    // 9. Bulk-resolve Slack identities for existing members (best-effort, non-blocking)
    this.bulkResolveSlackIdentities(result.workspaceId, tokenResponse.access_token, teamId).catch(
      (error) => {
        logger.error(
          { err: error, workspaceId: result.workspaceId },
          'Unhandled error in bulk Slack identity resolution'
        );
      }
    );

    // 10. Warm cache with full integration for canvas service lookups
    await this.deps.cacheService.setIntegrationByProviderWorkspace('slack', teamId, integration);

    return {
      created: true,
      workspaceId: result.workspaceId,
      workspaceName: result.workspaceName,
      accessToken: tokenResponse.access_token,
      authedSlackUserId: tokenResponse.authed_user.id,
    };
  }

  // ============================================================================
  // WORKSPACE INTEGRATION FLOW (for existing workspaces)
  // ============================================================================

  /**
   * Handle OAuth callback for workspace integration flow
   * Exchanges code for bot token, validates via auth.test, and creates or updates integration
   */
  async handleIntegrationCallback(params: {
    code: string;
    state: string;
    userId: string;
    workspaceId: string;
  }): Promise<SlackIntegrationConnectResult> {
    const { code, state, userId, workspaceId } = params;

    // 1. Validate state token with workspace ID
    const statePayload = this.deps.tokenService.verifySlackOAuthState(state, userId, workspaceId);
    if (!statePayload) {
      throw workspaceError.FORBIDDEN();
    }

    // 2. Exchange code for bot access token
    const tokenResponse = await exchangeCodeForToken(code);
    if (!tokenResponse) {
      logger.error({ workspaceId }, 'Slack token exchange failed');
      captureException(new Error('slack token exchange failed'), undefined, {
        operation: 'slack_oauth_callback',
        workspaceId,
      });
      throw provisionerError.SLACK_TOKEN_EXCHANGE_FAILED();
    }

    // 3. Validate token via auth.test
    const authResult = await authTest(tokenResponse.access_token);
    if (!authResult) {
      logger.error('Slack auth.test failed after token exchange');
      captureException(new Error('slack auth.test failed after token exchange'), undefined, {
        operation: 'slack_oauth_callback',
        workspaceId,
      });
      throw provisionerError.SLACK_AUTH_VALIDATION_FAILED();
    }

    const teamId = tokenResponse.team.id;

    // 4. Check if this Slack team is already connected to another userplane workspace
    const existingProviderIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'slack',
      teamId
    );

    if (existingProviderIntegration && existingProviderIntegration.workspaceId !== workspaceId) {
      // Team is connected to a different workspace — conflict
      throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
    }

    // 5. Check if this workspace already has a Slack integration
    const existingWorkspaceIntegration =
      await this.deps.integrationRepo.findByWorkspaceIdAndProvider(workspaceId, 'slack');

    const providerToken = createProviderToken('slack', {
      accessToken: tokenResponse.access_token,
      botUserId: tokenResponse.bot_user_id,
      appId: tokenResponse.app_id,
      authedUserId: tokenResponse.authed_user.id,
    });

    const providerMeta = createProviderMeta('slack', {
      teamId: tokenResponse.team.id,
      teamName: tokenResponse.team.name,
      enterpriseId: tokenResponse.enterprise?.id,
      isEnterpriseInstall: tokenResponse.is_enterprise_install,
    });

    let integration: TypedIntegration<'slack'>;

    if (existingWorkspaceIntegration) {
      // Re-installation: update token and metadata
      // Slack scopes are additive on re-install and a new token is issued each time
      logger.info(
        { workspaceId, teamId },
        'Slack re-installation detected, updating existing integration'
      );
      // Invalidate stale cache before DB updates to prevent serving old tokens
      await this.deps.cacheService.invalidateIntegration('slack', teamId);
      await this.deps.integrationRepo.updateProviderToken(
        existingWorkspaceIntegration.id,
        providerToken
      );
      await this.deps.integrationRepo.updateProviderMeta(
        existingWorkspaceIntegration.id,
        providerMeta
      );
      // Re-fetch from DB to get the authoritative state (correct updatedAt, etc.)
      const fresh = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);
      if (!fresh) {
        throw workspaceError.INTEGRATION_NOT_FOUND();
      }
      integration = fresh;
    } else {
      // 6. Create new integration record
      integration = await this.deps.integrationRepo.create({
        id: generateIntegrationId(),
        workspaceId,
        provider: 'slack',
        providerWorkspaceId: teamId,
        providerToken,
        providerMeta,
      });

      // 6b. Enable Slack channel for all workspace members
      try {
        await this.deps.memberRepo.enableIncomingEventChannel(workspaceId, 'slack');
      } catch (error) {
        logger.error({ err: error, workspaceId }, 'Failed to enable Slack channel for members');
      }
    }

    // 7. Bulk-resolve Slack identities for all workspace members (best-effort, non-blocking)
    this.bulkResolveSlackIdentities(workspaceId, tokenResponse.access_token, teamId).catch(
      (error) => {
        logger.error(
          { err: error, workspaceId },
          'Unhandled error in bulk Slack identity resolution'
        );
      }
    );

    // 8. Warm cache with full integration for canvas service lookups
    await this.deps.cacheService.setIntegrationByProviderWorkspace('slack', teamId, integration);

    return {
      connected: true,
      providerWorkspaceId: teamId,
      accessToken: tokenResponse.access_token,
      authedSlackUserId: tokenResponse.authed_user.id,
    };
  }

  /**
   * Get integration status for a workspace
   */
  async getIntegrationStatus(workspaceId: string): Promise<SlackIntegrationStatus> {
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'slack'
    );

    if (!integration) {
      return {
        connected: false,
        providerWorkspaceId: null,
        connectedAt: null,
      };
    }

    return {
      connected: true,
      providerWorkspaceId: integration.providerWorkspaceId,
      connectedAt: integration.createdAt,
    };
  }

  /**
   * Disconnect Slack integration from a workspace
   * Returns true if disconnected, throws if not found
   */
  async disconnectIntegration(workspaceId: string): Promise<TypedIntegration<'slack'>> {
    // Get integration first to retrieve providerWorkspaceId for cache invalidation
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'slack'
    );

    if (!integration) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    // Delete the integration
    const deleted = await this.deps.integrationRepo.delete(workspaceId, 'slack');

    if (!deleted) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    // Clean up notification channel preferences and identities
    const deletedAt = new Date();
    try {
      // Remove 'slack' key from notifyIncomingEvents for all workspace members
      await this.deps.memberRepo.clearIncomingEventChannel(workspaceId, 'slack');
      // Soft-delete all Slack identities for this workspace
      await this.deps.memberIdentityRepo.softDeleteByWorkspaceAndProvider(
        workspaceId,
        'slack',
        deletedAt
      );
    } catch (error) {
      // Log but don't fail - integration is already disconnected
      logger.error(
        { err: error, workspaceId },
        'Error cleaning up Slack notification channels during disconnect'
      );
      captureException(error, undefined, {
        operation: 'disconnect_slack_channel_cleanup',
        workspace_id: workspaceId,
      });
    }

    // Invalidate caches to prevent stale lookups
    await this.deps.cacheService.invalidateIntegration('slack', integration.providerWorkspaceId);

    return integration;
  }

  // ============================================================================
  // BULK IDENTITY RESOLUTION
  // ============================================================================

  /**
   * Bulk-resolve Slack identities for all workspace members.
   * Fetches all Slack users in one paginated API call, then matches by normalized
   * email against workspace members to create identity records in a single batch insert.
   *
   * Best-effort: never throws. Callers should fire-and-forget with .catch().
   */
  private async bulkResolveSlackIdentities(
    workspaceId: string,
    accessToken: string,
    teamId: string
  ): Promise<void> {
    try {
      // 1. Fetch all Slack workspace members (paginated at 200/page)
      const slackUsers = await listUsersAll(accessToken);
      if (slackUsers.length === 0) return;

      // 2. Build normalized email → SlackUser map (skip users without email)
      const slackEmailMap = new Map<string, SlackUser>();
      for (const slackUser of slackUsers) {
        if (!slackUser.profile.email) continue;
        const emailResult = FormEmailSchema.safeParse(slackUser.profile.email);
        if (emailResult.success) {
          slackEmailMap.set(emailResult.data, slackUser);
        }
      }

      if (slackEmailMap.size === 0) return;

      // 3. Fetch all workspace members with emails (single query — workspaces are small at this stage)
      const memberCount = await this.deps.memberRepo.countByWorkspace(workspaceId);
      if (memberCount === 0) return;

      const members = await this.deps.memberRepo.findByWorkspaceWithUsersPaginated(
        workspaceId,
        memberCount,
        0
      );

      // 4. Fetch existing Slack identities to skip already-resolved members
      const existingIdentities =
        await this.deps.memberIdentityRepo.findActiveByWorkspaceAndProvider(workspaceId, 'slack');
      const resolvedMemberIds = new Set(existingIdentities.map((i) => i.workspaceMemberId));

      // 5. Match workspace members to Slack users by normalized email
      const newIdentities: CreateMemberIdentityInput<'slack'>[] = [];

      for (const member of members) {
        if (resolvedMemberIds.has(member.workspaceMemberId)) continue;

        const emailResult = FormEmailSchema.safeParse(member.userEmail);
        if (!emailResult.success) continue;

        const slackUser = slackEmailMap.get(emailResult.data);
        if (!slackUser) continue;

        newIdentities.push({
          id: generateMemberIdentityId(),
          workspaceMemberId: member.workspaceMemberId,
          workspaceId,
          provider: 'slack',
          providerMeta: createMemberIdentityMeta('slack', {
            userId: slackUser.id,
            teamId,
            email: emailResult.data,
          }),
        });
      }

      // 6. Batch insert all new identities in a single query
      if (newIdentities.length > 0) {
        await this.deps.memberIdentityRepo.createMany(newIdentities);
      }

      logger.info(
        { workspaceId, created: newIdentities.length, totalMembers: members.length },
        'Bulk-resolved Slack identities'
      );
    } catch (error) {
      logger.error({ err: error, workspaceId }, 'Failed to bulk-resolve Slack identities');
      captureException(error, undefined, {
        operation: 'bulk_resolve_slack_identities',
        workspace_id: workspaceId,
      });
    }
  }

  // ============================================================================
  // MEMBER FETCHING (for invite flow)
  // ============================================================================

  /**
   * Fetch members from Slack and normalize their emails.
   * No caching — this is a one-shot call during the invite flow.
   * @returns Map of normalized email to SlackUser
   */
  private async _fetchAndNormalizeMembers(workspaceId: string): Promise<Map<string, SlackUser>> {
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'slack'
    );

    if (!integration) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    const providerToken = integration.providerToken as { accessToken: string };
    const members = await listUsers(providerToken.accessToken);

    if (members.length === 0) {
      return new Map();
    }

    const memberEmailMap = new Map<string, SlackUser>();
    for (const member of members) {
      const emailResult = FormEmailSchema.safeParse(member.profile.email);
      if (emailResult.success) {
        memberEmailMap.set(emailResult.data, member);
      }
    }

    return memberEmailMap;
  }

  /**
   * Build list of member items from Slack, optionally excluding existing workspace members.
   * @param workspaceId - The workspace ID
   * @param options - Configuration for filtering
   * @returns Array of member items matching the Teammate interface
   */
  private async _buildMemberItemList(
    workspaceId: string,
    options: { excludeMembers: boolean }
  ): Promise<SlackMemberItem[]> {
    const memberEmailMap = await this._fetchAndNormalizeMembers(workspaceId);

    if (memberEmailMap.size === 0) {
      return [];
    }

    let existingMemberEmails: Set<string> = new Set();
    if (options.excludeMembers) {
      existingMemberEmails = await this.deps.memberRepo.findMatchingMemberEmails(workspaceId, [
        ...memberEmailMap.keys(),
      ]);
    }

    const result: SlackMemberItem[] = [];
    for (const [normalizedEmail, member] of memberEmailMap) {
      if (options.excludeMembers && existingMemberEmails.has(normalizedEmail)) {
        continue;
      }

      result.push({
        id: member.id,
        email: normalizedEmail,
        name: member.real_name ?? member.profile.display_name ?? null,
      });
    }

    return result;
  }

  /**
   * Get members from the connected Slack workspace.
   * Optionally filters out users who are already workspace members.
   * @param workspaceId - The workspace ID
   * @param excludeMembers - If true, excludes users who are already workspace members
   */
  async getMembers(
    workspaceId: string,
    excludeMembers: boolean = false
  ): Promise<SlackMemberItem[]> {
    return this._buildMemberItemList(workspaceId, { excludeMembers });
  }

  /**
   * Get suggested members from Slack for the invite modal.
   * Always excludes existing workspace members and returns empty on any error (graceful degradation).
   * @param workspaceId - The workspace ID
   * @param options - Optional configuration { limit?: number }
   * @returns Object with suggestions array and hasMore flag (never throws)
   */
  async suggestMembers(
    workspaceId: string,
    options?: { limit?: number }
  ): Promise<{ suggestions: SlackMemberItem[]; hasMore: boolean }> {
    try {
      const limit = Math.min(options?.limit ?? 5, MAX_MEMBER_SUGGESTIONS);

      const members = await this._buildMemberItemList(workspaceId, { excludeMembers: true });

      const hasMore = members.length > limit;
      const suggestions = hasMore ? members.slice(0, limit) : members;

      return { suggestions, hasMore };
    } catch {
      return { suggestions: [], hasMore: false };
    }
  }
}
