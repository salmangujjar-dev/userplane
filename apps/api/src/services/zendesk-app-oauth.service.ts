/**
 * ZendeskAppOAuthService — handles the Zendesk app's built-in OAuth flow.
 *
 * Used when Zendesk's app framework initiates OAuth where Userplane acts
 * as the authorization server. Returns an auth code for Zendesk to exchange.
 */

import type { CacheService } from '@userplane/cache';
import { workspaceError } from '@userplane/contract';
import { nanoid } from 'nanoid';

import { getAuthorizationUrl } from '@/api/clients/zendesk';
import { createLogger } from '@/api/lib/logger';
import {
  type BasePendingAuth,
  completeZendeskOAuth,
  OAuthStateStore,
  type RedisClient,
} from '@/api/lib/zendesk-oauth-flow';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { TokenService } from '@/api/services/token.service';

const logger = createLogger('zendesk-app-oauth');

interface AppOAuthPendingAuth extends BasePendingAuth {
  userId: string;
  workspaceId: string;
  subdomain: string;
  appRedirectUri: string;
  appState: string;
  appClientId: string;
}

export interface ZendeskAppOAuthServiceDeps {
  redis: RedisClient | null;
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  memberRepo: WorkspaceMemberRepository;
  provisionerService: ProvisionerService;
  cacheService: CacheService;
  jwtSecret: string;
}

export class ZendeskAppOAuthService {
  constructor(private deps: ZendeskAppOAuthServiceDeps) {}

  private getStore(): OAuthStateStore {
    if (!this.deps.redis) {
      throw new Error('Redis is required for Zendesk app OAuth flow');
    }
    return new OAuthStateStore(this.deps.redis);
  }

  /**
   * Initiate the app OAuth flow.
   * Validates no duplicate integrations, stores pending auth in Redis,
   * and generates the Zendesk OAuth URL.
   */
  async initiate(params: {
    userId: string;
    workspaceId: string;
    subdomain: string;
    installationId?: number;
    appRedirectUri: string;
    appState: string;
    appClientId: string;
  }): Promise<{ pendingId: string; zendeskAuthUrl: string }> {
    const {
      userId,
      workspaceId,
      subdomain,
      installationId,
      appRedirectUri,
      appState,
      appClientId,
    } = params;

    const existing = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'zendesk'
    );
    if (existing) {
      throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
    }

    const existingBySubdomain = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'zendesk',
      subdomain
    );
    if (existingBySubdomain) {
      throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
    }

    const pendingId = nanoid(32);
    const store = this.getStore();
    await store.savePendingAuth<AppOAuthPendingAuth>(pendingId, {
      userId,
      workspaceId,
      subdomain,
      appRedirectUri,
      appState,
      appClientId,
    });

    const { state, codeChallenge } = this.deps.tokenService.signZendeskOAuthState(
      userId,
      subdomain,
      workspaceId,
      'marketplace',
      pendingId,
      installationId
    );

    const zendeskAuthUrl = getAuthorizationUrl(subdomain, state, codeChallenge);

    logger.info({ pendingId, subdomain, workspaceId }, 'Initiated app OAuth authorization');

    return { pendingId, zendeskAuthUrl };
  }

  /**
   * Complete the app OAuth flow.
   * Verifies state, exchanges code for token, creates integration,
   * generates an auth code, and returns it with the app redirect URI.
   */
  async complete(params: { zendeskCode: string; zendeskState: string; userId: string }): Promise<{
    appCode: string;
    appRedirectUri: string;
    appState: string;
  }> {
    const store = this.getStore();

    const result = await completeZendeskOAuth<AppOAuthPendingAuth>({
      zendeskCode: params.zendeskCode,
      zendeskState: params.zendeskState,
      userId: params.userId,
      store,
      tokenService: this.deps.tokenService,
      integrationRepo: this.deps.integrationRepo,
      memberRepo: this.deps.memberRepo,
      provisionerService: this.deps.provisionerService,
      cacheService: this.deps.cacheService,
      jwtSecret: this.deps.jwtSecret,
    });

    const appCode = nanoid(32);
    await store.saveAuthCode(appCode, {
      integrationId: result.integrationId,
      workspaceId: result.workspaceId,
    });

    return {
      appCode,
      appRedirectUri: result.pending.appRedirectUri,
      appState: result.pending.appState,
    };
  }
}
