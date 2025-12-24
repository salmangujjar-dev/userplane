/**
 * WorkspaceService - Domain service for workspace operations
 * Contains business logic for workspace management
 */

import { generateWorkspaceId, generateRecordingId, generateInviteToken } from '@/api/lib/id';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { LinkRepository } from '@/api/repositories/links.repository';
import { TokenService } from '@/api/services/token.service';
import type { ProjectService } from '@/api/services/project.service';
import { ORPCError } from '@orpc/server';
import type { Transaction, CreateWorkspaceParams } from '@/api/types';
import type { DbClient } from '@workspace/db';

export interface WorkspaceServiceDeps {
  workspaceRepo: WorkspaceRepository;
  tokenService: TokenService;
  db: DbClient;
  workspaceMemberRepo?: WorkspaceMemberRepository;
  projectRepo?: ProjectRepository;
  domainRepo?: DomainRepository;
  linkRepo?: LinkRepository;
  projectService?: ProjectService;
}

export class WorkspaceService {
  constructor(private deps: WorkspaceServiceDeps) {}

  /**
   * Create a new workspace
   * Generates unique recording slug internally if not provided
   * Throws WORKSPACE_NAME_REQUIRED if workspace name is missing
   */
  async create(params: CreateWorkspaceParams, options?: { tx?: Transaction }) {
    if (!params.workspaceName) {
      throw new ORPCError('WORKSPACE_NAME_REQUIRED', { message: 'Workspace name is required' });
    }

    // Generate unique recording slug if not provided
    const recordingSlug = params.recordingSlug || generateRecordingId();

    // Generate workspace invite token
    const inviteToken = generateInviteToken();

    return this.deps.workspaceRepo.create(
      {
        workspaceId: generateWorkspaceId(),
        workspaceName: params.workspaceName,
        recordingSlug,
        workspacePlan: params.workspacePlan,
        workspaceInviteToken: inviteToken,
      },
      options
    );
  }

  /**
   * Generate unique slug for workspace recording
   * Uses centralized ID generator with rec_ prefix for consistency
   */
  generateUniqueSlug(baseName: string): string {
    return generateRecordingId();
  }

