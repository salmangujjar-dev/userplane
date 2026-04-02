/**
 * Shared helpers for Zendesk OAuth flows (connect + provider).
 *
 * Contains:
 * - OAuthStateStore: Redis key management for pending auth & auth codes
 * - completeZendeskOAuth: Common completion logic shared by both services
 */

import type { CacheService } from '@userplane/cache';
import type { createRedisClient } from '@userplane/cache';
import { provisionerError, workspaceError } from '@userplane/contract';

import { exchangeCodeForToken, getMe } from '@/api/clients/zendesk';
import { createLogger } from '@/api/lib/logger';
import { deriveWorkspaceName, deriveWorkspaceUrl } from '@/api/lib/workspace';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { TokenService } from '@/api/services/token.service';
import { createZendeskIntegration } from '@/api/services/zendesk-oauth.service';

const logger = createLogger('zendesk-oauth-flow');

// =============================================================================
// OAuth State Store — centralized Redis key management for pending auth & codes
// =============================================================================

/** TTL for pending OAuth authorizations (15 minutes) */
export const PENDING_AUTH_TTL = 15 * 60;

/** TTL for OAuth auth codes (5 minutes) */
export const AUTH_CODE_TTL = 5 * 60;

export const REDIS_KEYS = {
  pending: (id: string) => `oauth:pending:${id}`,
  code: (code: string) => `oauth:code:${code}`,
} as const;

/** Base fields shared by all pending auth records */
export interface BasePendingAuth {
  userId: string;
  workspaceId?: string;
  workspaceUrl?: string;
  subdomain: string;
}

export interface AuthCodeData {
  integrationId: string;
  workspaceId: string;
}

/** Typed store for OAuth pending authorizations and auth codes */
export type RedisClient = NonNullable<ReturnType<typeof createRedisClient>>;

export class OAuthStateStore {
  constructor(private redis: RedisClient) {}

  async savePendingAuth<T extends BasePendingAuth>(id: string, data: T): Promise<void> {
    await this.redis.set(REDIS_KEYS.pending(id), JSON.stringify(data), { ex: PENDING_AUTH_TTL });
  }

  async loadPendingAuth<T extends BasePendingAuth>(id: string): Promise<T | null> {
    // Upstash auto-deserializes JSON, so this returns the parsed object directly
    const data = await this.redis.get<T>(REDIS_KEYS.pending(id));
    return data ?? null;
  }

  async deletePendingAuth(id: string): Promise<void> {
    await this.redis.del(REDIS_KEYS.pending(id));
  }

  async saveAuthCode(code: string, data: AuthCodeData): Promise<void> {
    await this.redis.set(REDIS_KEYS.code(code), JSON.stringify(data), { ex: AUTH_CODE_TTL });
  }
}

// =============================================================================
// Shared OAuth completion logic
// =============================================================================

export async function completeZendeskOAuth<T extends BasePendingAuth>(params: {
  zendeskCode: string;
  zendeskState: string;
  userId: string;
  store: OAuthStateStore;
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  memberRepo: WorkspaceMemberRepository;
  provisionerService: ProvisionerService;
  cacheService: CacheService;
  jwtSecret: string;
}): Promise<{
  workspaceId: string;
  integrationId: string;
  subdomain: string;
  installationId?: number;
  pending: T;
}> {
  const {
    zendeskCode,
    zendeskState,
    userId,
    store,
    tokenService,
    integrationRepo,
    provisionerService,
    cacheService,
    jwtSecret,
  } = params;

  // 1. Verify state JWT
  const statePayload = tokenService.verifyZendeskOAuthState(zendeskState, userId);
  if (!statePayload) {
    throw provisionerError.ZENDESK_OAUTH_STATE_INVALID();
  }

  const { subdomain, codeVerifier, pendingId, installationId } = statePayload;
  if (!pendingId) {
    throw provisionerError.ZENDESK_OAUTH_STATE_INVALID();
  }

  // 2. Load pending auth from Redis
  const pending = await store.loadPendingAuth<T>(pendingId);
  if (!pending) {
    throw provisionerError.ZENDESK_OAUTH_STATE_INVALID();
  }

  if (pending.userId !== userId) {
    throw provisionerError.ZENDESK_OAUTH_STATE_INVALID();
  }

  // 3. Exchange code for Zendesk access token
  const tokenResponse = await exchangeCodeForToken(subdomain, zendeskCode, codeVerifier);
  if (!tokenResponse) {
    throw provisionerError.ZENDESK_TOKEN_EXCHANGE_FAILED();
  }

  // 4. Get user info from Zendesk
  const meResult = await getMe(subdomain, tokenResponse.access_token);
  if (!meResult) {
    throw provisionerError.ZENDESK_USER_INFO_FAILED();
  }

  // 5. Resolve workspace — create one if the user had none when OAuth started
  let resolvedWorkspaceId = pending.workspaceId;

  if (!resolvedWorkspaceId) {
    const wsUrl =
      pending.workspaceUrl ||
      (meResult.user.email ? deriveWorkspaceUrl(meResult.user.email) : null);
    if (!wsUrl) {
      throw provisionerError.ZENDESK_USER_INFO_FAILED();
    }
    const wsResult = await provisionerService.createWorkspaceByURLAndName({
      url: wsUrl,
      workspaceName: deriveWorkspaceName(wsUrl, undefined),
      userId: pending.userId,
      userName: undefined,
      userEmail: meResult.user.email ?? '',
      userRole: undefined,
    });
    if (!wsResult.created) {
      throw provisionerError.PROVISIONER_WORKSPACE_CREATE_FAILED();
    }
    resolvedWorkspaceId = wsResult.workspaceId;
  }

  // 6. Re-check for duplicate integrations (race condition guard)
  if (pending.workspaceId) {
    const existingWorkspace = await integrationRepo.findByWorkspaceIdAndProvider(
      resolvedWorkspaceId,
      'zendesk'
    );
    if (existingWorkspace) {
      throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
    }
  }

  const existingProvider = await integrationRepo.findByProviderWorkspaceId('zendesk', subdomain);
  if (existingProvider) {
    throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
  }

  // 7. Create integration, set jwt_secret, warm cache
  const integrationId = await createZendeskIntegration({
    workspaceId: resolvedWorkspaceId,
    subdomain,
    tokenResponse,
    installationId,
    jwtSecret,
    integrationRepo,
    memberRepo: params.memberRepo,
    cacheService,
  });

  // 8. Clean up pending auth
  await store.deletePendingAuth(pendingId);

  logger.info(
    { pendingId, subdomain, workspaceId: resolvedWorkspaceId, integrationId },
    'Completed pending OAuth authorization'
  );

  return {
    workspaceId: resolvedWorkspaceId,
    integrationId,
    subdomain,
    installationId,
    pending,
  };
}
