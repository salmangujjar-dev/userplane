/**
 * AdminProjectService - Business logic for admin project operations
 * Handles project deactivation and restoration for admin users
 */

import type { ProjectService } from '@/api/services/project.service';

export interface AdminProjectServiceDeps {
  projectService: ProjectService;
}

export class AdminProjectService {
  constructor(private deps: AdminProjectServiceDeps) {}

  /**
   * Deactivate (soft delete) a project
   * Delegates to ProjectService.deleteProject for consistent deletion logic
   */
  async deactivateProject(projectId: string, workspaceId: string) {
    // Use project service for deletion to ensure all related entities are properly soft-deleted
    await this.deps.projectService.deleteProject(projectId, workspaceId);
  }

  /**
   * Restore a soft-deleted project
   * Delegates to ProjectService.restoreProject for consistent restoration logic
   */
  async restoreProject(projectId: string) {
    // Use project service for restoration to ensure all related entities are properly restored
    const result = await this.deps.projectService.restoreProject(projectId);

    // Return the restoration result with full details
    return result;
  }
}