  /**
   * Get workspace by ID
   * Returns only basic workspace info
   * Throws WORKSPACE_GONE if soft-deleted, WORKSPACE_NOT_FOUND if not found
   */
  async getById(workspaceId: string) {
    const workspace = await this.deps.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      const isSoftDeleted = await this.deps.workspaceRepo.isSoftDeleted(workspaceId);
      if (isSoftDeleted === true) {
        throw new ORPCError('WORKSPACE_GONE', {
          status: 410,
          message: 'Workspace has been deleted',
        });
      }
      throw new ORPCError('WORKSPACE_NOT_FOUND', { message: 'Workspace not found' });
    }
    return workspace;
  }

  /**
   * Get workspace preferences by ID
   * Returns recording-related settings
   * Throws WORKSPACE_GONE if soft-deleted, WORKSPACE_NOT_FOUND if not found
   */
  async getPreferencesById(workspaceId: string) {
    const preferences = await this.deps.workspaceRepo.findPreferencesById(workspaceId);
    if (!preferences) {
      const isSoftDeleted = await this.deps.workspaceRepo.isSoftDeleted(workspaceId);
      if (isSoftDeleted === true) {
        throw new ORPCError('WORKSPACE_GONE', {
          status: 410,
          message: 'Workspace has been deleted',
        });
      }
      throw new ORPCError('WORKSPACE_NOT_FOUND', { message: 'Workspace not found' });
    }
    return preferences;
  }

  /**
   * Get workspace by recording slug
   * Note: API endpoints should use workspace ID instead
   * This method is kept for recorder/share apps that resolve by slug
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
   * Generates new invite token and updates workspace
   * This invalidates all existing invite links
   * Throws WORKSPACE_NOT_FOUND if update fails
   */
  async rotateInviteUrl(workspaceId: string, options?: { tx?: Transaction }) {
    const workspace = await this.getById(workspaceId);

    // Generate new invite token
    const newToken = generateInviteToken();

    // Update workspace with new token
    const updatedWorkspace = await this.deps.workspaceRepo.updateInviteToken(
      workspace.workspaceId,
      newToken,
      options
    );

    if (!updatedWorkspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        message: 'Failed to rotate workspace invite URL',
      });
    }

    return updatedWorkspace;
  }

  /**
   * Get all workspaces for a user
   * Returns workspaces where the user is a member
   * Optionally includes notification preferences and workspace membership info
   * Throws WORKSPACE_USER_ID_REQUIRED if user ID is missing
   */
  async getByUserId(
    userId: string,
    options?: {
      includeNotificationPreferences?: boolean;
      includeWorkspaceMembership?: boolean;
    }
  ) {
    if (!userId) {
      throw new ORPCError('WORKSPACE_USER_ID_REQUIRED', { message: 'User ID is required' });
    }
    return this.deps.workspaceRepo.findByUserId(userId, options);
  }

  /**
   * Get workspaces for a user with pagination
   * Returns workspaces where the user is a member
   * Optionally includes notification preferences and workspace membership info
   * Throws WORKSPACE_USER_ID_REQUIRED, WORKSPACE_INVALID_PAGINATION if validation fails
   */
  async getByUserIdPaginated(
    userId: string,
    page: number = 1,
    perPage: number = 5,
    options?: {
      includeNotificationPreferences?: boolean;
      includeWorkspaceMembership?: boolean;
    }
  ) {
    if (!userId) {
      throw new ORPCError('WORKSPACE_USER_ID_REQUIRED', { message: 'User ID is required' });
    }

    if (page < 1) {
      throw new ORPCError('WORKSPACE_INVALID_PAGINATION', {
        message: 'Page must be greater than 0',
      });
    }

    if (perPage < 1 || perPage > 50) {
      throw new ORPCError('WORKSPACE_INVALID_PAGINATION', {
        message: 'Per page must be between 1 and 50',
      });
    }

    const total = await this.deps.workspaceRepo.countByUserId(userId);
    const offset = (page - 1) * perPage;
    const workspaces = await this.deps.workspaceRepo.findByUserIdPaginated(
      userId,
      perPage,
      offset,
      options
    );

    return {
      workspaces,
      total,
    };
  }

  /**
   * Count workspaces for a user with optional role-based filtering
   * Returns count of workspaces where user has specified roles
   * If no roles specified, counts all workspaces for the user
   * Throws WORKSPACE_USER_ID_REQUIRED if user ID is missing
   */
  async countByUserWithRoles(userId: string, roles?: Array<'member' | 'admin' | 'owner'>) {
    if (!userId) {
      throw new ORPCError('WORKSPACE_USER_ID_REQUIRED', { message: 'User ID is required' });
    }

    // If roles array is empty, return 0
    if (roles && roles.length === 0) {
      return 0;
    }

    return this.deps.workspaceRepo.countByUserIdWithRoleFilter(userId, roles);
  }

  /**
   * Get workspace invite token by ID
   * Throws WORKSPACE_NOT_FOUND if workspace not found
   */
  async getInviteToken(workspaceId: string) {
    const result = await this.deps.workspaceRepo.findInviteTokenById(workspaceId);
    if (!result) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', { message: 'Workspace not found' });
    }
    return result.workspaceInviteToken;
  }

  /**
   * Update workspace preferences
   * Updates recording-related settings
   * Note: Recording toggle settings (hideSensitive, captureClientLog, captureServerLog) moved to domain level
   * Throws WORKSPACE_NOT_FOUND if workspace not found or update fails
   */
  async updatePreferences(
    workspaceId: string,
    updates: Partial<{
      recordingCustomizeLink: boolean;
      recordingCompanyName: string | null;
      recordingCompanyLogoPath: string | null;
      recordingHeader: string | null;
      recordingFootnote: string | null;
      recordingPrimaryColor: string | null;
      recordingMaxDurationMs: number | null;
    }>,
    options?: { tx?: Transaction }
  ) {
    const workspace = await this.getById(workspaceId);
    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', { message: 'Workspace not found' });
    }

    const updated = await this.deps.workspaceRepo.updatePreferences(workspaceId, updates, options);
    if (!updated) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        message: 'Failed to update workspace preferences',
      });
    }

    return updated;
  }

  /**
   * Update workspace name
   * Requires admin or owner role
   * Throws WORKSPACE_NAME_REQUIRED, WORKSPACE_NAME_TOO_LONG if validation fails
   * Throws WORKSPACE_NOT_FOUND if workspace not found or update fails
   */
  async updateName(workspaceId: string, newName: string, options?: { tx?: Transaction }) {
    if (!newName || newName.trim().length === 0) {
      throw new ORPCError('WORKSPACE_NAME_REQUIRED', { message: 'Workspace name is required' });
    }

    if (newName.length > 255) {
      throw new ORPCError('WORKSPACE_NAME_TOO_LONG', {
        message: 'Workspace name must be less than 255 characters',
      });
    }

    const workspace = await this.getById(workspaceId);
    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', { message: 'Workspace not found' });
    }

    const updated = await this.deps.workspaceRepo.updateName(workspaceId, newName.trim(), options);

    if (!updated) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', { message: 'Failed to update workspace name' });
    }

    return updated;
  }

  /**
   * Soft delete a workspace with cascade deletion
   *
   * Transaction flow:
   * 1. Mark workspace as deleted
   * 2. Mark all projects as deleted
   * 3. Mark all links as deleted
   *
   * After commit (handled by caller):
   * - Trigger deleteWorkspaceResources task
   * Throws WORKSPACE_NOT_FOUND if workspace not found
   * Throws WORKSPACE_DELETE_FAILED if deletion fails
   */
  async deleteWorkspace(workspaceId: string, options?: { tx?: Transaction }) {
    const workspace = await this.getById(workspaceId);

    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', { message: 'Workspace not found' });
    }

    // Use transaction for atomic deletion
    const performDeletion = async (tx: Transaction) => {
      // 1. Soft delete the workspace
      const deleted = await this.deps.workspaceRepo.softDelete(workspaceId, { tx });

      if (!deleted) {
        throw new ORPCError('WORKSPACE_DELETE_FAILED', { message: 'Failed to delete workspace' });
      }

      // 2. Soft delete all projects in workspace
      if (this.deps.projectRepo) {
        await this.deps.projectRepo.softDeleteByWorkspaceId(workspaceId, { tx });
      }

      // 3. Soft delete all links in workspace
      if (this.deps.linkRepo) {
        await this.deps.linkRepo.softDeleteByWorkspaceId(workspaceId, { tx });
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
   * Search workspace entities
   * Unified search across members, projects, domains, and links
   * Uses different strategies based on entity type:
   * - members, projects, domains: ILIKE pattern matching (low volume)
   * - links: PostgreSQL FTS with ranking (higher volume, better performance)
   * Throws WORKSPACE_SEARCH_TERM_REQUIRED, WORKSPACE_SEARCH_TYPE_INVALID, WORKSPACE_SEARCH_UNAVAILABLE if validation fails
   */
  async search(
    workspaceId: string,
    searchTerm: string,
    type: 'members' | 'projects' | 'domains' | 'links',
    limit: number = 5
  ) {
    // Validate workspace exists
    await this.getById(workspaceId);

    // Split search term into words for AND-based matching
    const searchTerms = searchTerm
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    if (searchTerms.length === 0) {
      throw new ORPCError('WORKSPACE_SEARCH_TERM_REQUIRED', { message: 'Search term is required' });
    }

    switch (type) {
      case 'members': {
        if (!this.deps.workspaceMemberRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            message: 'Member search not available',
          });
        }
        return this.deps.workspaceMemberRepo.searchByName(workspaceId, searchTerms, limit);
      }
      case 'projects': {
        if (!this.deps.projectRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            message: 'Project search not available',
          });
        }
        return this.deps.projectRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      case 'domains': {
        if (!this.deps.domainRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            message: 'Domain search not available',
          });
        }
        return this.deps.domainRepo.searchByUrl(workspaceId, searchTerms, limit);
      }
      case 'links': {
        if (!this.deps.linkRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            message: 'Link search not available',
          });
        }
        return this.deps.linkRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      default:
        throw new ORPCError('WORKSPACE_SEARCH_TYPE_INVALID', { message: 'Invalid search type' });
    }
  }
}
