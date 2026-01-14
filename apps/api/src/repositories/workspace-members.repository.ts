/**
 * WorkspaceMemberRepository - Data access layer for workspace members
 * Handles all database operations for workspace member entities
 */

import { eq, and, count, sql, asc, ilike } from '@workspace/db';
import type { DbClient, WorkspaceRole } from '@workspace/db';
import { workspaceMembers, user } from '@workspace/db';
import type { Transaction, CreateWorkspaceMemberInput } from '@/api/types';

export class WorkspaceMemberRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new workspace member
   */
  async create(data: CreateWorkspaceMemberInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [member] = await dbClient
      .insert(workspaceMembers)
      .values({
        workspaceMemberId: data.workspaceMemberId,
        userId: data.userId,
        workspaceId: data.workspaceId,
        workspaceRole: data.workspaceRole,
        isDeleted: false,
      })
      .returning();

    return member;
  }

  /**
   * Find member by user ID and workspace ID
   */
  async findByUserAndWorkspace(userId: string, workspaceId: string) {
    const [member] = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.isDeleted, false)
        )
      )
      .limit(1);

    return member || null;
  }

  /**
   * Find member by user ID and workspace ID, including soft-deleted ones
   */
  async findByUserAndWorkspaceIncludingDeleted(userId: string, workspaceId: string) {
    const [member] = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId))
      )
      .limit(1);

    return member || null;
  }

  /**
   * Update member role
   */
  async updateRole(memberId: string, newRole: WorkspaceRole, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(workspaceMembers)
      .set({ workspaceRole: newRole })
      .where(
        and(eq(workspaceMembers.workspaceMemberId, memberId), eq(workspaceMembers.isDeleted, false))
      )
      .returning();

    return updated;
  }

  /**
   * Find members of a workspace with user details, sorted by role and paginated
   * Sorting: owner (0) > admin (1) > member (2)
   */
  async findByWorkspaceWithUsersPaginated(workspaceId: string, limit: number, offset: number) {
    // Use CASE expression to order by role priority: owner=0, admin=1, member=2
    const roleOrderSql = sql`CASE 
      WHEN ${workspaceMembers.workspaceRole} = 'owner' THEN 0 
      WHEN ${workspaceMembers.workspaceRole} = 'admin' THEN 1 
      ELSE 2 
    END`;

    const members = await this.db
      .select({
        workspaceMemberId: workspaceMembers.workspaceMemberId,
        role: workspaceMembers.workspaceRole,
        userName: user.name,
        userEmail: user.email,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.isDeleted, false))
      )
      .orderBy(asc(roleOrderSql))
      .limit(limit)
      .offset(offset);

    return members;
  }

  /**
   * Count total members in a workspace
   */
  async countByWorkspace(workspaceId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.isDeleted, false))
      );

    return Number(result?.count || 0);
  }

  /**
   * Count owners in a workspace
   * Used to ensure at least one owner remains
   */
  async countOwnersByWorkspace(workspaceId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.workspaceRole, 'owner'),
          eq(workspaceMembers.isDeleted, false)
        )
      );

    return Number(result?.count || 0);
  }

  /**
   * Find all owners of a workspace with their email addresses
   * Used for sending notifications to workspace owners
   */
  async findOwnersByWorkspace(workspaceId: string) {
    const owners = await this.db
      .select({
        userId: workspaceMembers.userId,
        email: user.email,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.workspaceRole, 'owner'),
          eq(workspaceMembers.isDeleted, false)
        )
      );

    return owners;
  }

  /**
   * Find member by ID
   */
  async findById(memberId: string) {
    const [member] = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceMemberId, memberId), eq(workspaceMembers.isDeleted, false))
      )
      .limit(1);

    return member || null;
  }

  /**
   * Find member by ID with user details
   */
  async findByIdWithUser(memberId: string) {
    const [member] = await this.db
      .select({
        workspaceMemberId: workspaceMembers.workspaceMemberId,
        userId: workspaceMembers.userId,
        workspaceId: workspaceMembers.workspaceId,
        role: workspaceMembers.workspaceRole,
        userName: user.name,
        userEmail: user.email,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(eq(workspaceMembers.workspaceMemberId, memberId), eq(workspaceMembers.isDeleted, false))
      )
      .limit(1);

    return member || null;
  }

  /**
   * Soft delete a workspace member
   */
  async softDelete(memberId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(workspaceMembers)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(
        and(eq(workspaceMembers.workspaceMemberId, memberId), eq(workspaceMembers.isDeleted, false))
      )
      .returning();

    return deleted || null;
  }

  /**
   * Restore a soft-deleted workspace member
   * Resets isDeleted to false and clears deletedAt
   */
  async restore(memberId: string, newRole: WorkspaceRole, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [restored] = await dbClient
      .update(workspaceMembers)
      .set({
        isDeleted: false,
        deletedAt: null,
        workspaceRole: newRole,
      })
      .where(
        and(eq(workspaceMembers.workspaceMemberId, memberId), eq(workspaceMembers.isDeleted, true))
      )
      .returning();

    return restored || null;
  }

  /**
   * Update notification preferences for a workspace member
   */
  async updateNotificationPreferences(
    memberId: string,
    preferences: Partial<{
      notifyOnLinkUsage: boolean;
      notifyOnQuotaReset: boolean;
      notifyOnQuotaLimit: boolean;
      notifyOnInviteAccepted: boolean;
      notifyOnMemberJoin: boolean;
    }>,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(workspaceMembers)
      .set(preferences)
      .where(
        and(eq(workspaceMembers.workspaceMemberId, memberId), eq(workspaceMembers.isDeleted, false))
      )
      .returning();

    return updated || null;
  }

  /**
   * Search workspace members by name
   * Uses case-insensitive ILIKE pattern matching on user name
   */
  async searchByName(workspaceId: string, searchTerms: string[], limit: number) {
    const conditions = [
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.isDeleted, false),
    ];

    // Add ILIKE conditions for each search term
    // Each term must match somewhere in the name (AND logic)
    for (const term of searchTerms) {
      conditions.push(ilike(user.name, `%${term}%`));
    }

    const members = await this.db
      .select({
        workspaceMemberId: workspaceMembers.workspaceMemberId,
        role: workspaceMembers.workspaceRole,
        userName: user.name,
        userEmail: user.email,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(and(...conditions))
      .limit(limit);

    return members;
  }
}
