/**
 * IntercomHealthCheckService - Business logic for Intercom installation health check
 *
 * Performs cache-first integration lookup to determine installation health.
 * Returns HEALTHY when integration exists, UNHEALTHY with reconnect CTA otherwise.
 *
 * @see https://developers.intercom.com/docs/build-an-integration/learn-more/installation-health-check
 */

import type { CacheService } from '@workspace/cache';

import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { IntercomHealthCheckResponse } from '@/api/types/intercom-health-check';

const logger = createLogger('intercom-health-check');

interface CachedIntegration {
  workspaceId: string;
}

interface IntercomHealthCheckServiceDeps {
  integrationRepo: IntegrationRepository;
  cacheService: CacheService;
  dashboardBaseUrl: string;
}

export class IntercomHealthCheckService {
  constructor(private readonly deps: IntercomHealthCheckServiceDeps) {}

  async checkHealth(providerWorkspaceId: string): Promise<IntercomHealthCheckResponse> {
    // Cache-first integration lookup
    let integration =
      await this.deps.cacheService.getIntegrationByProviderWorkspace<CachedIntegration>(
        'intercom',
        providerWorkspaceId
      );

    if (integration) {
      logger.debug(
        { providerWorkspaceId, workspaceId: integration.workspaceId },
        'Integration cache hit'
      );
      return { state: 'HEALTHY' };
    }

    // Cache miss - fetch from database
    const dbIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      providerWorkspaceId
    );

    if (!dbIntegration) {
      logger.info({ providerWorkspaceId }, 'Integration not found — unhealthy');
      return {
        state: 'UNHEALTHY',
        message: 'Userplane integration is not connected. Please reconnect from the dashboard.',
        cta_type: 'url',
        cta_url: `${this.deps.dashboardBaseUrl}/settings/integrations`,
        cta_label: 'Reconnect',
      };
    }

    // Cache the integration for future lookups
    integration = { workspaceId: dbIntegration.workspaceId };
    await this.deps.cacheService.setIntegrationByProviderWorkspace(
      'intercom',
      providerWorkspaceId,
      integration
    );
    logger.debug(
      { providerWorkspaceId, workspaceId: integration.workspaceId },
      'Integration cached'
    );

    return { state: 'HEALTHY' };
  }
}
