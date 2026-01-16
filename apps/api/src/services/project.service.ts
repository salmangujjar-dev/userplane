/**
 * ProjectService - Domain service for project operations
 * Contains business logic for project management
 */

import { generateProjectId } from '@/api/lib/id';
import {
  ProjectRepository,
  type ProjectSortField,
  type SortDirection,
} from '@/api/repositories/projects.repository';
import type { Transaction } from '@/api/types';
import type { RecordingService } from '@/api/services/recording.service';
import type { LinkRepository } from '@/api/repositories/links.repository';
import type { DbClient } from '@workspace/db';
import { projectError, workspaceError } from '@workspace/contract';
import { env } from '@/api/env';

export interface ProjectServiceDeps {
  projectRepo: ProjectRepository;
  db: DbClient;
  recordingService?: RecordingService;
  linkRepo?: LinkRepository;
}

export class ProjectService {
  constructor(private deps: ProjectServiceDeps) {}

  /**
   * Create project
   * If isDefault not specified, auto-determines based on whether workspace has existing projects
   * If isDefault is true, unsets any current default project
   * Throws PROJECT_WORKSPACE_ID_REQUIRED if workspace ID is missing
   */
  async createProject(
    params: { workspaceId: string; projectTitle: string | null; isDefault?: boolean },
    options?: { tx?: Transaction }
  ) {
    if (!params.workspaceId) {
      throw projectError.PROJECT_WORKSPACE_ID_REQUIRED();
    }

    let isDefault: boolean;

    if (params.isDefault !== undefined) {
      isDefault = params.isDefault;

      // If setting as default, unset current default
      if (isDefault) {
        const currentDefault = await this.deps.projectRepo.findDefaultByWorkspace(
          params.workspaceId
        );
        if (currentDefault) {
          await this.deps.projectRepo.update(
            currentDefault.projectId,
            { isDefault: false },
            options
          );
        }
      }
    } else {
      // Auto-determine: first project becomes default
      const existingDefault = await this.deps.projectRepo.findDefaultByWorkspace(
        params.workspaceId
      );
      isDefault = !existingDefault;
    }

    return this.deps.projectRepo.create(
      {
        projectId: generateProjectId(),
        workspaceId: params.workspaceId,
        projectTitle: params.projectTitle,
        isDefault,
      },
      options
    );
  }

  /**
   * Get project by ID
   * Throws PROJECT_GONE if soft-deleted, PROJECT_NOT_FOUND if not found
   */
  async getById(projectId: string) {
    const project = await this.deps.projectRepo.findById(projectId);
    if (!project) {
      const isSoftDeleted = await this.deps.projectRepo.isSoftDeleted(projectId);
      if (isSoftDeleted === true) {
        throw projectError.PROJECT_GONE();
      }
      throw projectError.PROJECT_NOT_FOUND();
    }
    return project;
  }

  /**
   * Get default project for workspace
   * Should never fail as workspace always has at least 1 project
   * Throws PROJECT_DEFAULT_NOT_FOUND if no default project exists
   */
  async getDefaultProject(workspaceId: string) {
    const project = await this.deps.projectRepo.findDefaultByWorkspace(workspaceId);
    if (!project) {
      throw projectError.PROJECT_DEFAULT_NOT_FOUND();
    }
    return project;
  }

  /**
   * Get all projects in workspace
   */
  async getProjectsByWorkspace(workspaceId: string) {
    return this.deps.projectRepo.findByWorkspace(workspaceId);
  }

  /**
   * Get projects in workspace with pagination and sorting
   * If no projects found, validates workspace existence (since workspace always has at least 1 project)
   * Pagination params are validated by the contract schema
   * Throws WORKSPACE_NOT_FOUND if workspace doesn't exist when no projects found
   */
  async getProjectsByWorkspacePaginated(
    workspaceId: string,
    page: number = 1,
    perPage: number = 5,
    sortBy: ProjectSortField = 'created_at',
    sortDirection: SortDirection = 'desc'
  ) {
    const total = await this.deps.projectRepo.countByWorkspace(workspaceId);

    // If no projects exist, workspace doesn't exist (workspace always has at least 1 project)
    if (total === 0) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    const offset = (page - 1) * perPage;
    const projects = await this.deps.projectRepo.findByWorkspacePaginated(
      workspaceId,
      perPage,
      offset,
      sortBy,
      sortDirection
    );

    return {
      projects,
      total,
    };
  }

  /**
   * Set project as default
   * Unsets current default and sets new one
   */
  async setDefaultProject(projectId: string, options?: { tx?: Transaction }) {
    const project = await this.getById(projectId);

    // Unset current default
    const currentDefault = await this.deps.projectRepo.findDefaultByWorkspace(project.workspaceId);
    if (currentDefault && currentDefault.projectId !== projectId) {
      await this.deps.projectRepo.update(currentDefault.projectId, { isDefault: false }, options);
    }

    // Set new default
    await this.deps.projectRepo.update(projectId, { isDefault: true }, options);
  }

