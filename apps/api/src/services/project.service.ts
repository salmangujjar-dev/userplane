/**
 * ProjectService - Domain service for project operations
 * Contains business logic for project management
 */

import type { CacheService } from '@workspace/cache';
import { projectError, workspaceError } from '@workspace/contract';
import type { DbClient } from '@workspace/db';

import { generateProjectId } from '@/api/lib/id';
import type { LinkRepository } from '@/api/repositories/links.repository';
import {
  ProjectRepository,
  type ProjectSortField,
  type SortDirection,
} from '@/api/repositories/projects.repository';
import type { RecordingRepository } from '@/api/repositories/recordings.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { RecordingService } from '@/api/services/recording.service';
import type { Transaction } from '@/api/types';
import {
  calculateDaysSince,
  getRestorationMaxWindowDays,
  getRestorationReason,
  getRestorationStatus,
} from '@/api/utils/date';

export interface ProjectServiceDeps {
  projectRepo: ProjectRepository;
  db: DbClient;
  recordingService: RecordingService;
  linkRepo: LinkRepository;
  recordingRepo: RecordingRepository;
  workspaceRepo: WorkspaceRepository;
  cacheService: CacheService;
}

export class ProjectService {
  constructor(private deps: ProjectServiceDeps) {}

  /**
   * Create project
   * If isDefault not specified, auto-determines based on whether workspace has existing projects
   * If isDefault is true, unsets any current default project
   * Throws PROJECT_WORKSPACE_ID_REQUIRED if workspace ID is missing
   * Project title defaults to "Untitled Project" if not provided or empty
   */
  async createProject(
    params: { workspaceId: string; projectTitle: string | null; isDefault?: boolean },
    options?: { tx?: Transaction }
  ) {
    if (!params.workspaceId) {
      throw projectError.PROJECT_WORKSPACE_ID_REQUIRED();
    }

    // Ensure projectTitle defaults to "Untitled Project" if null or empty
    const projectTitle = params.projectTitle?.trim() || 'Untitled Project';

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
        projectTitle,
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
   * Updates project title or default status
   * When setting a project as default, unsets all other defaults in the workspace
   */
  async updateProject(
    projectId: string,
    updates: Partial<{ projectTitle: string; isDefault: boolean }>,
    options?: { tx?: Transaction }
  ) {
    const project = await this.getById(projectId);

    const performUpdate = async (tx: Transaction) => {
      // Ensure projectTitle defaults to "Untitled Project" if empty
      const sanitizedUpdates = { ...updates };
      if ('projectTitle' in sanitizedUpdates && !sanitizedUpdates.projectTitle?.trim()) {
        sanitizedUpdates.projectTitle = 'Untitled Project';
      }

      if (sanitizedUpdates.isDefault === true) {
        await this.deps.projectRepo.unsetAllDefaultProjects(project.workspaceId, { tx });
      }
      return this.deps.projectRepo.update(projectId, sanitizedUpdates, { tx });
    };

    if (options?.tx) {
      return performUpdate(options.tx);
    }

    return this.deps.db.transaction(performUpdate);
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

    // Get link IDs before deletion for cache invalidation
    const linkIds = await this.deps.linkRepo.getLinkIdsByProjectId(projectId);

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

      // Soft delete all links in project
      await this.deps.linkRepo.softDeleteByProjectId(projectId, { tx });

      return deleted;
    };

    // Execute in provided transaction or create new one
    let result;
    if (options?.tx) {
      result = await performDeletion(options.tx);
    } else {
      result = await this.deps.db.transaction(performDeletion);
    }

    // Invalidate link caches after transaction commits
    if (linkIds.length > 0) {
      await this.deps.cacheService.invalidateLinksBatch(workspaceId, linkIds);
    }

    return result;
  }

