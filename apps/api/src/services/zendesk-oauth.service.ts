/**
 * ZendeskService - Handles Zendesk OAuth flow and integration management
 * Only supports workspace integration flow (connecting to an existing workspace)
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
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { TokenService } from '@/api/services/token.service';

export interface ZendeskServiceDeps {
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
}

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
   */
  generateAuthorizationUrl(
    userId: string,
    workspaceId: string,
    subdomain: string
  ): { authorizationUrl: string; state: string } {
    const state = this.deps.tokenService.signZendeskOAuthState(userId, workspaceId, subdomain);
    const authorizationUrl = getAuthorizationUrl(subdomain, state);

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

    const { subdomain } = statePayload;

    // 2. Check if workspace already has a Zendesk integration
    const existingWorkspaceIntegration =
      await this.deps.integrationRepo.findByWorkspaceIdAndProvider(workspaceId, 'zendesk');
    if (existingWorkspaceIntegration) {
      throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
    }

    // 3. Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(subdomain, code);
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
    await this.deps.integrationRepo.create({
      id: generateIntegrationId(),
      workspaceId,
      provider: 'zendesk',
      providerWorkspaceId,
      providerToken: createProviderToken('zendesk', {
        accessToken: tokenResponse.access_token,
        apiToken,
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
