/**
 * WorkspaceService - Domain service for workspace operations
 * Contains business logic for workspace management
 */

import { MAX_EMAIL_DOMAINS, workspaceError } from '@workspace/contract';
import type { DbClient } from '@workspace/db';
import { isDisposableEmail, isDisposableEmailDomain } from '@workspace/shared';

import { getDefaultRecordingPreferences } from '@/api/constants/defaults';
import { generateInviteToken, generateRecordingId, generateWorkspaceId } from '@/api/lib/id';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { LinkRepository } from '@/api/repositories/links.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { ProjectService } from '@/api/services/project.service';
import { TokenService } from '@/api/services/token.service';
import type { CreateWorkspaceParams, Transaction } from '@/api/types';
import {
  calculateDaysSince,
  getRestorationMaxWindowDays,
  getRestorationReason,
  getRestorationStatus,
} from '@/api/utils/date';

export interface WorkspaceServiceDeps {
  workspaceRepo: WorkspaceRepository;
  tokenService: TokenService;
  db: DbClient;
  workspaceMemberRepo?: WorkspaceMemberRepository;
  projectRepo?: ProjectRepository;
  domainRepo?: DomainRepository;
  linkRepo?: LinkRepository;
  recordingRepo?: RecordingRepository;
  projectService?: ProjectService;
}

export class WorkspaceService {
  constructor(private deps: WorkspaceServiceDeps) {}

  /**
   * Create a new workspace
   * Generates unique recording slug internally if not provided
   * Sets default recording preferences from recorder app configuration
   * Optionally accepts a predetermined workspace ID (for invite-based workspaces)
   * Throws WORKSPACE_NAME_REQUIRED if workspace name is missing
   */
  async create(params: CreateWorkspaceParams, options?: { tx?: Transaction }) {
    if (!params.workspaceName) {
      throw workspaceError.WORKSPACE_NAME_REQUIRED();
    }

    // Generate unique recording slug if not provided
    const recordingSlug = params.recordingSlug || generateRecordingId();

    // Generate workspace invite token
    const inviteToken = generateInviteToken();

    // Get default recording preferences
    const defaultPrefs = getDefaultRecordingPreferences();

    return this.deps.workspaceRepo.create(
      {
        workspaceId: params.workspaceId || generateWorkspaceId(),
        workspaceName: params.workspaceName,
        recordingSlug,
        workspacePlan: params.workspacePlan,
        workspaceInviteToken: inviteToken,
        recordingCompanyName: defaultPrefs.recordingCompanyName,
        recordingHeader: defaultPrefs.recordingHeader,
        recordingFootnote: defaultPrefs.recordingFootnote,
        recordingPrimaryColor: defaultPrefs.recordingPrimaryColor,
        recordingMaxDurationMs: defaultPrefs.recordingMaxDurationMs,
        workspaceBillingEmail: params.workspaceBillingEmail,
      },
      options
    );
  }

