/**
 * ZendeskConnectService — handles the "connect" OAuth flow.
 *
 * Used when a user connects their Zendesk account from the Zendesk app iframe.
 * Returns a workspaceId on completion (workspace is resolved or created).
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

const logger = createLogger('zendesk-connect');

interface ConnectPendingAuth extends BasePendingAuth {
  userId: string;
  workspaceId?: string;
  workspaceUrl?: string;
  subdomain: string;
}

export interface ZendeskConnectServiceDeps {
  redis: RedisClient | null;
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  memberRepo: WorkspaceMemberRepository;
  provisionerService: ProvisionerService;
  cacheService: CacheService;
  jwtSecret: string;
}

export class ZendeskConnectService {
  constructor(private deps: ZendeskConnectServiceDeps) {}

  private getStore(): OAuthStateStore {
    if (!this.deps.redis) {
      throw new Error('Redis is required for OAuth connect flow');
    }
    return new OAuthStateStore(this.deps.redis);
  }

  /**
   * Initiate the connect flow.
   * Validates no duplicate integrations, stores pending auth in Redis,
   * and generates the Zendesk OAuth URL.
   */
  async initiate(params: {
    userId: string;
    workspaceId?: string;
    workspaceUrl?: string;
    subdomain: string;
    installationId?: number;
  }): Promise<{ pendingId: string; zendeskAuthUrl: string }> {
    const { userId, workspaceId, workspaceUrl, subdomain, installationId } = params;

    // Check if workspace already has a Zendesk integration (skip if no workspace yet)
    if (workspaceId) {
      const existing = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
        workspaceId,
        'zendesk'
      );
      if (existing) {
        throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
      }
    }

    // Check if subdomain is already connected to another workspace
    const existingProvider = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'zendesk',
      subdomain
    );
    if (existingProvider) {
      throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
    }

    // Store pending auth in Redis
    const pendingId = nanoid(32);
    const store = this.getStore();
    await store.savePendingAuth<ConnectPendingAuth>(pendingId, {
      userId,
      workspaceId,
      workspaceUrl,
      subdomain,
    });

    // Generate Zendesk OAuth URL with state JWT (contains pendingId + installationId)
    const { state, codeChallenge } = this.deps.tokenService.signZendeskOAuthState(
      userId,
      subdomain,
      workspaceId,
      'marketplace',
      pendingId,
      installationId
    );

    const zendeskAuthUrl = getAuthorizationUrl(subdomain, state, codeChallenge);

    logger.info({ pendingId, subdomain, workspaceId }, 'Initiated connect OAuth authorization');

    return { pendingId, zendeskAuthUrl };
  }

  /**
   * Complete the connect flow.
   * Verifies state, exchanges code for token, resolves/creates workspace,
   * creates integration, and returns the workspace ID.
   */
  async complete(params: {
    zendeskCode: string;
    zendeskState: string;
    userId: string;
  }): Promise<{ workspaceId: string }> {
    const store = this.getStore();

    const result = await completeZendeskOAuth<ConnectPendingAuth>({
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

    return { workspaceId: result.workspaceId };
  }
}
