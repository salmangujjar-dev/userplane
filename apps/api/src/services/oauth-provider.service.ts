/**
 * OAuthProviderService - Handles Zendesk built-in app OAuth flow
 * where Userplane acts as the OAuth provider.
 *
 * Implements a nested OAuth pattern:
 * 1. Outer OAuth: Zendesk app authenticates with Userplane (gets apiToken)
 * 2. Inner OAuth: Userplane authenticates with Zendesk (gets Zendesk access token)
 *
 * Both tokens are obtained in a single user-facing flow.
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
import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { TokenService } from '@/api/services/token.service';

const logger = createLogger('oauth-provider');

/** Minimal Redis interface for OAuth provider operations */
interface RedisClient {
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
  get<T = string>(key: string): Promise<T | null>;
  del(...keys: string[]): Promise<number>;
}

/** TTL for pending OAuth authorizations (15 minutes) */
const PENDING_AUTH_TTL = 15 * 60;

/** TTL for OAuth auth codes (5 minutes) */
const AUTH_CODE_TTL = 5 * 60;

interface PendingAuth {
  mode: 'popup' | 'oauth';
  outerRedirectUri?: string;
  outerState?: string;
  outerClientId?: string;
  userId: string;
  workspaceId: string;
  subdomain: string;
}

interface AuthCodeData {
  integrationId: string;
  apiToken: string;
  workspaceId: string;
}

export interface OAuthProviderServiceDeps {
  redis: RedisClient | null;
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
}

export class OAuthProviderService {
  constructor(private deps: OAuthProviderServiceDeps) {}

  private getRedis(): RedisClient {
    if (!this.deps.redis) {
      throw new Error('Redis is required for OAuth provider flow');
    }
    return this.deps.redis;
  }

  /**
   * Initiate a pending OAuth authorization.
   * Stores outer OAuth params in Redis and generates the inner Zendesk OAuth URL.
   *
   * Called from the dashboard authorize page after the user selects a workspace.
   */
  async initiatePendingAuth(params: {
    userId: string;
    workspaceId: string;
    subdomain: string;
    mode?: 'popup' | 'oauth';
    outerRedirectUri?: string;
    outerState?: string;
    outerClientId?: string;
  }): Promise<{ pendingId: string; zendeskAuthUrl: string }> {
    const {
      userId,
      workspaceId,
      subdomain,
      mode = 'oauth',
      outerRedirectUri,
      outerState,
      outerClientId,
    } = params;

    // Check if workspace already has a Zendesk integration
    const existing = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'zendesk'
    );
    if (existing) {
      throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
    }

    // Check if subdomain is already connected to another workspace
    const existingProvider = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'zendesk',
      subdomain
    );
    if (existingProvider) {
      throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
    }

    // Generate pending ID and store in Redis
    const pendingId = nanoid(32);
    const pending: PendingAuth = {
      mode,
      outerRedirectUri,
      outerState,
      outerClientId,
      userId,
      workspaceId,
      subdomain,
    };

    const redis = this.getRedis();
    await redis.set(`oauth:pending:${pendingId}`, JSON.stringify(pending), {
      ex: PENDING_AUTH_TTL,
    });

    // Generate inner Zendesk OAuth URL using existing token service + client
    const { state, codeChallenge } = this.deps.tokenService.signZendeskOAuthState(
      userId,
      subdomain,
      workspaceId,
      'app-oauth',
      pendingId
    );

    const zendeskAuthUrl = getAuthorizationUrl(subdomain, state, codeChallenge);

    logger.info({ pendingId, subdomain, workspaceId }, 'Initiated pending OAuth authorization');

    return { pendingId, zendeskAuthUrl };
  }

  /**
   * Complete a pending OAuth authorization.
   * Exchanges the inner Zendesk code for an access token, creates the integration,
   * and generates an outer auth code for Zendesk's built-in OAuth to exchange.
   *
   * Called from the nested callback page after Zendesk OAuth completes.
   */
  async completePendingAuth(params: {
    innerCode: string;
    innerState: string;
    userId: string;
  }): Promise<
    | { mode: 'popup' }
    | { mode: 'oauth'; outerCode: string; outerRedirectUri: string; outerState: string }
  > {
    const { innerCode, innerState, userId } = params;

    // 1. Verify inner state JWT
    const statePayload = this.deps.tokenService.verifyZendeskOAuthState(innerState, userId);
    if (!statePayload) {
      throw provisionerError.ZENDESK_OAUTH_STATE_INVALID();
    }

    const { subdomain, codeVerifier, pendingId } = statePayload;
    if (!pendingId) {
      throw new Error('Missing pendingId in OAuth state');
    }

    // 2. Get pending auth data from Redis
    const redis = this.getRedis();
    const pendingRaw = await redis.get<string>(`oauth:pending:${pendingId}`);
    if (!pendingRaw) {
      throw new Error('Pending OAuth authorization expired or not found');
    }

    const pending: PendingAuth =
      typeof pendingRaw === 'string' ? JSON.parse(pendingRaw) : pendingRaw;

    // Verify the user matches
    if (pending.userId !== userId) {
      throw new Error('User mismatch in pending OAuth authorization');
    }

    // 3. Exchange inner code for Zendesk access token
    const tokenResponse = await exchangeCodeForToken(subdomain, innerCode, codeVerifier);
    if (!tokenResponse) {
      throw provisionerError.ZENDESK_TOKEN_EXCHANGE_FAILED();
    }

    // 4. Get user info from Zendesk
    const meResult = await getMe(subdomain, tokenResponse.access_token);
    if (!meResult) {
      throw provisionerError.ZENDESK_USER_INFO_FAILED();
    }

    // 5. Re-check for duplicate integrations (race condition guard)
    const existingWorkspace = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      pending.workspaceId,
      'zendesk'
    );
    if (existingWorkspace) {
      throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
    }

    const existingProvider = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'zendesk',
      subdomain
    );
    if (existingProvider) {
      throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
    }

    // 6. Generate API token for iframe→API auth
    const apiToken = nanoid(48);
    const integrationId = generateIntegrationId();

    // 7. Create integration record with both tokens
    const now = Date.now();
    await this.deps.integrationRepo.create({
      id: integrationId,
      workspaceId: pending.workspaceId,
      provider: 'zendesk',
      providerWorkspaceId: subdomain,
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
    await this.deps.cacheService.setIntegrationByProviderWorkspace('zendesk', subdomain, {
      workspaceId: pending.workspaceId,
    });

    // 9. Clean up pending auth
    await redis.del(`oauth:pending:${pendingId}`);

    logger.info(
      { pendingId, subdomain, workspaceId: pending.workspaceId, integrationId, mode: pending.mode },
      'Completed pending OAuth authorization'
    );

    // 10. In popup mode, just return success. In OAuth mode, generate outer auth code.
    if (pending.mode === 'popup') {
      return { mode: 'popup' as const };
    }

    const outerCode = nanoid(32);
    const codeData: AuthCodeData = {
      integrationId,
      apiToken,
      workspaceId: pending.workspaceId,
    };
    await redis.set(`oauth:code:${outerCode}`, JSON.stringify(codeData), { ex: AUTH_CODE_TTL });

    return {
      mode: 'oauth' as const,
      outerCode,
      outerRedirectUri: pending.outerRedirectUri!,
      outerState: pending.outerState!,
    };
  }
}
