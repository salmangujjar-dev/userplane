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
  createProviderMeta,
  createProviderToken,
  provisionerError,
  workspaceError,
} from '@userplane/contract';

import {
  authTest,
  exchangeCodeForToken,
  getAuthorizationUrl,
  getUserInfo,
} from '@/api/clients/slack';
import { generateIntegrationId } from '@/api/lib/id';
import { createLogger } from '@/api/lib/logger';
import { deriveWorkspaceUrl } from '@/api/lib/workspace';
import { captureException } from '@/api/posthog';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { TokenService } from '@/api/services/token.service';

const logger = createLogger('slack-oauth');

export interface SlackServiceDeps {
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
  provisionerService: ProvisionerService;
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
}

type WorkspaceCreationResult =
  | { created: false; workspaceUrl?: string }
  | { created: true; workspaceId: string; workspaceName: string };

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
    await this.deps.integrationRepo.create({
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

    // 8. Warm cache for future lookups
    await this.deps.cacheService.setIntegrationByProviderWorkspace('slack', teamId, {
      workspaceId: result.workspaceId,
    });

    return {
      created: true,
      workspaceId: result.workspaceId,
      workspaceName: result.workspaceName,
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

    if (existingWorkspaceIntegration) {
      // Re-installation: update token and metadata
      // Slack scopes are additive on re-install and a new token is issued each time
      logger.info(
        { workspaceId, teamId },
        'Slack re-installation detected, updating existing integration'
      );
      await this.deps.integrationRepo.updateProviderToken(
        existingWorkspaceIntegration.id,
        providerToken
      );
      // Also update metadata in case team name or enterprise details changed
      await this.deps.integrationRepo.updateProviderMeta(
        existingWorkspaceIntegration.id,
        providerMeta
      );
    } else {
      // 6. Create new integration record
      await this.deps.integrationRepo.create({
        id: generateIntegrationId(),
        workspaceId,
        provider: 'slack',
        providerWorkspaceId: teamId,
        providerToken,
        providerMeta,
      });
    }

    // 7. Warm cache for future lookups
    await this.deps.cacheService.setIntegrationByProviderWorkspace('slack', teamId, {
      workspaceId,
    });

    return {
      connected: true,
      providerWorkspaceId: teamId,
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
  async disconnectIntegration(workspaceId: string): Promise<boolean> {
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

    // Invalidate caches to prevent stale lookups
    await this.deps.cacheService.invalidateIntegration('slack', integration.providerWorkspaceId);

    return true;
  }
}
