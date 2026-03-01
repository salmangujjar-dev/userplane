/**
 * WorkspaceRepository - Data access layer for workspaces
 * Handles all database operations for workspace entities
 */

import type { DbClient, WorkspaceInvitePolicy, WorkspaceRole } from '@userplane/db';
import { and, count, eq, ilike, ne, notInArray, or, sql } from '@userplane/db';
import { workspaceMembers, workspaces } from '@userplane/db';

import type { CreateWorkspaceInput, Transaction } from '@/api/types';

export class WorkspaceRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new workspace
   */
  async create(data: CreateWorkspaceInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [workspace] = await dbClient
      .insert(workspaces)
      .values({
        workspaceId: data.workspaceId,
        workspaceName: data.workspaceName,
        recordingSlug: data.recordingSlug,
        workspaceInviteToken: data.workspaceInviteToken,
        workspaceInvitePolicy: data.workspaceInvitePolicy,
        workspaceInviteDomains: data.workspaceInviteDomains,
        recordingCompanyName: data.recordingCompanyName,
        recordingHeader: data.recordingHeader,
        recordingFootnote: data.recordingFootnote,
        recordingPrimaryColor: data.recordingPrimaryColor,
        recordingMaxDurationMs: data.recordingMaxDurationMs,
        isDeleted: false,
      })
      .returning();

    if (!workspace) {
      throw new Error('Failed to create workspace');
    }

    return workspace;
  }

  /**
   * Find workspace by ID
   * Returns only basic workspace info
   */
  async findById(workspaceId: string) {
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }

  /**
   * Check if workspace is soft-deleted
   * Returns true if workspace exists but is marked as deleted
   */
  async isSoftDeleted(workspaceId: string) {
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        isDeleted: workspaces.isDeleted,
      })
      .from(workspaces)
      .where(eq(workspaces.workspaceId, workspaceId))
      .limit(1);

    return workspace ? workspace.isDeleted : null;
  }

  /**
   * Find workspace preferences by ID
   * Returns recording-related settings
   * Note: Recording toggle settings (hideSensitive, captureClientLog, captureServerLog) moved to domain level
   */
  async findPreferencesById(workspaceId: string) {
    const [preferences] = await this.db
      .select({
        recordingSlug: workspaces.recordingSlug,
        recordingCustomizeLink: workspaces.recordingCustomizeLink,
        recordingCompanyName: workspaces.recordingCompanyName,
        recordingCompanyLogoPath: workspaces.recordingCompanyLogoPath,
        recordingHeader: workspaces.recordingHeader,
        recordingFootnote: workspaces.recordingFootnote,
        recordingPrimaryColor: workspaces.recordingPrimaryColor,
        recordingMaxDurationMs: workspaces.recordingMaxDurationMs,
      })
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .limit(1);

    return preferences || null;
  }

  /**
   * Find workspace by recording slug
   * Note: API endpoints should use workspace ID instead
   * This method is kept for recorder/share apps that resolve by slug
   */
  async findBySlug(slug: string) {
    const [workspace] = await this.db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.recordingSlug, slug), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }

  /**
   * Find workspace by invite token
   */
  async findByInviteToken(token: string) {
    const [workspace] = await this.db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.workspaceInviteToken, token), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }

  /**
   * Get workspace invite token by ID
   */
  async findInviteTokenById(workspaceId: string) {
    const [workspace] = await this.db
      .select({
        workspaceInviteToken: workspaces.workspaceInviteToken,
      })
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }

  /**
   * Update workspace invite token
   */
  async updateInviteToken(workspaceId: string, newToken: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [workspace] = await dbClient
      .update(workspaces)
      .set({ workspaceInviteToken: newToken })
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .returning();

    return workspace || null;
  }

  /**
   * Find all workspaces for a user (via workspace membership)
   * Returns only essential fields for listing
   */
  async findByUserId(
    userId: string,
    options?: {
      includeWorkspaceMembership?: boolean;
    }
  ) {
    const includeMembership = options?.includeWorkspaceMembership || false;

    // Build the select object dynamically based on options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectFields: any = {
      workspaceId: workspaces.workspaceId,
      workspaceName: workspaces.workspaceName,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    };

    if (includeMembership) {
      selectFields.workspaceMembership = {
        workspaceMemberId: workspaceMembers.workspaceMemberId,
        workspaceRole: workspaceMembers.workspaceRole,
        workspaceJoinedAt: workspaceMembers.createdAt,
      };
    }

    const result = await this.db
      .select(selectFields)
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.workspaceId, workspaceMembers.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaces.isDeleted, false),
          eq(workspaceMembers.isDeleted, false)
        )
      );

    return result;
  }

  /**
   * Count total workspaces for a user
   */
  async countByUserId(userId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.workspaceId, workspaceMembers.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaces.isDeleted, false),
          eq(workspaceMembers.isDeleted, false)
        )
      );

    return Number(result?.count || 0);
  }

  /**
   * Count total workspaces for a user with role-based filtering
   * Filters by workspace role(s) when provided
   */
  async countByUserIdWithRoleFilter(userId: string, roles?: WorkspaceRole[]) {
    const conditions = [
      eq(workspaceMembers.userId, userId),
      eq(workspaces.isDeleted, false),
      eq(workspaceMembers.isDeleted, false),
    ];

    // Add role filtering if roles array is provided and not empty
    if (roles && roles.length > 0) {
      if (roles.length === 1) {
        const role = roles[0];
        if (role) {
          conditions.push(eq(workspaceMembers.workspaceRole, role));
        }
      } else {
        const roleConditions = roles.map((role) => eq(workspaceMembers.workspaceRole, role));
        conditions.push(or(...roleConditions)!);
      }
    }

    const [result] = await this.db
      .select({ count: count() })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.workspaceId, workspaceMembers.workspaceId))
      .where(and(...conditions));

    return Number(result?.count || 0);
  }

  /**
   * Find workspaces for a user with pagination
   */
  async findByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number,
    options?: {
      includeWorkspaceMembership?: boolean;
    }
  ) {
    const includeMembership = options?.includeWorkspaceMembership || false;

    // Select all needed fields from both tables
    const result = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        workspaceMemberId: workspaceMembers.workspaceMemberId,
        workspaceRole: workspaceMembers.workspaceRole,
        workspaceJoinedAt: workspaceMembers.createdAt,
      })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.workspaceId, workspaceMembers.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaces.isDeleted, false),
          eq(workspaceMembers.isDeleted, false)
        )
      )
      .limit(limit)
      .offset(offset);

    // Map the result to the expected structure based on options
    return result.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const workspace: any = {
        workspaceId: row.workspaceId,
        workspaceName: row.workspaceName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      if (includeMembership) {
        workspace.workspaceMembership = {
          workspaceMemberId: row.workspaceMemberId,
          workspaceRole: row.workspaceRole,
          workspaceJoinedAt: row.workspaceJoinedAt,
        };
      }

      return workspace;
    });
  }

  /**
   * Update workspace preferences
   * Updates recording-related settings
   * Note: Recording toggle settings (hideSensitive, captureClientLog, captureServerLog) moved to domain level
   */
  async updatePreferences(
    workspaceId: string,
    data: Partial<{
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
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(workspaces)
      .set(data)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .returning();

    return updated || null;
  }

  /**
   * Update workspace name
   * Updates the workspace name field
   */
  async updateName(workspaceId: string, newName: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(workspaces)
      .set({ workspaceName: newName })
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .returning({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      });

    return updated || null;
  }

  /**
   * Soft delete a workspace
   * Sets isDeleted to true and updates deletedAt timestamp
   */
  async softDelete(workspaceId: string, deletedAt: Date, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(workspaces)
      .set({
        isDeleted: true,
        deletedAt: deletedAt,
      })
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .returning();

    return deleted || null;
  }

  /**
   * Restore a soft-deleted workspace
   * Resets isDeleted to false and clears deletedAt
   * Used for workspace restoration within grace period
   */
  async restore(workspaceId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [restored] = await dbClient
      .update(workspaces)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, true)))
      .returning();

    return restored || null;
  }

  /**
   * Get workspace with deletion timestamp
   * Used for restoration to identify associated entities deleted at same time
   */
  async findByIdWithDeletionInfo(workspaceId: string) {
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        isDeleted: workspaces.isDeleted,
        deletedAt: workspaces.deletedAt,
      })
      .from(workspaces)
      .where(eq(workspaces.workspaceId, workspaceId))
      .limit(1);

    return workspace || null;
  }

  /**
   * Get workspace invite policy settings
   */
  async findInvitePolicyById(workspaceId: string) {
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceInvitePolicy: workspaces.workspaceInvitePolicy,
        workspaceInviteDomains: workspaces.workspaceInviteDomains,
      })
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }

  /**
   * Update workspace invite policy settings
   */
  async updateInvitePolicy(
    workspaceId: string,
    data: {
      workspaceInvitePolicy: WorkspaceInvitePolicy;
      workspaceInviteDomains: string | null;
    },
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(workspaces)
      .set({
        workspaceInvitePolicy: data.workspaceInvitePolicy,
        workspaceInviteDomains: data.workspaceInviteDomains,
      })
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .returning({
        workspaceId: workspaces.workspaceId,
        workspaceInvitePolicy: workspaces.workspaceInvitePolicy,
        workspaceInviteDomains: workspaces.workspaceInviteDomains,
      });

    return updated || null;
  }

  /**
   * Find workspaces that match a user's email domain with pagination
   * Used for suggesting workspaces to users without any workspaces
   * Excludes private workspaces and workspaces user is already a member of
   */
  async findByEmailDomain(
    emailDomain: string,
    excludeUserId: string,
    page: number = 1,
    perPage: number = 5
  ) {
    // First, get workspaces where user is already a member
    const existingMemberships = await this.db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.userId, excludeUserId), eq(workspaceMembers.isDeleted, false))
      );

    const memberWorkspaceIds = existingMemberships.map((m) => m.workspaceId);

    // Search for workspaces where:
    // 1. Invite policy is not private
    // 2. The invite domains contain the user's email domain
    // 3. User is not already a member
    const baseQuery = this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        workspaceInvitePolicy: workspaces.workspaceInvitePolicy,
      })
      .from(workspaces)
      .where(
        and(
          eq(workspaces.isDeleted, false),
          ne(workspaces.workspaceInvitePolicy, 'private'),
          ilike(workspaces.workspaceInviteDomains, `%${emailDomain}%`),
          memberWorkspaceIds.length > 0
            ? notInArray(workspaces.workspaceId, memberWorkspaceIds)
            : undefined
        )
      );

    // Get total count
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(workspaces)
      .where(
        and(
          eq(workspaces.isDeleted, false),
          ne(workspaces.workspaceInvitePolicy, 'private'),
          ilike(workspaces.workspaceInviteDomains, `%${emailDomain}%`),
          memberWorkspaceIds.length > 0
            ? notInArray(workspaces.workspaceId, memberWorkspaceIds)
            : undefined
        )
      );

    const total = countResult?.count || 0;

    // Get paginated results
    const offset = (page - 1) * perPage;
    const results = await baseQuery.limit(perPage).offset(offset);

    return {
      workspaces: results,
      total,
    };
  }

  /**
   * Get workspace with invite policy by ID (for join flow)
   */
  async findWithInvitePolicyById(workspaceId: string) {
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        workspaceInvitePolicy: workspaces.workspaceInvitePolicy,
        workspaceInviteDomains: workspaces.workspaceInviteDomains,
      })
      .from(workspaces)
      .where(and(eq(workspaces.workspaceId, workspaceId), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }
}
