/**
 * AdminWorkspaceService - Business logic for admin workspace operations
 * Handles workspace management, deactivation, and token reset
 */

import { adminError } from '@workspace/contract';

import { generateInviteToken } from '@/api/lib/id';
import type {
  AdminWorkspaceRepository,
  SearchWorkspaceProjectsParams,
  SearchWorkspacesParams,
} from '@/api/repositories/admin-workspace.repository';
import type { WorkspaceService } from '@/api/services/workspace.service';

export interface AdminWorkspaceServiceDeps {
  adminWorkspaceRepo: AdminWorkspaceRepository;
  workspaceService: WorkspaceService;
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
      throw adminError.WORKSPACE_NOT_FOUND();
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
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    return this.deps.adminWorkspaceRepo.getWorkspaceMembers(workspaceId, options);
  }

  /**
   * Search workspace projects with pagination, filtering, and sorting
   */
  async searchWorkspaceProjects(params: SearchWorkspaceProjectsParams) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(params.workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    return this.deps.adminWorkspaceRepo.searchWorkspaceProjects(params);
  }

  /**
   * Deactivate (soft delete) a workspace
   * Delegates to WorkspaceService.deleteWorkspace for consistent deletion logic
   */
  async deactivateWorkspace(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    if (workspace.isDeleted) {
      throw adminError.WORKSPACE_ALREADY_DEACTIVATED();
    }

    // Use workspace service for deletion to ensure all related entities are properly soft-deleted
    const deletedAt = new Date();
    await this.deps.workspaceService.deleteWorkspace(workspaceId, deletedAt);

    // Return full detail
    return this.getWorkspaceDetail(workspaceId);
  }

  /**
   * Restore a soft-deleted workspace
   * Delegates to WorkspaceService.restoreWorkspace for consistent restoration logic
   */
  async restoreWorkspace(workspaceId: string) {
    // Use workspace service for restoration to ensure all related entities are properly restored
    const result = await this.deps.workspaceService.restoreWorkspace(workspaceId);

    // Return the restoration result with full details
    return result;
  }

  /**
   * Reset workspace invite token
   */
  async resetInviteToken(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    const newToken = generateInviteToken();
    const updated = await this.deps.adminWorkspaceRepo.resetInviteToken(workspaceId, newToken);
    if (!updated) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    // Return full detail
    return this.getWorkspaceDetail(workspaceId);
  }
}
