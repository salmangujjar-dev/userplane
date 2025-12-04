/**
 * ProjectService - Domain service for project operations
 * Contains business logic for project management
 */

import { nanoid } from 'nanoid';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { ValidationError, NotFoundError } from '@/api/lib/errors';
import type { Transaction, CreateProjectParams } from '@/api/types';

export interface ProjectServiceDeps {
  projectRepo: ProjectRepository;
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
        id: `proj_${nanoid(16)}`,
        workspaceId: params.workspaceId,
        projectTitle: params.projectTitle,
        projectPath: `path_${nanoid(16)}`,
        isDefault,
      },
      options
    );
  }

  /**
   * Get project by ID
   */
  async getById(id: string) {
    const project = await this.deps.projectRepo.findById(id);
    if (!project) {
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
}
