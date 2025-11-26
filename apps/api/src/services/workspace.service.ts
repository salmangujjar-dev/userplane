/**
 * WorkspaceService - Domain service for workspace operations
 * Contains business logic for workspace management
 */

import { nanoid } from 'nanoid';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { TokenService } from '@/api/services/token.service';
import { ValidationError, NotFoundError } from '@/api/lib/errors';
import { slugify } from '@/api/lib/utils';
import type { Transaction, CreateWorkspaceParams } from '@/api/types';

export interface WorkspaceServiceDeps {
  workspaceRepo: WorkspaceRepository;
  tokenService: TokenService;
}

export class WorkspaceService {
  constructor(private deps: WorkspaceServiceDeps) {}

  /**
   * Create a new workspace
   */
  async create(params: CreateWorkspaceParams, options?: { tx?: Transaction }) {
    if (!params.workspaceName) {
      throw new ValidationError('Workspace name is required');
    }
    if (!params.workspaceSlug) {
      throw new ValidationError('Workspace slug is required');
    }

    const inviteToken = this.deps.tokenService.generateWorkspaceInviteToken({
      workspaceSlug: params.workspaceSlug,
      createdBy: params.userId,
    });

    return this.deps.workspaceRepo.create(
      {
        id: nanoid(),
        workspaceName: params.workspaceName,
        workspaceSlug: params.workspaceSlug,
        workspacePlan: params.workspacePlan,
        workspaceLogoUrl: params.workspaceLogoUrl,
        workspaceInviteToken: inviteToken,
      },
      options
    );
  }

  /**
   * Generate unique slug for workspace
   */
  async generateUniqueSlug(baseName: string): Promise<string> {
    const baseSlug = slugify(baseName);
    let slug = baseSlug;
    let counter = 2;

    while (await this.deps.workspaceRepo.existsBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Get workspace by ID
   */
  async getById(id: string) {
    const workspace = await this.deps.workspaceRepo.findById(id);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }
    return workspace;
  }

  /**
   * Get workspace by slug
   */
  async getBySlug(slug: string) {
    return this.deps.workspaceRepo.findBySlug(slug);
  }

  /**
   * Get workspace by invite token
   */
  async getByInviteToken(token: string) {
    return this.deps.workspaceRepo.findByInviteToken(token);
  }
}