  /**
   * Get restore info for a soft-deleted project
   * Used to display restoration confirmation UI
   * Returns restoration status based on configured grace period and max window:
   * - "possible": within grace period (full restoration, default 3 days)
   * - "partial": beyond grace period but within max window (partial restoration, default 30 days)
   * - "impossible": beyond max window, workspace deleted, or not deleted
   *
   * Does NOT throw errors for validation issues - returns descriptive status and reason
   * Only throws PROJECT_NOT_FOUND if project doesn't exist
   */
  async getProjectRestoreInfo(projectId: string) {
    // 1. Get the project with deletion info
    const project = await this.deps.projectRepo.findByIdWithDeletionInfo(projectId);

    if (!project) {
      throw projectError.PROJECT_NOT_FOUND();
    }

    // 2. Check if workspace is deleted - cannot restore project if workspace is deleted
    const workspaceDeleted = await this.deps.workspaceRepo.isSoftDeleted(project.workspaceId);
    if (workspaceDeleted) {
      return {
        restoration: 'impossible' as const,
        reason: 'Cannot restore project because its workspace is deleted',
        project: {
          projectId: project.projectId,
          projectTitle: project.projectTitle,
          workspaceId: project.workspaceId,
          isDeleted: project.isDeleted,
          deletedAt: project.deletedAt ? project.deletedAt.toISOString() : null,
          deletedSince: project.deletedAt ? calculateDaysSince(new Date(project.deletedAt)) : null,
        },
        linksToRestore: 0,
        recordingsToRestore: 0,
      };
    }

    // 3. Check if project is deleted
    if (!project.isDeleted) {
      return {
        restoration: 'impossible' as const,
        reason: 'Project is not deleted',
        project: {
          projectId: project.projectId,
          projectTitle: project.projectTitle,
          workspaceId: project.workspaceId,
          isDeleted: project.isDeleted,
          deletedAt: null,
          deletedSince: null,
        },
        linksToRestore: 0,
        recordingsToRestore: 0,
      };
    }

    // 4. Validate restoration time and determine restoration status
    if (!project.deletedAt) {
      return {
        restoration: 'impossible' as const,
        reason: 'Project deletion date not found',
        project: {
          projectId: project.projectId,
          projectTitle: project.projectTitle,
          workspaceId: project.workspaceId,
          isDeleted: project.isDeleted,
          deletedAt: null,
          deletedSince: null,
        },
        linksToRestore: 0,
        recordingsToRestore: 0,
      };
    }

    const deletedAt = new Date(project.deletedAt);
    const daysSinceDeletion = calculateDaysSince(deletedAt);
    const restoration = getRestorationStatus(daysSinceDeletion);
    const reason = getRestorationReason(restoration);

    // 5. Count links and recordings that will be restored
    // Only count if restoration is not impossible
    let linksToRestore = 0;
    let recordingsToRestore = 0;

    if (restoration !== 'impossible') {
      // Count active (non-deleted) links for this project
      linksToRestore = await this.deps.linkRepo.countByProject(projectId);

      // Count active (non-deleted) recordings for this project
      recordingsToRestore = await this.deps.recordingRepo.countByProject(projectId);
    }

    return {
      restoration,
      reason,
      project: {
        projectId: project.projectId,
        projectTitle: project.projectTitle,
        workspaceId: project.workspaceId,
        isDeleted: project.isDeleted,
        deletedAt: project.deletedAt ? project.deletedAt.toISOString() : null,
        deletedSince: Math.round(daysSinceDeletion * 10) / 10,
      },
      linksToRestore,
      recordingsToRestore,
    };
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
   * 2. Check if workspace is deleted - cannot restore project if workspace is deleted
   * 3. If project is not deleted, return it (idempotent - already in desired state)
   * 4. Validate restoration is within configured max window
   * 5. If beyond max window, throw PROJECT_RESTORE_TIME_EXPIRED (410)
   * 6. Restore project (isDeleted = false, deletedAt = null)
   * 7. Does NOT restore associated links - only the project itself
   *
   * Restoration status is determined by grace period (full) vs beyond grace (partial)
   * Window configured via RESTORATION_GRACE_PERIOD_DAYS and RESTORATION_MAX_WINDOW_DAYS env vars
   *
   * Idempotent: If project is already active, returns 200 with project data
   *
   * Throws PROJECT_NOT_FOUND (404) if project not found
   * Throws PROJECT_RESTORE_WORKSPACE_DELETED (410) if workspace is deleted
   * Throws PROJECT_RESTORE_TIME_EXPIRED (410) if restoration window has expired
   * Throws PROJECT_RESTORE_FAILED (500) if restoration operation fails
   */
  async restoreProject(projectId: string, options?: { tx?: Transaction }) {
    // 1. Get the project with deletion info
    const project = await this.deps.projectRepo.findByIdWithDeletionInfo(projectId);

    if (!project) {
      throw projectError.PROJECT_NOT_FOUND();
    }

    // 2. Check if workspace is deleted - cannot restore project if workspace is deleted
    const workspaceDeleted = await this.deps.workspaceRepo.isSoftDeleted(project.workspaceId);
    if (workspaceDeleted) {
      throw projectError.PROJECT_RESTORE_WORKSPACE_DELETED();
    }

    // 3. Idempotent: If project is not deleted, it's already in the desired state
    // Return it successfully instead of throwing an error
    if (!project.isDeleted) {
      // Count active resources for already restored project
      const restoredLinks = await this.deps.linkRepo.countByProject(projectId);
      const restoredRecordings = await this.deps.recordingRepo.countByProject(projectId);

      return {
        restorationStatus: 'possible' as const,
        projectId: project.projectId,
        workspaceId: project.workspaceId,
        projectTitle: project.projectTitle,
        isDefault: project.isDefault,
        isDeleted: project.isDeleted,
        deletedAt: project.deletedAt,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        restoredLinks,
        restoredRecordings,
      };
    }

    // 4. Validate restoration time (configured maximum window)
    if (!project.deletedAt) {
      throw projectError.PROJECT_RESTORE_FAILED();
    }

    const deletedAt = new Date(project.deletedAt);
    const daysSinceDeletion = calculateDaysSince(deletedAt);
    const restorationStatus = getRestorationStatus(daysSinceDeletion);
    const maxWindowDays = getRestorationMaxWindowDays();

    if (restorationStatus === 'impossible') {
      throw projectError.PROJECT_RESTORE_TIME_EXPIRED({
        deletedAt: deletedAt.toISOString(),
        daysSinceDeletion,
        restorationWindowDays: maxWindowDays,
      });
    }

    // 5. Restore the project (no transaction needed for single operation)
    const restored = await this.deps.projectRepo.restore(projectId, options);

    if (!restored) {
      throw projectError.PROJECT_RESTORE_FAILED();
    }

    // 6. Count restored resources (active links and recordings)
    const restoredLinks = await this.deps.linkRepo.countByProject(projectId);
    const restoredRecordings = await this.deps.recordingRepo.countByProject(projectId);

    return {
      restorationStatus,
      projectId: restored.projectId,
      workspaceId: restored.workspaceId,
      projectTitle: restored.projectTitle,
      isDefault: restored.isDefault,
      isDeleted: restored.isDeleted,
      deletedAt: restored.deletedAt,
      createdAt: restored.createdAt,
      updatedAt: restored.updatedAt,
      restoredLinks,
      restoredRecordings,
    };
  }

  /**
   * Count projects in workspace
   * Returns the total number of projects (not soft-deleted) in the workspace
   */
  async countByWorkspace(workspaceId: string): Promise<number> {
    return this.deps.projectRepo.countByWorkspace(workspaceId);
  }
}