  /**
   * Generate unique slug for workspace recording
   * Uses centralized ID generator with rec_ prefix for consistency
   * To be used later for public recording links slug generation
   */
  generateUniqueSlug(): string {
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
        throw workspaceError.WORKSPACE_GONE();
      }
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }
    return workspace;
  }

  /**
   * Get workspace billing email
   * Throws WORKSPACE_NOT_FOUND if workspace not found
   */
  async getWorkspaceBillingEmail(workspaceId: string) {
    const result = await this.deps.workspaceRepo.findWorkspaceBillingEmailById(workspaceId);
    if (!result) {
      const isSoftDeleted = await this.deps.workspaceRepo.isSoftDeleted(workspaceId);
      if (isSoftDeleted === true) {
        throw workspaceError.WORKSPACE_GONE();
      }
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }
    return result.workspaceBillingEmail;
  }

  /**
   * Update workspace billing email
   * Throws WORKSPACE_NOT_FOUND if workspace not found or update fails
   */
  async updateWorkspaceBillingEmail(
    workspaceId: string,
    email: string,
    options?: { tx?: Transaction }
  ) {
    const workspace = await this.getById(workspaceId);
    if (!workspace) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    const updated = await this.deps.workspaceRepo.updateWorkspaceBillingEmail(
      workspaceId,
      email,
      options
    );

    if (!updated) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    return updated;
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
        throw workspaceError.WORKSPACE_GONE();
      }
      throw workspaceError.WORKSPACE_NOT_FOUND();
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
      throw workspaceError.WORKSPACE_NOT_FOUND();
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
      throw workspaceError.WORKSPACE_USER_ID_REQUIRED();
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
      throw workspaceError.WORKSPACE_USER_ID_REQUIRED();
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
      throw workspaceError.WORKSPACE_USER_ID_REQUIRED();
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
      throw workspaceError.WORKSPACE_NOT_FOUND();
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
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    const updated = await this.deps.workspaceRepo.updatePreferences(workspaceId, updates, options);
    if (!updated) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
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
      throw workspaceError.WORKSPACE_NAME_REQUIRED();
    }

    if (newName.length > 255) {
      throw workspaceError.WORKSPACE_NAME_TOO_LONG();
    }

    const workspace = await this.getById(workspaceId);
    if (!workspace) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    const updated = await this.deps.workspaceRepo.updateName(workspaceId, newName.trim(), options);

    if (!updated) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    return updated;
  }

  /**
   * Soft delete a workspace with cascade deletion
   *
   * Transaction flow:
   * 1. Mark workspace as deleted
   * 2. Mark all workspace members as deleted
   * 3. Mark all projects as deleted
   * 4. Mark all links as deleted
   * 5. Mark all recordings as deleted
   *
   * After commit (handled by caller):
   * - Trigger deleteWorkspaceResources task
   * Throws WORKSPACE_NOT_FOUND if workspace not found
   * Throws WORKSPACE_DELETE_FAILED if deletion fails
   */
  async deleteWorkspace(workspaceId: string, deletedAt: Date, options?: { tx?: Transaction }) {
    const workspace = await this.getById(workspaceId);

    if (!workspace) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    // Use transaction for atomic deletion
    const performDeletion = async (tx: Transaction) => {
      // 1. Soft delete the workspace
      const deleted = await this.deps.workspaceRepo.softDelete(workspaceId, deletedAt, { tx });

      if (!deleted) {
        throw workspaceError.WORKSPACE_DELETE_FAILED();
      }

      // 2. Soft delete all workspace members
      if (this.deps.workspaceMemberRepo) {
        await this.deps.workspaceMemberRepo.softDeleteByWorkspaceId(workspaceId, deletedAt, { tx });
      }

      // 3. Soft delete all projects in workspace
      if (this.deps.projectRepo) {
        await this.deps.projectRepo.softDeleteByWorkspaceId(workspaceId, deletedAt, { tx });
      }

      // 4. Soft delete all links in workspace
      if (this.deps.linkRepo) {
        await this.deps.linkRepo.softDeleteByWorkspaceId(workspaceId, deletedAt, { tx });
      }

      // 5. Soft delete all recordings in workspace
      if (this.deps.recordingRepo) {
        await this.deps.recordingRepo.softDeleteByWorkspaceId(workspaceId, deletedAt, { tx });
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
   * Get restore info for a soft-deleted workspace
   * Used to display restoration confirmation UI
   * Returns restoration status based on configured grace period and max window:
   * - "possible": within grace period (full restoration, default 3 days)
   * - "partial": beyond grace period but within max window (partial restoration, default 30 days)
   * - "impossible": beyond max window or not deleted
   *
   * Does NOT throw errors for validation issues - returns descriptive status and reason
   * Only throws WORKSPACE_NOT_FOUND if workspace doesn't exist
   */
  async getWorkspaceRestoreInfo(workspaceId: string) {
    // 1. Get the workspace with deletion info
    const workspace = await this.deps.workspaceRepo.findByIdWithDeletionInfo(workspaceId);

    if (!workspace) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    // 2. Check if workspace is deleted
    if (!workspace.isDeleted) {
      return {
        restoration: 'impossible' as const,
        reason: 'Workspace is not deleted',
        workspace: {
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.workspaceName,
          isDeleted: workspace.isDeleted,
          deletedAt: null,
          deletedSince: null,
        },
        projectsToRestore: 0,
        linksToRestore: 0,
        membersToRestore: 0,
        recordingsToRestore: 0,
      };
    }

    // 3. Validate restoration time and determine restoration status
    if (!workspace.deletedAt) {
      return {
        restoration: 'impossible' as const,
        reason: 'Workspace deletion date not found',
        workspace: {
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.workspaceName,
          isDeleted: workspace.isDeleted,
          deletedAt: null,
          deletedSince: null,
        },
        projectsToRestore: 0,
        linksToRestore: 0,
        membersToRestore: 0,
        recordingsToRestore: 0,
      };
    }

    const deletedAt = new Date(workspace.deletedAt);
    const daysSinceDeletion = calculateDaysSince(deletedAt);
    const restoration = getRestorationStatus(daysSinceDeletion);
    const reason = getRestorationReason(restoration);

    // 4. Count projects, links, members, and recordings that will be restored
    // Only count if restoration is not impossible
    let projectsToRestore = 0;
    let linksToRestore = 0;
    let membersToRestore = 0;
    let recordingsToRestore = 0;

    if (restoration !== 'impossible') {
      if (this.deps.projectRepo) {
        projectsToRestore = await this.deps.projectRepo.countByWorkspaceIdAndDeletionTime(
          workspaceId,
          deletedAt
        );
      }

      if (this.deps.linkRepo) {
        linksToRestore = await this.deps.linkRepo.countByWorkspaceIdAndDeletionTime(
          workspaceId,
          deletedAt
        );
      }

      if (this.deps.workspaceMemberRepo) {
        membersToRestore = await this.deps.workspaceMemberRepo.countByWorkspaceIdAndDeletionTime(
          workspaceId,
          deletedAt
        );
      }

      if (this.deps.recordingRepo) {
        recordingsToRestore = await this.deps.recordingRepo.countByWorkspaceIdAndDeletionTime(
          workspaceId,
          deletedAt
        );
      }
    }

    return {
      restoration,
      reason,
      workspace: {
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        isDeleted: workspace.isDeleted,
        deletedAt: workspace.deletedAt ? workspace.deletedAt.toISOString() : null,
        deletedSince: Math.round(daysSinceDeletion * 10) / 10,
      },
      projectsToRestore,
      linksToRestore,
      membersToRestore,
      recordingsToRestore,
    };
  }

  /**
   * Restore a workspace with cascade restoration
   *
   * Why we can restore: When workspace/projects are deleted, recordings are NOT immediately deleted.
   * This allows restoration within grace period by simply toggling flags back.
   * No data loss occurs during restoration as recordings remain intact in database and storage.
   *
   * Transaction flow:
   * 1. Get the to be restored workspace
   * 2. If workspace is not deleted, return it (idempotent - already in desired state)
   * 3. Validate restoration is within configured max window
   * 4. If beyond max window, throw WORKSPACE_RESTORE_TIME_EXPIRED (410)
   * 5. Restore workspace (isDeleted = false, deletedAt = null)
   * 6. Use original deletedAt timestamp to find and restore associated projects
   * 7. Use original deletedAt timestamp to find and restore associated links
   * 8. Best effort: Don't fail if some entities can't be restored
   * 9. If workspace restoration fails, throw WORKSPACE_RESTORE_FAILED (500)
   *
   * Restoration status is determined by grace period (full) vs beyond grace (partial)
   * Window configured via RESTORATION_GRACE_PERIOD_DAYS and RESTORATION_MAX_WINDOW_DAYS env vars
   *
   * Idempotent: If workspace is already active, returns 200 with workspace data
   *
   * Throws WORKSPACE_NOT_FOUND (404) if workspace not found
   * Throws WORKSPACE_RESTORE_TIME_EXPIRED (410) if restoration window has expired
   * Throws WORKSPACE_RESTORE_FAILED (500) if restoration operation fails
   */
  async restoreWorkspace(workspaceId: string, options?: { tx?: Transaction }) {
    // 1. Get the workspace with deletion info
    const workspace = await this.deps.workspaceRepo.findByIdWithDeletionInfo(workspaceId);

    if (!workspace) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    // 2. Idempotent: If workspace is not deleted, it's already in the desired state
    // Return it successfully with current active resource counts
    if (!workspace.isDeleted) {
      let activeProjects = 0;
      if (this.deps.projectRepo) {
        activeProjects = await this.deps.projectRepo.countByWorkspace(workspaceId);
      }

      let activeLinks = 0;
      if (this.deps.linkRepo) {
        activeLinks = await this.deps.linkRepo.countByWorkspace(workspaceId);
      }

      let activeMembers = 0;
      if (this.deps.workspaceMemberRepo) {
        activeMembers = await this.deps.workspaceMemberRepo.countByWorkspace(workspaceId);
      }

      let activeRecordings = 0;
      if (this.deps.recordingRepo) {
        activeRecordings = await this.deps.recordingRepo.countByWorkspace(workspaceId);
      }

      return {
        restorationStatus: 'possible' as const,
        workspace,
        restoredProjects: activeProjects,
        restoredLinks: activeLinks,
        restoredMembers: activeMembers,
        restoredRecordings: activeRecordings,
      };
    }

    // 3. Validate restoration time (configured maximum window)
    if (!workspace.deletedAt) {
      throw workspaceError.WORKSPACE_RESTORE_FAILED();
    }

    const deletedAt = new Date(workspace.deletedAt);
    const daysSinceDeletion = calculateDaysSince(deletedAt);
    const restorationStatus = getRestorationStatus(daysSinceDeletion);
    const maxWindowDays = getRestorationMaxWindowDays();

    if (restorationStatus === 'impossible') {
      throw workspaceError.WORKSPACE_RESTORE_TIME_EXPIRED({
        deletedAt: deletedAt.toISOString(),
        daysSinceDeletion,
        restorationWindowDays: maxWindowDays,
      });
    }

    // Use transaction for atomic restoration
    const performRestoration = async (tx: Transaction) => {
      // 4. Restore the workspace
      const restored = await this.deps.workspaceRepo.restore(workspaceId, { tx });

      if (!restored) {
        throw workspaceError.WORKSPACE_RESTORE_FAILED();
      }

      // 5. Restore associated projects (best effort)
      // Only restore projects that were deleted at the exact same time as the workspace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let restoredProjects: any[] = [];
      if (this.deps.projectRepo) {
        try {
          restoredProjects = await this.deps.projectRepo.restoreByWorkspaceIdAndDeletionTime(
            workspaceId,
            deletedAt,
            { tx }
          );
        } catch (error) {
          // Log but don't fail - best effort
          console.error('Error restoring workspace projects:', error);
        }
      }

      // 6. Restore associated links (best effort)
      // Only restore links that were deleted at the exact same time as the workspace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let restoredLinks: any[] = [];
      if (this.deps.linkRepo) {
        try {
          restoredLinks = await this.deps.linkRepo.restoreByWorkspaceIdAndDeletionTime(
            workspaceId,
            deletedAt,
            { tx }
          );
        } catch (error) {
          // Log but don't fail - best effort
          console.error('Error restoring workspace links:', error);
        }
      }

      // 7. Restore all workspace members (best effort)
      // Only restore members that were deleted at the exact same time as the workspace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let restoredMembers: any[] = [];
      if (this.deps.workspaceMemberRepo) {
        try {
          restoredMembers = await this.deps.workspaceMemberRepo.restoreByWorkspaceIdAndDeletionTime(
            workspaceId,
            deletedAt,
            { tx }
          );
        } catch (error) {
          // Log but don't fail - best effort
          console.error('Error restoring workspace members:', error);
        }
      }

      // 8. Restore associated recordings (best effort)
      // Only restore recordings that were deleted at the exact same time as the workspace
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let restoredRecordings: any[] = [];
      if (this.deps.recordingRepo) {
        try {
          restoredRecordings = await this.deps.recordingRepo.restoreByWorkspaceIdAndDeletionTime(
            workspaceId,
            deletedAt,
            { tx }
          );
        } catch (error) {
          // Log but don't fail - best effort
          console.error('Error restoring workspace recordings:', error);
        }
      }

      return {
        restorationStatus,
        workspace: restored,
        restoredProjects: restoredProjects.length,
        restoredLinks: restoredLinks.length,
        restoredMembers: restoredMembers.length,
        restoredRecordings: restoredRecordings.length,
      };
    };

    // Execute in provided transaction or create new one
    if (options?.tx) {
      return performRestoration(options.tx);
    }

    return this.deps.db.transaction(performRestoration);
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
      throw workspaceError.WORKSPACE_SEARCH_TERM_REQUIRED();
    }

    switch (type) {
      case 'members': {
        if (!this.deps.workspaceMemberRepo) {
          throw workspaceError.WORKSPACE_SEARCH_UNAVAILABLE();
        }
        return this.deps.workspaceMemberRepo.searchByName(workspaceId, searchTerms, limit);
      }
      case 'projects': {
        if (!this.deps.projectRepo) {
          throw workspaceError.WORKSPACE_SEARCH_UNAVAILABLE();
        }
        return this.deps.projectRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      case 'domains': {
        if (!this.deps.domainRepo) {
          throw workspaceError.WORKSPACE_SEARCH_UNAVAILABLE();
        }
        return this.deps.domainRepo.searchByUrl(workspaceId, searchTerms, limit);
      }
      case 'links': {
        if (!this.deps.linkRepo) {
          throw workspaceError.WORKSPACE_SEARCH_UNAVAILABLE();
        }
        return this.deps.linkRepo.searchByTitle(workspaceId, searchTerms, limit);
      }
      default:
        throw workspaceError.WORKSPACE_SEARCH_TYPE_INVALID();
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
        throw workspaceError.WORKSPACE_GONE();
      }
      throw workspaceError.WORKSPACE_NOT_FOUND();
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
          throw workspaceError.WORKSPACE_INVITE_POLICY_TOO_MANY_DOMAINS();
        }

        // Check for disposable email domains
        const disposableDomains = normalizedDomains.filter((d) => isDisposableEmailDomain(d));
        if (disposableDomains.length > 0) {
          throw workspaceError.WORKSPACE_INVITE_POLICY_DISPOSABLE_DOMAIN({
            disposableDomains,
          });
        }

        domainsString = normalizedDomains.join(',');
      }
      // Require at least one domain for whitelisted/protected policies
      if (!domainsString) {
        throw workspaceError.WORKSPACE_INVITE_POLICY_DOMAINS_REQUIRED();
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
      throw workspaceError.WORKSPACE_NOT_FOUND();
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
        throw workspaceError.WORKSPACE_GONE();
      }
      throw workspaceError.WORKSPACE_NOT_FOUND();
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

  /**
   * Get workspace status and access info for a user
   * Handles soft-deleted workspaces gracefully by returning status instead of throwing
   * Used by frontend to determine what UI to show for workspace access gate
   *
   * Returns:
   * - 'member' if user is already a member
   * - 'can_join' if workspace is whitelisted and domain matches
   * - 'can_request' if workspace is protected and domain matches
   * - 'no_access' if workspace is private or domain doesn't match
   *
   * Throws WORKSPACE_NOT_FOUND only if workspace truly doesn't exist
   */
  async getStatus(workspaceId: string, userId: string, userEmail: string) {
    // 1. Check if workspace exists at all (including soft-deleted)
    const isDeleted = await this.deps.workspaceRepo.isSoftDeleted(workspaceId);

    // Workspace doesn't exist at all
    if (isDeleted === null) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    // Workspace is soft-deleted - return minimal info
    if (isDeleted === true) {
      return {
        workspaceId,
        workspaceName: 'Deleted Workspace',
        isDeleted: true,
        invitePolicy: null,
        accessStatus: 'no_access' as const,
      };
    }

    // 2. Get workspace with invite policy
    const workspace = await this.deps.workspaceRepo.findWithInvitePolicyById(workspaceId);
    if (!workspace) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
    }

    // Parse domains
    const allowedDomains = workspace.workspaceInviteDomains
      ? workspace.workspaceInviteDomains.split(',').map((d: string) => d.trim().toLowerCase())
      : [];

    // 3. Check membership
    if (this.deps.workspaceMemberRepo) {
      const member = await this.deps.workspaceMemberRepo.findByUserAndWorkspace(
        userId,
        workspaceId
      );

      if (member) {
        return {
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.workspaceName,
          isDeleted: false,
          invitePolicy: workspace.workspaceInvitePolicy,
          accessStatus: 'member' as const,
        };
      }
    }

    // 4. Non-member - determine access based on policy
    if (workspace.workspaceInvitePolicy === 'private') {
      return {
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        isDeleted: false,
        invitePolicy: workspace.workspaceInvitePolicy,
        accessStatus: 'no_access' as const,
      };
    }

    // 5. Check domain match for whitelisted/protected
    const userDomain = userEmail.split('@')[1]?.toLowerCase();
    const domainMatches =
      userDomain && allowedDomains.some((d: string) => d.toLowerCase() === userDomain);

    if (!domainMatches) {
      return {
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        isDeleted: false,
        invitePolicy: workspace.workspaceInvitePolicy,
        accessStatus: 'no_access' as const,
      };
    }

    // 6. Domain matches - return action based on policy
    return {
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      isDeleted: false,
      invitePolicy: workspace.workspaceInvitePolicy,
      accessStatus:
        workspace.workspaceInvitePolicy === 'whitelisted'
          ? ('can_join' as const)
          : ('can_request' as const),
    };
  }
}
