/**
 * ZendeskService - Handles Zendesk OAuth flow and integration management
 * Supports two flows:
 * 1. Onboarding flow: Creates a new workspace during OAuth (no workspaceId in state)
 * 2. Workspace integration flow: Connects to existing workspace (workspaceId in state)
 */

import type { CacheService } from '@userplane/cache';
import {
  createProviderMeta,
  createProviderToken,
  provisionerError,
  workspaceError,
} from '@userplane/contract';
import { nanoid } from 'nanoid';

import { exchangeCodeForToken, getAuthorizationUrl, getMe } from '@/api/clients/zendesk';
import { generateIntegrationId } from '@/api/lib/id';
import { deriveWorkspaceUrl } from '@/api/lib/workspace';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { TokenService } from '@/api/services/token.service';
import type { ZendeskOAuthSource } from '@/api/types';

export interface ZendeskServiceDeps {
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  provisionerService: ProvisionerService;
  cacheService: CacheService;
}

type WorkspaceCreationResult =
  | { created: false; workspaceUrl?: string }
  | { created: true; workspaceId: string; workspaceName: string };

/**
 * Integration status result
 */
export interface ZendeskIntegrationStatus {
  connected: boolean;
  providerWorkspaceId: string | null;
  connectedAt: Date | null;
}

/**
 * Integration connect result
 */
export interface ZendeskIntegrationConnectResult {
  connected: true;
  providerWorkspaceId: string;
}

export class ZendeskService {
  constructor(private deps: ZendeskServiceDeps) {}

  /**
   * Generate OAuth authorization URL with signed state token
   * Zendesk requires subdomain for per-account OAuth
   * @param userId - The user initiating the OAuth flow
   * @param subdomain - The Zendesk subdomain
   * @param workspaceId - Optional workspace ID for workspace integration flow
   * @param source - Origin of the OAuth flow for callback routing
   */
  generateAuthorizationUrl(
    userId: string,
    subdomain: string,
    workspaceId?: string,
    source?: ZendeskOAuthSource
  ): { authorizationUrl: string; state: string } {
    const { state, codeChallenge } = this.deps.tokenService.signZendeskOAuthState(
      userId,
      subdomain,
      workspaceId,
      source
    );
    const authorizationUrl = getAuthorizationUrl(subdomain, state, codeChallenge);

    return { authorizationUrl, state };
  }

  /**
   * Handle OAuth callback for workspace integration flow
   * Connects Zendesk to an existing workspace
   */
  async handleIntegrationCallback(params: {
    code: string;
    state: string;
    userId: string;
    workspaceId: string;
  }): Promise<ZendeskIntegrationConnectResult> {
    const { code, state, userId, workspaceId } = params;

    // 1. Validate state token with workspace ID
    const statePayload = this.deps.tokenService.verifyZendeskOAuthState(state, userId, workspaceId);
    if (!statePayload) {
      throw provisionerError.ZENDESK_OAUTH_STATE_INVALID();
    }

    const { subdomain, codeVerifier } = statePayload;

    // 2. Check if workspace already has a Zendesk integration
    const existingWorkspaceIntegration =
      await this.deps.integrationRepo.findByWorkspaceIdAndProvider(workspaceId, 'zendesk');
    if (existingWorkspaceIntegration) {
      throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
    }

    // 3. Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(subdomain, code, codeVerifier);
    if (!tokenResponse) {
      throw provisionerError.ZENDESK_TOKEN_EXCHANGE_FAILED();
    }

    // 4. Get user info from Zendesk
    const meResult = await getMe(subdomain, tokenResponse.access_token);
    if (!meResult) {
      throw provisionerError.ZENDESK_USER_INFO_FAILED();
    }

    // Use Zendesk account subdomain as the provider workspace ID
    const providerWorkspaceId = subdomain;

    // 5. Check if this Zendesk account is already connected to another workspace
    const existingProviderIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'zendesk',
      providerWorkspaceId
    );
    if (existingProviderIntegration) {
      throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
    }

    // 6. Generate API token for iframe→API auth
    const apiToken = nanoid(48);

