/**
 * ZendeskService - Handles Zendesk OAuth flow and integration management
 */

import type { CacheService } from '@userplane/cache';
import {
  createProviderMeta,
  createProviderToken,
  FormEmailSchema,
  workspaceError,
  type ZendeskAgentItem,
} from '@userplane/contract';

import type { ZendeskTokenResponse, ZendeskUser } from '@/api/clients/zendesk';
import { listAgents, setInstallationSettings } from '@/api/clients/zendesk';
import { generateIntegrationId } from '@/api/lib/id';
import { createLogger } from '@/api/lib/logger';
import { getValidZendeskAccessToken } from '@/api/lib/zendesk-token';
import { captureException } from '@/api/posthog';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';

const logger = createLogger('zendesk-oauth');

const MAX_AGENT_SUGGESTIONS = 10;

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
  memberRepo: WorkspaceMemberRepository;
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
    memberRepo,
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

  // Enable Zendesk channel for all workspace members
  try {
    await memberRepo.enableIncomingEventChannel(workspaceId, 'zendesk');
  } catch (error) {
    logger.error({ err: error, workspaceId }, 'Failed to enable Zendesk channel for members');
    captureException(error, undefined, {
      operation: 'enable_zendesk_channel_on_connect',
      workspace_id: workspaceId,
    });
  }

  // Warm cache
  await cacheService.setIntegrationByProviderWorkspace('zendesk', subdomain, { workspaceId });

  return integrationId;
}

// =============================================================================

export interface ZendeskServiceDeps {
  integrationRepo: IntegrationRepository;
  memberRepo: WorkspaceMemberRepository;
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

    // Clean up notification channel preferences
    try {
      await this.deps.memberRepo.clearIncomingEventChannel(workspaceId, 'zendesk');
    } catch (error) {
      // Log but don't fail - integration is already disconnected
      logger.error({ err: error, workspaceId }, 'Error cleaning up Zendesk notification channels');
      captureException(error, undefined, {
        operation: 'disconnect_zendesk_channel_cleanup',
        workspace_id: workspaceId,
      });
    }

    // Invalidate caches
    await this.deps.cacheService.invalidateIntegration('zendesk', integration.providerWorkspaceId);

    return true;
  }

  // ===========================================================================
  // Agent fetching — mirrors IntercomService.getAdmins / SlackService.getMembers
  // ===========================================================================

  /**
   * Fetch agents from Zendesk and normalize their emails.
   * @returns Map of normalized email to ZendeskUser
   */
  private async _fetchAndNormalizeAgents(workspaceId: string): Promise<Map<string, ZendeskUser>> {
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'zendesk'
    );

    if (!integration) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    const providerMeta = integration.providerMeta as { subdomain: string };

    const accessToken = await getValidZendeskAccessToken(integration, {
      integrationRepo: this.deps.integrationRepo,
      cacheService: this.deps.cacheService,
    });
    if (!accessToken) {
      return new Map();
    }

    const agents = await listAgents(providerMeta.subdomain, accessToken);

    const agentEmailMap = new Map<string, ZendeskUser>();
    for (const agent of agents) {
      if (!agent.email) continue;
      const emailResult = FormEmailSchema.safeParse(agent.email);
      if (emailResult.success) {
        agentEmailMap.set(emailResult.data, agent);
      }
    }

    return agentEmailMap;
  }

  /**
   * Build list of agent items, optionally excluding existing workspace members.
   * Shared logic for getAgents and suggestAgents.
   */
  private async _buildAgentItemList(
    workspaceId: string,
    options: { excludeMembers: boolean }
  ): Promise<ZendeskAgentItem[]> {
    const agentEmailMap = await this._fetchAndNormalizeAgents(workspaceId);

    if (agentEmailMap.size === 0) {
      return [];
    }

    let memberEmails: Set<string> = new Set();
    if (options.excludeMembers) {
      memberEmails = await this.deps.memberRepo.findMatchingMemberEmails(workspaceId, [
        ...agentEmailMap.keys(),
      ]);
    }

    const result: ZendeskAgentItem[] = [];
    for (const [normalizedEmail, agent] of agentEmailMap) {
      if (options.excludeMembers && memberEmails.has(normalizedEmail)) {
        continue;
      }

      result.push({
        id: String(agent.id),
        email: normalizedEmail,
        name: agent.name ?? null,
      });
    }

    return result;
  }

  /**
   * Get all agents from the connected Zendesk account.
   * Optionally filters out agents who are already workspace members.
   */
  async getAgents(
    workspaceId: string,
    excludeMembers: boolean = false
  ): Promise<ZendeskAgentItem[]> {
    return this._buildAgentItemList(workspaceId, { excludeMembers });
  }

  /**
   * Get suggested agents for the invite modal.
   * Always excludes existing members and returns empty on any error (graceful degradation).
   */
  async suggestAgents(
    workspaceId: string,
    options?: { limit?: number }
  ): Promise<{ suggestions: ZendeskAgentItem[]; hasMore: boolean }> {
    try {
      const limit = Math.min(options?.limit ?? 5, MAX_AGENT_SUGGESTIONS);

      const agents = await this._buildAgentItemList(workspaceId, { excludeMembers: true });

      const hasMore = agents.length > limit;
      const suggestions = hasMore ? agents.slice(0, limit) : agents;

      return { suggestions, hasMore };
    } catch {
      return { suggestions: [], hasMore: false };
    }
  }
}
