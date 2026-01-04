/**
 * AdminRepository - Data access layer for admin operations
 * Handles database queries for user management with workspace and session data
 */

import { eq, and, or, ilike, desc, asc, count, sql } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { user, session, workspaceMembers, workspaces } from '@workspace/db';

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  emailVerified: boolean;
  createdAt: Date;
  workspaceCount: number;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUserWorkspace {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface AdminUserSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  impersonatedBy: string | null;
}

export interface SearchUsersParams {
  search?: string;
  limit: number;
  offset: number;
  sortBy: 'createdAt' | 'name' | 'email';
  sortDirection: 'asc' | 'desc';
  filterStatus?: 'active' | 'banned';
  /** Admin user IDs to exclude from results */
  adminUserIds?: string[];
}

export class AdminRepository {
  constructor(private db: DbClient) {}

  /**
   * Search users with workspace and session counts
   * Only returns non-admin users (excludes users with role='admin' or in adminUserIds)
   */
  async searchUsers(
    params: SearchUsersParams
  ): Promise<{ users: AdminUserListItem[]; total: number }> {
    const {
      search,
      limit,
      offset,
      sortBy,
      sortDirection,
      filterStatus,
      adminUserIds = [],
    } = params;

    // Build WHERE conditions
    const conditions = [];

    // Always exclude admins - by role or by ID
    conditions.push(or(sql`${user.role} IS NULL`, sql`${user.role} != 'admin'`));

    // Exclude admin user IDs if provided
    if (adminUserIds.length > 0) {
      conditions.push(
        sql`${user.id} NOT IN (${sql.join(
          adminUserIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    }

    if (search) {
      conditions.push(or(ilike(user.email, `%${search}%`), ilike(user.name, `%${search}%`)));
    }

    // Filter by status (active = not banned, banned = banned)
    if (filterStatus === 'banned') {
      conditions.push(eq(user.banned, true));
    } else if (filterStatus === 'active') {
      conditions.push(or(eq(user.banned, false), sql`${user.banned} IS NULL`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await this.db.select({ count: count() }).from(user).where(whereClause);

    const total = countResult?.count ?? 0;

    // Build sort order
    const sortColumn =
      sortBy === 'createdAt' ? user.createdAt : sortBy === 'name' ? user.name : user.email;
    const orderBy = sortDirection === 'desc' ? desc(sortColumn) : asc(sortColumn);

    // Get users with subquery counts
    const usersResult = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        workspaceCount: sql<number>`(
          SELECT COUNT(*)::int FROM workspace_members wm
          WHERE wm.user_id = ${user.id} AND wm.is_deleted = false
        )`.as('workspace_count'),
      })
      .from(user)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      users: usersResult.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        banned: u.banned,
        banReason: u.banReason,
        banExpires: u.banExpires,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        workspaceCount: u.workspaceCount,
      })),
      total,
    };
  }

  /**
   * Get user by ID
   */
  async findUserById(userId: string): Promise<AdminUserDetail | null> {
    const [foundUser] = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return foundUser || null;
  }

  /**
   * Get user workspaces with pagination
   */
  async getUserWorkspaces(
    userId: string,
    options: { limit: number; offset: number } = { limit: 10, offset: 0 }
  ): Promise<{ workspaces: AdminUserWorkspace[]; total: number }> {
    const { limit, offset } = options;

    // Get total count
    const [countResult] = await this.db
      .select({ count: count() })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      );

    const total = countResult?.count ?? 0;

    // Get paginated workspaces
    const result = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        workspaceRole: workspaceMembers.workspaceRole,
        joinedAt: workspaceMembers.createdAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      )
      .orderBy(desc(workspaceMembers.createdAt))
      .limit(limit)
      .offset(offset);

    return { workspaces: result, total };
  }

  /**
   * Get user workspace count
   */
  async getUserWorkspaceCount(userId: string): Promise<number> {
    const [countResult] = await this.db
      .select({ count: count() })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      );

    return countResult?.count ?? 0;
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<AdminUserSession[]> {
    const result = await this.db
      .select({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        impersonatedBy: session.impersonatedBy,
      })
      .from(session)
      .where(eq(session.userId, userId))
      .orderBy(desc(session.createdAt));

    return result;
  }

  /**
   * Get active sessions for a user with pagination
   */
  async getActiveUserSessions(
    userId: string,
    options: { limit: number; offset: number } = { limit: 5, offset: 0 }
  ): Promise<{ sessions: AdminUserSession[]; total: number }> {
    const { limit, offset } = options;

    // Get total count
    const [countResult] = await this.db
      .select({ count: count() })
      .from(session)
      .where(and(eq(session.userId, userId), sql`${session.expiresAt} > NOW()`));

    const total = countResult?.count ?? 0;

    // Get paginated sessions
    const result = await this.db
      .select({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        impersonatedBy: session.impersonatedBy,
      })
      .from(session)
      .where(and(eq(session.userId, userId), sql`${session.expiresAt} > NOW()`))
      .orderBy(desc(session.createdAt))
      .limit(limit)
      .offset(offset);

    return { sessions: result, total };
  }

  /**
   * Get session by ID
   */
  async findSessionById(
    sessionId: string
  ): Promise<{ id: string; userId: string; token: string } | null> {
    const [foundSession] = await this.db
      .select({
        id: session.id,
        userId: session.userId,
        token: session.token,
      })
      .from(session)
      .where(eq(session.id, sessionId))
      .limit(1);

    return foundSession || null;
  }

  /**
   * Delete session by ID
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await this.db
      .delete(session)
      .where(eq(session.id, sessionId))
      .returning({ id: session.id });

    return result.length > 0;
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    const result = await this.db
      .delete(session)
      .where(eq(session.userId, userId))
      .returning({ id: session.id });

    return result.length;
  }

  /**
   * Ban user
   */
  async banUser(
    userId: string,
    reason?: string,
    expiresAt?: Date
  ): Promise<AdminUserDetail | null> {
    const [updated] = await this.db
      .update(user)
      .set({
        banned: true,
        banReason: reason || null,
        banExpires: expiresAt || null,
      })
      .where(eq(user.id, userId))
      .returning();

    if (!updated) return null;

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      role: updated.role,
      banned: updated.banned,
      banReason: updated.banReason,
      banExpires: updated.banExpires,
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Unban user
   */
  async unbanUser(userId: string): Promise<AdminUserDetail | null> {
    const [updated] = await this.db
      .update(user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
      })
      .where(eq(user.id, userId))
      .returning();

    if (!updated) return null;

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      role: updated.role,
      banned: updated.banned,
      banReason: updated.banReason,
      banExpires: updated.banExpires,
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