    // 7. Create integration record
    const now = Date.now();
    await this.deps.integrationRepo.create({
      id: generateIntegrationId(),
      workspaceId,
      provider: 'zendesk',
      providerWorkspaceId,
      providerToken: createProviderToken('zendesk', {
        accessToken: tokenResponse.access_token,
        apiToken,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt: tokenResponse.expires_in
          ? new Date(now + tokenResponse.expires_in * 1000).toISOString()
          : undefined,
        refreshTokenExpiresAt: tokenResponse.refresh_token_expires_in
          ? new Date(now + tokenResponse.refresh_token_expires_in * 1000).toISOString()
          : undefined,
      }),
      providerMeta: createProviderMeta('zendesk', { subdomain }),
    });

    // 8. Warm cache
    await this.deps.cacheService.setIntegrationByProviderWorkspace('zendesk', providerWorkspaceId, {
      workspaceId,
    });

    return {
      connected: true,
      providerWorkspaceId,
    };
  }

  /**
   * Handle OAuth callback for onboarding flow
   * Creates a new workspace and connects Zendesk integration
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

    // 1. Validate state token (no workspaceId for onboarding)
    const statePayload = this.deps.tokenService.verifyZendeskOAuthState(state, userId);
    if (!statePayload) {
      throw provisionerError.ZENDESK_OAUTH_STATE_INVALID();
    }

    const { subdomain, codeVerifier } = statePayload;

    // 2. Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(subdomain, code, codeVerifier);
    if (!tokenResponse) {
      throw provisionerError.ZENDESK_TOKEN_EXCHANGE_FAILED();
    }

    // 3. Get user info from Zendesk
    const meResult = await getMe(subdomain, tokenResponse.access_token);
    if (!meResult) {
      throw provisionerError.ZENDESK_USER_INFO_FAILED();
    }

    if (!meResult.user.email) {
      throw provisionerError.ZENDESK_USER_INFO_FAILED();
    }

    // Use Zendesk account subdomain as the provider workspace ID
    const providerWorkspaceId = subdomain;

    // 4. Check if this Zendesk account is already connected to another workspace
    const existingProviderIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'zendesk',
      providerWorkspaceId
    );
    if (existingProviderIntegration) {
      throw provisionerError.ZENDESK_WORKSPACE_ALREADY_CONNECTED();
    }

    // 5. Derive workspace URL from Zendesk user's email
    const workspaceUrl = deriveWorkspaceUrl(meResult.user.email);

    // 6. Create workspace using ProvisionerService
    const result = await this.deps.provisionerService.createWorkspaceByURLAndName({
      url: workspaceUrl,
      workspaceName: meResult.user.name,
      userId,
      userName,
      userEmail,
      userRole,
    });

    if (!result.created) {
      throw provisionerError.PROVISIONER_WORKSPACE_CREATE_FAILED();
    }

    // 7. Generate API token for iframe→API auth
    const apiToken = nanoid(48);

    // 8. Create integration record
    const now = Date.now();
    await this.deps.integrationRepo.create({
      id: generateIntegrationId(),
      workspaceId: result.workspaceId,
      provider: 'zendesk',
      providerWorkspaceId,
      providerToken: createProviderToken('zendesk', {
        accessToken: tokenResponse.access_token,
        apiToken,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiresAt: tokenResponse.expires_in
          ? new Date(now + tokenResponse.expires_in * 1000).toISOString()
          : undefined,
        refreshTokenExpiresAt: tokenResponse.refresh_token_expires_in
          ? new Date(now + tokenResponse.refresh_token_expires_in * 1000).toISOString()
          : undefined,
      }),
      providerMeta: createProviderMeta('zendesk', { subdomain }),
    });

    // 9. Warm cache
    await this.deps.cacheService.setIntegrationByProviderWorkspace('zendesk', providerWorkspaceId, {
      workspaceId: result.workspaceId,
    });

    return {
      created: true,
      workspaceId: result.workspaceId,
      workspaceName: result.workspaceName,
    };
  }

  /**
   * Get integration status for a workspace
   */
  async getIntegrationStatus(workspaceId: string): Promise<ZendeskIntegrationStatus> {
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'zendesk'
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
   * Disconnect Zendesk integration from a workspace
   */
  async disconnectIntegration(workspaceId: string): Promise<boolean> {
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'zendesk'
    );

    if (!integration) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    const deleted = await this.deps.integrationRepo.delete(workspaceId, 'zendesk');

    if (!deleted) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    // Invalidate caches
    await this.deps.cacheService.invalidateIntegration('zendesk', integration.providerWorkspaceId);

    return true;
  }
}
