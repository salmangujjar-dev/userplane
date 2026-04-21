import type { CacheService } from '@userplane/cache';
import type { ZendeskToken } from '@userplane/contract';
import { createProviderToken } from '@userplane/contract';

import { refreshAccessToken } from '@/api/clients/zendesk';
import { createLogger } from '@/api/lib/logger';
import type {
  IntegrationRepository,
  TypedIntegration,
} from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-token');

/** Buffer before expiry to trigger a refresh (5 minutes in ms) */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

interface ZendeskTokenDeps {
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
}

/**
 * Return a usable Zendesk access token, refreshing and persisting it when needed.
 * Permanent refresh failures disconnect the integration so users can reconnect cleanly.
 */
export async function getValidZendeskAccessToken(
  integration: TypedIntegration<'zendesk'>,
  deps: ZendeskTokenDeps
): Promise<string | null> {
  const token = integration.providerToken as ZendeskToken;
  const { accessToken, refreshToken, tokenExpiresAt } = token;

  if (!tokenExpiresAt || new Date(tokenExpiresAt).getTime() - Date.now() > TOKEN_EXPIRY_BUFFER_MS) {
    return accessToken;
  }

  if (!refreshToken) {
    logger.warn({ integrationId: integration.id }, 'Zendesk token expired without refresh token');
    await disconnectIntegration(integration, deps);
    return null;
  }

  if (token.refreshTokenExpiresAt) {
    const refreshExpiry = new Date(token.refreshTokenExpiresAt).getTime();
    if (refreshExpiry <= Date.now()) {
      logger.warn({ integrationId: integration.id }, 'Zendesk refresh token expired');
      await disconnectIntegration(integration, deps);
      return null;
    }
  }

  const result = await refreshAccessToken(integration.providerMeta.subdomain, refreshToken);

  if (!result.ok) {
    if (result.permanent) {
      logger.warn({ integrationId: integration.id }, 'Zendesk refresh token invalid');
      await disconnectIntegration(integration, deps);
      return null;
    }

    logger.warn(
      { integrationId: integration.id },
      'Zendesk token refresh failed transiently; using existing token'
    );
    return accessToken;
  }

  if (!result.data.refresh_token) {
    logger.warn(
      { integrationId: integration.id },
      'Zendesk token refresh succeeded without a replacement refresh token'
    );
    await disconnectIntegration(integration, deps);
    return null;
  }

  const updatedToken = createProviderToken('zendesk', {
    accessToken: result.data.access_token,
    apiToken: token.apiToken,
    refreshToken: result.data.refresh_token,
    tokenExpiresAt: result.data.expires_in
      ? new Date(Date.now() + result.data.expires_in * 1000).toISOString()
      : undefined,
    refreshTokenExpiresAt: result.data.refresh_token_expires_in
      ? new Date(Date.now() + result.data.refresh_token_expires_in * 1000).toISOString()
      : token.refreshTokenExpiresAt,
  });

  await deps.integrationRepo.updateProviderToken(integration.id, updatedToken);
  await deps.cacheService.invalidateIntegration('zendesk', integration.providerWorkspaceId);

  logger.debug({ integrationId: integration.id }, 'Zendesk token refreshed and persisted');
  return result.data.access_token;
}

async function disconnectIntegration(
  integration: TypedIntegration<'zendesk'>,
  deps: ZendeskTokenDeps
): Promise<void> {
  try {
    await deps.integrationRepo.delete(integration.workspaceId, 'zendesk');
    await deps.cacheService.invalidateIntegration('zendesk', integration.providerWorkspaceId);
  } catch (error) {
    logger.error({ err: error, integrationId: integration.id }, 'Failed to disconnect integration');
  }
}
