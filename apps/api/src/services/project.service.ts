/**
 * ProjectService - Domain service for project operations
 * Contains business logic for project management
 */

import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { ValidationError, NotFoundError } from '@/api/lib/errors';
import type { Transaction, CreateProjectParams, CreateManagedProjectParams } from '@/api/types';

export interface ProjectServiceDeps {
  projectRepo: ProjectRepository;
}

export class ProjectService {
  constructor(private deps: ProjectServiceDeps) {}

  /**
   * Create project (auto-determines if default)
   * If first project in workspace → isDefault = true
   * Otherwise → isDefault = false
   * Uses managed store
   */
  async createProject(params: CreateProjectParams, options?: { tx?: Transaction }) {
    if (!params.workspaceId || !params.storeId) {
      throw new ValidationError('Workspace ID and Store ID are required');
    }

    const existingDefault = await this.deps.projectRepo.findDefaultByWorkspace(params.workspaceId);

    const isDefault = !existingDefault;

    return this.deps.projectRepo.create(
      {
        id: nanoid(),
        workspaceId: params.workspaceId,
        storeId: params.storeId,
        projectTitle: params.projectTitle,
        projectPath: uuidv4(),
        isDefault,
      },
      options
    );
  }

  /**
   * Create managed project with custom store
   * Allows user to specify their own store (BYOS)
   * Used when user wants to use their own S3/R2
   */
  async createManagedProject(params: CreateManagedProjectParams, options?: { tx?: Transaction }) {
    if (!params.workspaceId || !params.storeId) {
      throw new ValidationError('Workspace ID and Store ID are required');
    }

    if (params.isDefault) {
      const currentDefault = await this.deps.projectRepo.findDefaultByWorkspace(params.workspaceId);

      if (currentDefault) {
        await this.deps.projectRepo.update(currentDefault.id, { isDefault: false }, options);
      }
    }

    return this.deps.projectRepo.create(
      {
        id: nanoid(),
        workspaceId: params.workspaceId,
        storeId: params.storeId,
        projectTitle: params.projectTitle,
        projectPath: uuidv4(),
        isDefault: params.isDefault ?? false,
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
   */
  async getDefaultProject(workspaceId: string) {
    const project = await this.deps.projectRepo.findDefaultByWorkspace(workspaceId);
    if (!project) {
      throw new NotFoundError('No default project found for workspace');
    }
    return project;
  }
}
