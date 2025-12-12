/**
 * WorkspaceService - Domain service for workspace operations
 * Contains business logic for workspace management
 */

import {
  generateWorkspaceId,
  generateRecordingId,
  generateInviteToken,
} from '@/api/lib/id-generator';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { LinkRepository } from '@/api/repositories/links.repository';
import { TokenService } from '@/api/services/token.service';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import type { Transaction, CreateWorkspaceParams } from '@/api/types';

export interface WorkspaceServiceDeps {
  workspaceRepo: WorkspaceRepository;
  tokenService: TokenService;
  workspaceMemberRepo?: WorkspaceMemberRepository;
  projectRepo?: ProjectRepository;
  domainRepo?: DomainRepository;
  linkRepo?: LinkRepository;
}

export class WorkspaceService {
  constructor(private deps: WorkspaceServiceDeps) {}

  /**
   * Create a new workspace
   * Generates unique recording slug internally if not provided
   */
  async create(params: CreateWorkspaceParams, options?: { tx?: Transaction }) {
    if (!params.workspaceName) {
      throw new ValidationError('Workspace name is required');
    }

    // Generate unique recording slug if not provided
    const recordingSlug = params.recordingSlug || generateRecordingId();

    // Generate workspace invite token
    const inviteToken = generateInviteToken();

    return this.deps.workspaceRepo.create(
      {
        id: generateWorkspaceId(),
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
   * Throws GoneError if soft-deleted, NotFoundError if not found
   */
  async getById(id: string) {
    const workspace = await this.deps.workspaceRepo.findById(id);
    if (!workspace) {
      const isSoftDeleted = await this.deps.workspaceRepo.isSoftDeleted(id);
      if (isSoftDeleted === true) {
        throw new GoneError('Workspace has been deleted');
      }
      throw new NotFoundError('Workspace not found');
    }
    return workspace;
  }

  /**
   * Get workspace preferences by ID
   * Returns recording-related settings
   * Throws GoneError if soft-deleted, NotFoundError if not found
   */
  async getPreferencesById(id: string) {
    const preferences = await this.deps.workspaceRepo.findPreferencesById(id);
    if (!preferences) {
      const isSoftDeleted = await this.deps.workspaceRepo.isSoftDeleted(id);
      if (isSoftDeleted === true) {
        throw new GoneError('Workspace has been deleted');
      }
      throw new NotFoundError('Workspace not found');
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
   */
  async rotateInviteUrl(workspaceId: string, options?: { tx?: Transaction }) {
    const workspace = await this.getById(workspaceId);

    // Generate new invite token
    const newToken = generateInviteToken();

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

  /**
   * Get all workspaces for a user
   * Returns workspaces where the user is a member
   * Optionally includes notification preferences and workspace membership info
   */
  async getByUserId(
    userId: string,
    options?: {
      includeNotificationPreferences?: boolean;
      includeWorkspaceMembership?: boolean;
    }
  ) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    return this.deps.workspaceRepo.findByUserId(userId, options);
  }

  /**
   * Get workspaces for a user with pagination
   * Returns workspaces where the user is a member
   * Optionally includes notification preferences and workspace membership info
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
      throw new ValidationError('User ID is required');
    }

    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > 50) {
      throw new ValidationError('Per page must be between 1 and 50');
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
   */
  async countByUserWithRoles(userId: string, roles?: Array<'member' | 'admin' | 'owner'>) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // If roles array is empty, return 0
    if (roles && roles.length === 0) {
      return 0;
    }

    return this.deps.workspaceRepo.countByUserIdWithRoleFilter(userId, roles);
  }

  /**
   * Get workspace invite token by ID
   */
  async getInviteToken(id: string) {
    const result = await this.deps.workspaceRepo.findInviteTokenById(id);
    if (!result) {
      throw new NotFoundError('Workspace not found');
    }
    return result.workspaceInviteToken;
  }

  /**
   * Update workspace preferences
   * Updates recording-related settings
   */
  async updatePreferences(
    workspaceId: string,
    updates: Partial<{
      recordingCustomizeLink: boolean;
      recordingHideSensitive: boolean;
      recordingCaptureClientLog: boolean;
      recordingCaptureServerLog: boolean;
      recordingCompanyName: string | null;
      recordingCompanyLogoPath: string | null;
      recordingHeader: string | null;
      recordingFootnote: string | null;
      recordingPrimaryColor: string | null;
      recordingMaxDuration: number | null;
    }>,
    options?: { tx?: Transaction }
  ) {
    const workspace = await this.getById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const updated = await this.deps.workspaceRepo.updatePreferences(workspaceId, updates, options);
    if (!updated) {
      throw new NotFoundError('Failed to update workspace preferences');
    }

    return updated;
  }

  /**
   * Update workspace name
   * Requires admin or owner role
   */
  async updateName(workspaceId: string, newName: string, options?: { tx?: Transaction }) {
    if (!newName || newName.trim().length === 0) {
      throw new ValidationError('Workspace name is required');
    }

    if (newName.length > 255) {
      throw new ValidationError('Workspace name must be less than 255 characters');
    }

    const workspace = await this.getById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const updated = await this.deps.workspaceRepo.updateName(workspaceId, newName.trim(), options);

    if (!updated) {
      throw new NotFoundError('Failed to update workspace name');
    }

    return updated;
  }

  /**
   * Soft delete a workspace
   * Marks workspace as deleted without removing from database
   */
  async deleteWorkspace(workspaceId: string, options?: { tx?: Transaction }) {
    const workspace = await this.getById(workspaceId);

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const deleted = await this.deps.workspaceRepo.softDelete(workspaceId, options);

    if (!deleted) {
      throw new ValidationError('Failed to delete workspace');
    }

    return deleted;
  }

  /**
   * Search workspace entities
   * Unified search across members, projects, domains, and links
   * Uses different strategies based on entity type:
   * - members, projects, domains: ILIKE pattern matching (low volume)
   * - links: PostgreSQL FTS with ranking (higher volume, better performance)
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
      throw new ValidationError('Search term is required');
    }

    switch (type) {
      case 'members': {
        if (!this.deps.workspaceMemberRepo) {
          throw new ValidationError('Member search not available');
        }
        return this.deps.workspaceMemberRepo.searchByName(workspaceId, searchTerms, limit);
      }
      case 'projects': {
        if (!this.deps.projectRepo) {
          throw new ValidationError('Project search not available');
        }
        return this.deps.projectRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      case 'domains': {
        if (!this.deps.domainRepo) {
          throw new ValidationError('Domain search not available');
        }
        return this.deps.domainRepo.searchByUrl(workspaceId, searchTerms, limit);
      }
      case 'links': {
        if (!this.deps.linkRepo) {
          throw new ValidationError('Link search not available');
        }
        return this.deps.linkRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      default:
        throw new ValidationError('Invalid search type');
    }
  }
}
