/**
 * Diagnostics contract implementation using oRPC
 * Implements diagnostic and maintenance operations for workspaces
 */

import type { CacheService } from '@workspace/cache';
import { getCacheKeysByTypes } from '@workspace/cache';
import type { CacheType } from '@workspace/contract';

import { authorizedRateLimited } from '@/api/middleware/rate-limit.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';

/**
 * Handle clear-cache action
 * Clear workspace cache (server-side) with granular cache type selection
 */
const handleClearCache = async (
  cacheService: CacheService,
  workspaceId: string,
  payload: { types: CacheType[] }
) => {
  const { types } = payload;

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

  const keysToDelete = getCacheKeysByTypes(workspaceId, types);

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
  workspaceService: WorkspaceService
) => {
  const workspaceMiddleware = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.diagnostics.runDiagnostics
    .use(workspaceMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const { workspaceId } = input.params;
      const { action, payload } = input.body;

      switch (action) {
        case 'clear-cache':
          return handleClearCache(cacheService, workspaceId, payload as { types: CacheType[] });
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
  workspaceService: WorkspaceService
) => {
  return {
    runDiagnostics: runDiagnosticsImpl(cacheService, workspaceMemberService, workspaceService),
  };
};
