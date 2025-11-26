/**
 * WorkspaceService - Domain service for workspace operations
 * Contains business logic for workspace management
 */

import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { TokenService } from '@/api/services/token.service';
import { ValidationError, NotFoundError } from '@/api/lib/errors';
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

    // Generate a simple UUID for the workspace invite token
    // This UUID will be included in JWT tokens for invite links
    const inviteToken = nanoid();

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
   * Uses slugify package and suffixes with UUID for guaranteed uniqueness
   */
  generateUniqueSlug(baseName: string): string {
    const baseSlug = slugify(baseName, {
      lower: true,
      strict: true,
      trim: true,
    });

    // Generate short UUID suffix (first 8 characters)
    const uuidSuffix = uuidv4().split('-')[0];

    return `${baseSlug}-${uuidSuffix}`;
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

  /**
   * Rotate workspace invite URL
   * Generates new UUID and updates workspace
   * This invalidates all existing invite links
   */
  async rotateInviteUrl(workspaceId: string, options?: { tx?: Transaction }) {
    const workspace = await this.getById(workspaceId);

    // Generate new invite token (internal UUID)
    const newToken = nanoid();

    // Update workspace with new token
    const updatedWorkspace = await this.deps.workspaceRepo.updateInviteToken(
      workspace.id,
      newToken,
      options
    );

    if (!updatedWorkspace) {
      throw new NotFoundError('Failed to rotate workspace invite URL');
    }

    return updatedWorkspace;
  }
}
