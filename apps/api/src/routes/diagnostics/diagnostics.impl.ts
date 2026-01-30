/**
 * Diagnostics contract implementation using oRPC
 * Implements diagnostic and maintenance operations for workspaces
 *
 * Normalized cache architecture:
 * - billing: Subscription access and status
 * - safety_latches: Dispute and refund flags
 * - entitlement: Usage summary
 * - workspace_recording: Workspace recording preferences (branding, limits)
 * - domain_recording: Domain recording preferences (capture settings)
 * - link: Link core data + workspace mapping
 * - integration: Integration lookups
 * - all: All of the above
 */

import type { CacheService } from '@workspace/cache';
import {
  domainRecordingKeys,
  getCacheKeysByTypes,
  integrationKeys,
  linkKeys,
} from '@workspace/cache';
import type { CacheType } from '@workspace/contract';

import { authorizedRateLimited } from '@/api/middleware/rate-limit.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { DomainRepository } from '@/api/repositories/domains.repository';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { LinkRepository } from '@/api/repositories/links.repository';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';

/** All cache types except 'all' itself */
const ALL_CACHE_TYPES: CacheType[] = [
  'billing',
  'safety_latches',
  'entitlement',
  'workspace_recording',
  'domain_recording',
  'link',
  'integration',
];

/**
 * Handle clear-cache action
 * Clear workspace cache (server-side) with granular cache type selection
 */
const handleClearCache = async (
  cacheService: CacheService,
  workspaceId: string,
  payload: { types: CacheType[] },
  linkRepo: LinkRepository,
  domainRepo: DomainRepository,
  integrationRepo: IntegrationRepository
) => {
  let { types } = payload;

  // Expand 'all' to all cache types
  if (types.includes('all')) {
    types = ALL_CACHE_TYPES;
  }

  if (!cacheService.isAvailable()) {
    return {
      message: 'Cache cleared successfully',
      data: {
        success: true,
        types,
        message: 'Cache service is not enabled, nothing to clear',
      },
    };
  }

  // Get standard cache keys (billing, safety_latches, entitlement, workspace_recording)
  let keysToDelete = getCacheKeysByTypes(workspaceId, types);

  // Handle 'domain_recording' type - requires fetching domain IDs from database
  if (types.includes('domain_recording')) {
    try {
      const domainIds = await domainRepo.getDomainIdsByWorkspaceId(workspaceId);
      const domainCacheKeys = domainIds.map((id) => domainRecordingKeys.preferences(id));
      keysToDelete = [...keysToDelete, ...domainCacheKeys];
    } catch (error) {
      console.warn(`[Diagnostics] Failed to fetch domain IDs for cache clearing:`, error);
    }
  }

  // Handle 'link' type - requires fetching link IDs from database
  // Clears both link:core and link:ws (workspace mapping) caches
  if (types.includes('link')) {
    try {
      const linkIds = await linkRepo.getLinkIdsByWorkspaceId(workspaceId);
      const linkCacheKeys = linkIds.flatMap((id) => [
        linkKeys.core(workspaceId, id),
        linkKeys.workspaceMapping(id),
      ]);
      keysToDelete = [...keysToDelete, ...linkCacheKeys];
    } catch (error) {
      console.warn(`[Diagnostics] Failed to fetch link IDs for cache clearing:`, error);
    }
  }

  // Handle 'integration' type - requires fetching integration IDs from database
  if (types.includes('integration')) {
    try {
      const integrations = await integrationRepo.findByWorkspaceId(workspaceId);
      const integrationCacheKeys = integrations
        .filter((i) => i.providerWorkspaceId)
        .map((i) => integrationKeys.byProviderWorkspace(i.provider, i.providerWorkspaceId));
      keysToDelete = [...keysToDelete, ...integrationCacheKeys];
    } catch (error) {
      console.warn(`[Diagnostics] Failed to clear integration caches:`, error);
    }
  }

  if (keysToDelete.length === 0) {
    return {
      message: 'No cache keys to clear',
      data: {
        success: true,
        types,
        message: 'Selected cache types have no keys to clear',
        clearedKeys: [],
      },
    };
  }

  await cacheService.delete(...keysToDelete);

  return {
    message: 'Server cache cleared successfully',
    data: {
      success: true,
      types,
      message: `Cleared ${keysToDelete.length} cache entries for workspace`,
      clearedKeys: keysToDelete,
    },
  };
};

/**
 * POST /workspace/:workspaceId/diagnostics
 * Execute diagnostic actions on a workspace
 * Requires workspace membership
 */
export const runDiagnosticsImpl = (
  cacheService: CacheService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  linkRepo: LinkRepository,
  domainRepo: DomainRepository,
  integrationRepo: IntegrationRepository
) => {
  const workspaceMiddleware = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.diagnostics.runDiagnostics
    .use(workspaceMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const { workspaceId } = input.params;
      const { action, payload } = input.body;

      switch (action) {
        case 'clear-cache':
          return handleClearCache(
            cacheService,
            workspaceId,
            payload as { types: CacheType[] },
            linkRepo,
            domainRepo,
            integrationRepo
          );
        default:
          throw new Error(`Unknown diagnostic action: ${action}`);
      }
    });
};

/**
 * Create diagnostics procedures
 * Exports all diagnostics-related procedures with dependency injection
 */
export const createDiagnosticsProcedures = (
  cacheService: CacheService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  linkRepo: LinkRepository,
  domainRepo: DomainRepository,
  integrationRepo: IntegrationRepository
) => {
  return {
    runDiagnostics: runDiagnosticsImpl(
      cacheService,
      workspaceMemberService,
      workspaceService,
      linkRepo,
      domainRepo,
      integrationRepo
    ),
  };
};
