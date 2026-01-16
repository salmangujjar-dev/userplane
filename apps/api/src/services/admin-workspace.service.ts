/**
 * AdminWorkspaceService - Business logic for admin workspace operations
 * Handles workspace management, deactivation, and token reset
 */

import { adminError } from '@workspace/contract';
import type {
  AdminWorkspaceRepository,
  SearchWorkspacesParams,
  SearchWorkspaceProjectsParams,
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
   */
  async deactivateWorkspace(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    if (workspace.isDeleted) {
      throw adminError.WORKSPACE_ALREADY_DEACTIVATED();
    }

    const updated = await this.deps.adminWorkspaceRepo.deactivateWorkspace(workspaceId);
    if (!updated) {
      throw adminError.WORKSPACE_NOT_FOUND();
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
