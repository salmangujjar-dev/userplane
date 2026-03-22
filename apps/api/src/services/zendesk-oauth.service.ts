/**
 * ZendeskService - Handles Zendesk OAuth flow and integration management
 */

import type { CacheService } from '@userplane/cache';
import { createProviderMeta, createProviderToken, workspaceError } from '@userplane/contract';

import type { ZendeskTokenResponse } from '@/api/clients/zendesk';
import { setInstallationSettings } from '@/api/clients/zendesk';
import { generateIntegrationId } from '@/api/lib/id';
import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-oauth');

// =============================================================================
// Shared helpers — used by ZendeskConnectService and ZendeskAppOAuthService
// =============================================================================

interface CreateIntegrationParams {
  workspaceId: string;
  subdomain: string;
  tokenResponse: ZendeskTokenResponse;
  installationId?: number;
  jwtSecret: string;
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
}

/**
 * Create a Zendesk integration record, set jwt_secret on the installation, and warm cache.
 * Shared between workspace integration flow and popup OAuth flow.
 */
export async function createZendeskIntegration(params: CreateIntegrationParams): Promise<string> {
  const {
    workspaceId,
    subdomain,
    tokenResponse,
    installationId,
    jwtSecret,
    integrationRepo,
    cacheService,
  } = params;

  const integrationId = generateIntegrationId();
  const now = Date.now();

  await integrationRepo.create({
    id: integrationId,
    workspaceId,
    provider: 'zendesk',
    providerWorkspaceId: subdomain,
    providerToken: createProviderToken('zendesk', {
      accessToken: tokenResponse.access_token,
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

  // Set jwt_secret on Zendesk app installation for ZAF JWT auth
  if (installationId) {
    const ok = await setInstallationSettings(
      subdomain,
      tokenResponse.access_token,
      installationId,
      {
        jwt_secret: jwtSecret,
      }
    );
    if (!ok) {
      logger.error(
        { subdomain, installationId },
        'Failed to set jwt_secret on Zendesk installation — ZAF JWT auth will not work'
      );
    }
  } else {
    logger.warn(
      { subdomain },
      'No installationId provided — jwt_secret not set on Zendesk installation'
    );
  }

  // Warm cache
  await cacheService.setIntegrationByProviderWorkspace('zendesk', subdomain, { workspaceId });

  return integrationId;
}

// =============================================================================

export interface ZendeskServiceDeps {
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

export class ZendeskService {
  constructor(private deps: ZendeskServiceDeps) {}

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
