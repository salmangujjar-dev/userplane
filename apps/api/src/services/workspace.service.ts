/**
 * WorkspaceService - Domain service for workspace operations
 * Contains business logic for workspace management
 */

import { generateWorkspaceId, generateRecordingId, generateInviteToken } from '@/api/lib/id';
import { getDefaultRecordingPreferences } from '@/api/constants/defaults';
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
import { isDisposableEmail, isDisposableEmailDomain } from '@/api/utils/disposable-email';
import { MAX_EMAIL_DOMAINS } from '@workspace/contract';

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
   * Sets default recording preferences from recorder app configuration
   * Throws WORKSPACE_NAME_REQUIRED if workspace name is missing
   */
  async create(params: CreateWorkspaceParams, options?: { tx?: Transaction }) {
    if (!params.workspaceName) {
      throw new ORPCError('WORKSPACE_NAME_REQUIRED', {
        status: 400,
        message: 'Workspace name is required',
      });
    }

    // Generate unique recording slug if not provided
    const recordingSlug = params.recordingSlug || generateRecordingId();

    // Generate workspace invite token
    const inviteToken = generateInviteToken();

    // Get default recording preferences
    const defaultPrefs = getDefaultRecordingPreferences();

    return this.deps.workspaceRepo.create(
      {
        workspaceId: generateWorkspaceId(),
        workspaceName: params.workspaceName,
        recordingSlug,
        workspacePlan: params.workspacePlan,
        workspaceInviteToken: inviteToken,
        recordingCompanyName: defaultPrefs.recordingCompanyName,
        recordingHeader: defaultPrefs.recordingHeader,
        recordingFootnote: defaultPrefs.recordingFootnote,
        recordingPrimaryColor: defaultPrefs.recordingPrimaryColor,
        recordingMaxDurationMs: defaultPrefs.recordingMaxDurationMs,
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
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
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
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
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
        status: 404,
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
      throw new ORPCError('WORKSPACE_USER_ID_REQUIRED', {
        status: 400,
        message: 'User ID is required',
      });
    }
    return this.deps.workspaceRepo.findByUserId(userId, options);
  }

  /**
   * Get workspaces for a user with pagination
   * Returns workspaces where the user is a member
   * Optionally includes notification preferences and workspace membership info
   * Supports minimal mode which returns only ID and name for efficient loading
   * Pagination params are validated by the contract schema
   * Throws WORKSPACE_USER_ID_REQUIRED if validation fails
   */
  async getByUserIdPaginated(
    userId: string,
    page: number = 1,
    perPage: number = 5,
    options?: {
      minimal?: boolean;
      includeNotificationPreferences?: boolean;
      includeWorkspaceMembership?: boolean;
    }
  ) {
    if (!userId) {
      throw new ORPCError('WORKSPACE_USER_ID_REQUIRED', {
        status: 400,
        message: 'User ID is required',
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
      throw new ORPCError('WORKSPACE_USER_ID_REQUIRED', {
        status: 400,
        message: 'User ID is required',
      });
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
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
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
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
    }

    const updated = await this.deps.workspaceRepo.updatePreferences(workspaceId, updates, options);
    if (!updated) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
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
      throw new ORPCError('WORKSPACE_NAME_REQUIRED', {
        status: 400,
        message: 'Workspace name is required',
      });
    }

    if (newName.length > 255) {
      throw new ORPCError('WORKSPACE_NAME_TOO_LONG', {
        status: 400,
        message: 'Workspace name must be less than 255 characters',
      });
    }

    const workspace = await this.getById(workspaceId);
    if (!workspace) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
    }

    const updated = await this.deps.workspaceRepo.updateName(workspaceId, newName.trim(), options);

    if (!updated) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Failed to update workspace name',
      });
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
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
    }

    // Use transaction for atomic deletion
    const performDeletion = async (tx: Transaction) => {
      // 1. Soft delete the workspace
      const deleted = await this.deps.workspaceRepo.softDelete(workspaceId, { tx });

      if (!deleted) {
        throw new ORPCError('WORKSPACE_DELETE_FAILED', {
          status: 500,
          message: 'Failed to delete workspace',
        });
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
      throw new ORPCError('WORKSPACE_SEARCH_TERM_REQUIRED', {
        status: 400,
        message: 'Search term is required',
      });
    }

    switch (type) {
      case 'members': {
        if (!this.deps.workspaceMemberRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            status: 500,
            message: 'Member search not available',
          });
        }
        return this.deps.workspaceMemberRepo.searchByName(workspaceId, searchTerms, limit);
      }
      case 'projects': {
        if (!this.deps.projectRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            status: 500,
            message: 'Project search not available',
          });
        }
        return this.deps.projectRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      case 'domains': {
        if (!this.deps.domainRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            status: 500,
            message: 'Domain search not available',
          });
        }
        return this.deps.domainRepo.searchByUrl(workspaceId, searchTerms, limit);
      }
      case 'links': {
        if (!this.deps.linkRepo) {
          throw new ORPCError('WORKSPACE_SEARCH_UNAVAILABLE', {
            status: 500,
            message: 'Link search not available',
          });
        }
        return this.deps.linkRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      default:
        throw new ORPCError('WORKSPACE_SEARCH_TYPE_INVALID', {
          status: 400,
          message: 'Invalid search type',
        });
    }
  }

  /**
   * Get workspace invite policy settings
   * Throws WORKSPACE_NOT_FOUND if workspace not found
   */
  async getInvitePolicy(workspaceId: string) {
    const policy = await this.deps.workspaceRepo.findInvitePolicyById(workspaceId);

    if (!policy) {
      const isSoftDeleted = await this.deps.workspaceRepo.isSoftDeleted(workspaceId);
      if (isSoftDeleted === true) {
        throw new ORPCError('WORKSPACE_GONE', {
          status: 410,
          message: 'Workspace has been deleted',
        });
      }
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
    }

    // Parse comma-separated domains into array
    const domains = policy.workspaceInviteDomains
      ? policy.workspaceInviteDomains.split(',').map((d: string) => d.trim().toLowerCase())
      : null;

    return {
      workspaceId: policy.workspaceId,
      workspaceInvitePolicy: policy.workspaceInvitePolicy,
      workspaceInviteDomains: domains,
    };
  }

  /**
   * Update workspace invite policy settings
   * Throws WORKSPACE_NOT_FOUND if workspace not found
   * Throws WORKSPACE_INVITE_POLICY_DOMAINS_REQUIRED if whitelisted/protected without domains
   */
  async updateInvitePolicy(
    workspaceId: string,
    data: {
      workspaceInvitePolicy: 'private' | 'whitelisted' | 'protected';
      workspaceInviteDomains?: string[] | null;
    },
    options?: { tx?: Transaction }
  ) {
    // Verify workspace exists
    await this.getById(workspaceId);

    // Convert array of domains to comma-separated string
    // For private policy, always set domains to null
    let domainsString: string | null = null;
    if (data.workspaceInvitePolicy !== 'private') {
      if (data.workspaceInviteDomains && data.workspaceInviteDomains.length > 0) {
        const normalizedDomains = data.workspaceInviteDomains
          .map((d) => d.trim().toLowerCase())
          .filter((d) => d.length > 0);

        // Check max domains limit
        if (normalizedDomains.length > MAX_EMAIL_DOMAINS) {
          throw new ORPCError('WORKSPACE_INVITE_POLICY_TOO_MANY_DOMAINS', {
            status: 400,
            message: `Maximum ${MAX_EMAIL_DOMAINS} email domains allowed per workspace`,
          });
        }

        // Check for disposable email domains
        const disposableDomains = normalizedDomains.filter((d) => isDisposableEmailDomain(d));
        if (disposableDomains.length > 0) {
          throw new ORPCError('WORKSPACE_INVITE_POLICY_DISPOSABLE_DOMAIN', {
            status: 400,
            message: `Disposable email domains are not allowed: ${disposableDomains.join(', ')}`,
          });
        }

        domainsString = normalizedDomains.join(',');
      }
      // Require at least one domain for whitelisted/protected policies
      if (!domainsString) {
        throw new ORPCError('WORKSPACE_INVITE_POLICY_DOMAINS_REQUIRED', {
          status: 400,
          message: 'At least one email domain is required for whitelisted or protected policies',
        });
      }
    }

    const updated = await this.deps.workspaceRepo.updateInvitePolicy(
      workspaceId,
      {
        workspaceInvitePolicy: data.workspaceInvitePolicy,
        workspaceInviteDomains: domainsString,
      },
      options
    );

    if (!updated) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Failed to update workspace invite policy',
      });
    }

    // Parse domains back to array for response
    const domains = updated.workspaceInviteDomains
      ? updated.workspaceInviteDomains.split(',').map((d: string) => d.trim().toLowerCase())
      : null;

    return {
      workspaceId: updated.workspaceId,
      workspaceInvitePolicy: updated.workspaceInvitePolicy,
      workspaceInviteDomains: domains,
    };
  }

  /**
   * Suggest workspaces for a user based on their email domain
   * Returns workspaces with whitelisted or protected policies that match the user's domain
   * Used when user has no workspaces
   * Returns empty array for users with disposable email addresses
   */
  async suggestWorkspaces(
    userEmail: string,
    userId: string,
    page: number = 1,
    perPage: number = 5
  ) {
    // Don't suggest workspaces to users with disposable email addresses
    if (isDisposableEmail(userEmail)) {
      return {
        workspaces: [],
        pagination: {
          page,
          perPage,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    // Extract domain from email
    const emailDomain = userEmail.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      return {
        workspaces: [],
        pagination: {
          page,
          perPage,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    const { workspaces, total } = await this.deps.workspaceRepo.findByEmailDomain(
      emailDomain,
      userId,
      page,
      perPage
    );

    const totalPages = Math.ceil(total / perPage);
    const hasMore = page < totalPages;

    return {
      workspaces: workspaces.map((w) => ({
        workspaceId: w.workspaceId,
        workspaceName: w.workspaceName,
        workspaceInvitePolicy: w.workspaceInvitePolicy,
        action: (w.workspaceInvitePolicy === 'whitelisted' ? 'join' : 'request') as
          | 'join'
          | 'request',
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasMore,
      },
    };
  }

  /**
   * Get workspace with invite policy for join flow
   * Throws WORKSPACE_NOT_FOUND if workspace not found
   */
  async getWithInvitePolicy(workspaceId: string) {
    const workspace = await this.deps.workspaceRepo.findWithInvitePolicyById(workspaceId);

    if (!workspace) {
      const isSoftDeleted = await this.deps.workspaceRepo.isSoftDeleted(workspaceId);
      if (isSoftDeleted === true) {
        throw new ORPCError('WORKSPACE_GONE', {
          status: 410,
          message: 'Workspace has been deleted',
        });
      }
      throw new ORPCError('WORKSPACE_NOT_FOUND', { status: 404, message: 'Workspace not found' });
    }

    // Parse comma-separated domains into array
    const domains = workspace.workspaceInviteDomains
      ? workspace.workspaceInviteDomains.split(',').map((d: string) => d.trim().toLowerCase())
      : null;

    return {
      ...workspace,
      workspaceInviteDomains: domains,
    };
  }
}
