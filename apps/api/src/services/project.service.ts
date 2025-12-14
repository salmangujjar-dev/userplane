/**
 * ProjectService - Domain service for project operations
 * Contains business logic for project management
 */

import { generateProjectId } from '@/api/lib/id-generator';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import type { Transaction, CreateProjectParams } from '@/api/types';
import type { RecordingService } from '@/api/services/recording.service';

export interface ProjectServiceDeps {
  projectRepo: ProjectRepository;
  recordingService?: RecordingService;
}

export class ProjectService {
  constructor(private deps: ProjectServiceDeps) {}

  /**
   * Create project
   * If isDefault not specified, auto-determines based on whether workspace has existing projects
   * If isDefault is true, unsets any current default project
   */
  async createProject(params: CreateProjectParams, options?: { tx?: Transaction }) {
    if (!params.workspaceId) {
      throw new ValidationError('Workspace ID is required');
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
          await this.deps.projectRepo.update(currentDefault.id, { isDefault: false }, options);
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
        id: generateProjectId(),
        workspaceId: params.workspaceId,
        projectTitle: params.projectTitle,
        isDefault,
      },
      options
    );
  }

  /**
   * Get project by ID
   * Throws GoneError if soft-deleted, NotFoundError if not found
   */
  async getById(id: string) {
    const project = await this.deps.projectRepo.findById(id);
    if (!project) {
      const isSoftDeleted = await this.deps.projectRepo.isSoftDeleted(id);
      if (isSoftDeleted === true) {
        throw new GoneError('Project has been deleted');
      }
      throw new NotFoundError('Project not found');
    }
    return project;
  }

  /**
   * Get default project for workspace
   * Should never fail as workspace always has at least 1 project
   */
  async getDefaultProject(workspaceId: string) {
    const project = await this.deps.projectRepo.findDefaultByWorkspace(workspaceId);
    if (!project) {
      throw new NotFoundError('No default project found for workspace');
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
   * Get projects in workspace with pagination
   */
  async getProjectsByWorkspacePaginated(
    workspaceId: string,
    page: number = 1,
    perPage: number = 5
  ) {
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > 10) {
      throw new ValidationError('Per page must be between 1 and 10');
    }

    const total = await this.deps.projectRepo.countByWorkspace(workspaceId);
    const offset = (page - 1) * perPage;
    const projects = await this.deps.projectRepo.findByWorkspacePaginated(
      workspaceId,
      perPage,
      offset
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
    if (currentDefault && currentDefault.id !== projectId) {
      await this.deps.projectRepo.update(currentDefault.id, { isDefault: false }, options);
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
    updates: Partial<Pick<CreateProjectParams, 'projectTitle'>>,
    options?: { tx?: Transaction }
  ) {
    const project = await this.getById(projectId);
    return this.deps.projectRepo.update(projectId, updates, options);
  }

  /**
   * Soft delete a project
   * Marks project as deleted without removing from database
   * Prevents deletion of the last project in a workspace
   * If deleting a default project, automatically sets another project as default
   * Also triggers cleanup of all recordings in the project
   */
  async deleteProject(projectId: string, workspaceId: string, options?: { tx?: Transaction }) {
    const project = await this.getById(projectId);

    if (project.workspaceId !== workspaceId) {
      throw new ValidationError('Project does not belong to this workspace');
    }

    // Check if this is the last project in the workspace
    const projectCount = await this.deps.projectRepo.countByWorkspace(workspaceId);

    if (projectCount === 1) {
      throw new ValidationError('Cannot delete the only project in a workspace');
    }

    // If deleting a default project, set another one as default before deletion
    if (project.isDefault) {
      const otherProject = await this.deps.projectRepo.findOtherProject(workspaceId, projectId);
      if (otherProject) {
        await this.deps.projectRepo.update(otherProject.id, { isDefault: true }, options);
      }
    }

    // Cleanup all recordings in the project
    // This will soft delete recordings in DB and trigger storage cleanup
    // RecordingService is optional - only available when ProjectService is used in workspace routes
    if (this.deps.recordingService) {
      const cleanupResult = await this.deps.recordingService.cleanupProjectRecordings(
        projectId,
        workspaceId,
        options
      );

      console.log('[Project Cleanup]', {
        projectId,
        recordingsSoftDeleted: cleanupResult.softDeleted,
        storageCleanupTriggered: cleanupResult.cleanupTriggered,
      });
    }

    // Soft delete the project
    const deleted = await this.deps.projectRepo.softDelete(projectId, options);

    if (!deleted) {
      throw new ValidationError('Failed to delete project');
    }

    return deleted;
  }
}
