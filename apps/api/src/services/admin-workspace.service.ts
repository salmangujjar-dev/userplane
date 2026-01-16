/**
 * AdminWorkspaceService - Business logic for admin workspace operations
 * Handles workspace management, deactivation, and token reset
 */

import { ORPCError } from '@orpc/server';
import type {
  AdminWorkspaceRepository,
  SearchWorkspacesParams,
} from '@/api/repositories/admin-workspace.repository';
import { generateInviteToken } from '@/api/lib/id';

export interface AdminWorkspaceServiceDeps {
  adminWorkspaceRepo: AdminWorkspaceRepository;
}

export class AdminWorkspaceService {
  constructor(private deps: AdminWorkspaceServiceDeps) {}

  /**
   * Search workspaces with entity counts
   */
  async searchWorkspaces(params: SearchWorkspacesParams) {
    return this.deps.adminWorkspaceRepo.searchWorkspaces(params);
  }

  /**
   * Get workspace detail
   * Note: Members are fetched separately via listWorkspaceMembers
   */
  async getWorkspaceDetail(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    const counts = await this.deps.adminWorkspaceRepo.getWorkspaceCounts(workspaceId);

    return {
      ...workspace,
      ...counts,
    };
  }

  /**
   * List workspace members with pagination
   */
  async listWorkspaceMembers(workspaceId: string, options: { limit: number; offset: number }) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    return this.deps.adminWorkspaceRepo.getWorkspaceMembers(workspaceId, options);
  }

  /**
   * Deactivate (soft delete) a workspace
   */
  async deactivateWorkspace(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    if (workspace.isDeleted) {
      throw new ORPCError('WORKSPACE_ALREADY_DEACTIVATED', {
        status: 400,
        message: 'Workspace is already deactivated',
      });
    }

    const updated = await this.deps.adminWorkspaceRepo.deactivateWorkspace(workspaceId);
    if (!updated) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    // Return full detail
    return this.getWorkspaceDetail(workspaceId);
  }

  /**
   * Reset workspace invite token
   */
  async resetInviteToken(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    const newToken = generateInviteToken();
    const updated = await this.deps.adminWorkspaceRepo.resetInviteToken(workspaceId, newToken);
    if (!updated) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    // Return full detail
    return this.getWorkspaceDetail(workspaceId);
  }
}