  /**
   * Update project fields
   * Updates project title or other attributes
   */
  async updateProject(
    projectId: string,
    updates: Partial<{ projectTitle: string | null }>,
    options?: { tx?: Transaction }
  ) {
    const project = await this.getById(projectId);
    return this.deps.projectRepo.update(projectId, updates, options);
  }

  /**
   * Soft delete a project with cascade deletion
   *
   * Transaction flow:
   * 1. Validate project belongs to workspace
   * 2. Prevent deletion of last project
   * 3. Set another project as default if needed
   * 4. Mark project as deleted
   * 5. Mark all links in project as deleted
   *
   * After commit (handled by caller):
   * - Trigger deleteProjectResources task
   * Throws PROJECT_WORKSPACE_MISMATCH, PROJECT_LAST_PROJECT_DELETE_FORBIDDEN, or PROJECT_DELETE_FAILED if validation fails
   */
  async deleteProject(projectId: string, workspaceId: string, options?: { tx?: Transaction }) {
    const project = await this.getById(projectId);

    if (project.workspaceId !== workspaceId) {
      throw projectError.PROJECT_WORKSPACE_MISMATCH();
    }

    // Check if this is the last project in the workspace
    const projectCount = await this.deps.projectRepo.countByWorkspace(workspaceId);

    if (projectCount === 1) {
      throw projectError.PROJECT_LAST_PROJECT_DELETE_FORBIDDEN();
    }

    // Use transaction for atomic deletion
    const performDeletion = async (tx: Transaction) => {
      // If deleting a default project, set another one as default before deletion
      if (project.isDefault) {
        const otherProject = await this.deps.projectRepo.findOtherProject(workspaceId, projectId);
        if (otherProject) {
          await this.deps.projectRepo.update(otherProject.projectId, { isDefault: true }, { tx });
        }
      }

      // Soft delete the project
      const deleted = await this.deps.projectRepo.softDelete(projectId, { tx });

      if (!deleted) {
        throw projectError.PROJECT_DELETE_FAILED();
      }

      // Soft delete all links in project (if linkRepo available)
      if (this.deps.linkRepo) {
        await this.deps.linkRepo.softDeleteByProjectId(projectId, { tx });
      }

      return deleted;
    };

    // Execute in provided transaction or create new one
    if (options?.tx) {
      return performDeletion(options.tx);
    }

    return this.deps.db.transaction(performDeletion);
  }

  /**
   * Restore a soft-deleted project
   *
   * Why we can restore: When projects are deleted, recordings are NOT immediately deleted.
   * This allows restoration within grace period by simply toggling the project flag back.
   * No data loss occurs during restoration as recordings remain intact in database and storage.
   *
   * Flow:
   * 1. Get the project with deletion info
   * 2. If project is not deleted, return it (idempotent - already in desired state)
   * 3. Validate restoration is within configured window (PROJECT_RESTORATION_WINDOW_DAYS env var, default: 2 days)
   * 4. If beyond window, throw PROJECT_RESTORE_TIME_EXPIRED (410)
   * 5. Restore project (isDeleted = false, deletedAt = null)
   * 6. Does NOT restore associated links - only the project itself
   *
   * Grace period: Configurable via PROJECT_RESTORATION_WINDOW_DAYS (default: 2 days)
   *
   * Idempotent: If project is already active, returns 200 with project data
   *
   * Throws PROJECT_NOT_FOUND (404) if project not found
   * Throws PROJECT_RESTORE_TIME_EXPIRED (410) if restoration window has expired
   * Throws PROJECT_RESTORE_FAILED (500) if restoration operation fails
   */
  async restoreProject(projectId: string, options?: { tx?: Transaction }) {
    // 1. Get the project with deletion info
    const project = await this.deps.projectRepo.findByIdWithDeletionInfo(projectId);

    if (!project) {
      throw projectError.PROJECT_NOT_FOUND();
    }

    // 2. Idempotent: If project is not deleted, it's already in the desired state
    // Return it successfully instead of throwing an error
    if (!project.isDeleted) {
      return project;
    }

    // 3. Validate restoration time (configurable grace period in days)
    if (!project.deletedAt) {
      throw projectError.PROJECT_RESTORE_FAILED();
    }

    const restorationWindowDays = env.trigger.projectRestorationWindowDays;
    const now = new Date();
    const deletedAt = new Date(project.deletedAt);
    const daysSinceDeletion = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceDeletion > restorationWindowDays) {
      throw projectError.PROJECT_RESTORE_TIME_EXPIRED({
        deletedAt: deletedAt.toISOString(),
        daysSinceDeletion: Math.round(daysSinceDeletion * 10) / 10, // Round to 1 decimal
        restorationWindowDays,
      });
    }

    // 4. Restore the project (no transaction needed for single operation)
    const restored = await this.deps.projectRepo.restore(projectId, options);

    if (!restored) {
      throw projectError.PROJECT_RESTORE_FAILED();
    }

    return restored;
  }
}
