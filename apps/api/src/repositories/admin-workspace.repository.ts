/**
 * AdminWorkspaceRepository - Data access layer for admin workspace operations
 * Handles database queries for workspace management with counts for related entities
 */

import type { DbClient } from '@workspace/db';
import { and, asc, count, desc, eq, ilike, or, sql } from '@workspace/db';
import { projects, user, workspaceMembers, workspaces } from '@workspace/db';
import type { PlanId } from '@workspace/pricing';

export interface AdminWorkspaceListItem {
  workspaceId: string;
  workspaceName: string;
  workspacePlan: PlanId;
  createdAt: Date;
  memberCount: number;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
  isDeleted: boolean;
}

export interface AdminWorkspaceDetail {
  workspaceId: string;
  workspaceName: string;
  workspacePlan: PlanId;
  createdAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
}

export interface AdminWorkspaceMember {
  userId: string;
  userName: string;
  userEmail: string;
  workspaceRole: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface AdminWorkspaceProject {
  projectId: string;
  projectTitle: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  recordingCount: number;
}

export type ProjectSortField = 'created_at' | 'project_title' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface SearchWorkspaceProjectsParams {
  workspaceId: string;
  search?: string;
  limit: number;
  offset: number;
  sortBy: ProjectSortField;
  sortDirection: SortDirection;
  filterStatus: 'all' | 'active' | 'deleted';
}

export interface SearchWorkspacesParams {
  search?: string;
  limit: number;
  offset: number;
  sortBy: 'createdAt' | 'name' | 'memberCount';
  sortDirection: 'asc' | 'desc';
  filterStatus?: 'active' | 'deleted';
  filterPlan?: PlanId;
}

export class AdminWorkspaceRepository {
  constructor(private db: DbClient) {}

  /**
   * Search workspaces with entity counts
   * Searches by workspace name or workspace ID (case-insensitive)
   */
  async searchWorkspaces(
    params: SearchWorkspacesParams
  ): Promise<{ workspaces: AdminWorkspaceListItem[]; total: number }> {
    const { search, limit, offset, sortBy, sortDirection, filterStatus, filterPlan } = params;

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      // Search by workspace name or workspace ID
      conditions.push(
        or(
          ilike(workspaces.workspaceName, `%${search}%`),
          ilike(workspaces.workspaceId, `%${search}%`)
        )
      );
    }

    if (filterStatus === 'active') {
      conditions.push(eq(workspaces.isDeleted, false));
    } else if (filterStatus === 'deleted') {
      conditions.push(eq(workspaces.isDeleted, true));
    }

    if (filterPlan) {
      conditions.push(eq(workspaces.workspacePlan, filterPlan));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await this.db
      .select({ count: count() })
      .from(workspaces)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Build sort order - for memberCount we need a subquery
    let orderBy;
    if (sortBy === 'memberCount') {
      // Sort by member count using subquery
      const memberCountSubquery = sql<number>`(
        SELECT COUNT(*)::int FROM workspace_members wm
        WHERE wm.workspace_id = ${workspaces.workspaceId} AND wm.is_deleted = false
      )`;
      orderBy = sortDirection === 'desc' ? desc(memberCountSubquery) : asc(memberCountSubquery);
    } else if (sortBy === 'name') {
      orderBy =
        sortDirection === 'desc' ? desc(workspaces.workspaceName) : asc(workspaces.workspaceName);
    } else {
      orderBy = sortDirection === 'desc' ? desc(workspaces.createdAt) : asc(workspaces.createdAt);
    }

    // Get workspaces with subquery counts
    const workspacesResult = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        workspacePlan: workspaces.workspacePlan,
        createdAt: workspaces.createdAt,
        isDeleted: workspaces.isDeleted,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int FROM workspace_members wm
          WHERE wm.workspace_id = workspaces.workspace_id AND wm.is_deleted = false
        )`.as('member_count'),
        projectCount: sql<number>`(
          SELECT COUNT(*)::int FROM projects p
          WHERE p.workspace_id = workspaces.workspace_id AND p.is_deleted = false
        )`.as('project_count'),
        domainCount: sql<number>`(
          SELECT COUNT(*)::int FROM domains d
          WHERE d.workspace_id = workspaces.workspace_id AND d.is_deleted = false
        )`.as('domain_count'),
        linkCount: sql<number>`(
          SELECT COUNT(*)::int FROM recording_links rl
          WHERE rl.workspace_id = workspaces.workspace_id AND rl.is_deleted = false
        )`.as('link_count'),
        recordingCount: sql<number>`(
          SELECT COUNT(*)::int FROM recordings r
          WHERE r.workspace_id = workspaces.workspace_id AND r.is_deleted = false
        )`.as('recording_count'),
      })
      .from(workspaces)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      workspaces: workspacesResult.map((w) => ({
        workspaceId: w.workspaceId,
        workspaceName: w.workspaceName,
        workspacePlan: w.workspacePlan,
        createdAt: w.createdAt,
        memberCount: w.memberCount,
        projectCount: w.projectCount,
        domainCount: w.domainCount,
        linkCount: w.linkCount,
        recordingCount: w.recordingCount,
        isDeleted: w.isDeleted,
      })),
      total,
    };
  }

  /**
   * Get workspace by ID
   */
  async findWorkspaceById(workspaceId: string): Promise<AdminWorkspaceDetail | null> {
    const [foundWorkspace] = await this.db
      .select({
        workspaceId: workspaces.workspaceId,
        workspaceName: workspaces.workspaceName,
        workspacePlan: workspaces.workspacePlan,
        createdAt: workspaces.createdAt,
        isDeleted: workspaces.isDeleted,
        deletedAt: workspaces.deletedAt,
      })
      .from(workspaces)
      .where(eq(workspaces.workspaceId, workspaceId))
      .limit(1);

    return foundWorkspace || null;
  }

  /**
   * Get workspace entity counts
   */
  async getWorkspaceCounts(workspaceId: string): Promise<{
    memberCount: number;
    projectCount: number;
    domainCount: number;
    linkCount: number;
    recordingCount: number;
  }> {
    const [result] = await this.db
      .select({
        memberCount: sql<number>`(
          SELECT COUNT(*)::int FROM workspace_members wm
          WHERE wm.workspace_id = ${workspaceId} AND wm.is_deleted = false
        )`.as('member_count'),
        projectCount: sql<number>`(
          SELECT COUNT(*)::int FROM projects p
          WHERE p.workspace_id = ${workspaceId} AND p.is_deleted = false
        )`.as('project_count'),
        domainCount: sql<number>`(
          SELECT COUNT(*)::int FROM domains d
          WHERE d.workspace_id = ${workspaceId} AND d.is_deleted = false
        )`.as('domain_count'),
        linkCount: sql<number>`(
          SELECT COUNT(*)::int FROM recording_links rl
          WHERE rl.workspace_id = ${workspaceId} AND rl.is_deleted = false
        )`.as('link_count'),
        recordingCount: sql<number>`(
          SELECT COUNT(*)::int FROM recordings r
          WHERE r.workspace_id = ${workspaceId} AND r.is_deleted = false
        )`.as('recording_count'),
      })
      .from(workspaces)
      .where(eq(workspaces.workspaceId, workspaceId))
      .limit(1);

    return {
      memberCount: result?.memberCount ?? 0,
      projectCount: result?.projectCount ?? 0,
      domainCount: result?.domainCount ?? 0,
      linkCount: result?.linkCount ?? 0,
      recordingCount: result?.recordingCount ?? 0,
    };
  }

  /**
   * Get workspace members with user info (paginated)
   */
  async getWorkspaceMembers(
    workspaceId: string,
    options: { limit: number; offset: number } = { limit: 10, offset: 0 }
  ): Promise<{ members: AdminWorkspaceMember[]; total: number }> {
    const { limit, offset } = options;

    // Get total count
    const [countResult] = await this.db
      .select({ count: count() })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.isDeleted, false))
      );

    const total = countResult?.count ?? 0;

    // Get paginated members
    const result = await this.db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        workspaceRole: workspaceMembers.workspaceRole,
        joinedAt: workspaceMembers.createdAt,
      })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.isDeleted, false))
      )
      .orderBy(desc(workspaceMembers.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      members: result.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        userEmail: m.userEmail,
        workspaceRole: m.workspaceRole,
        joinedAt: m.joinedAt,
      })),
      total,
    };
  }

  /**
   * Search workspace projects with recording counts (paginated, filtered, sorted)
   * Supports filtering by active/deleted status, searching by name/ID, and sorting by multiple fields
   */
  async searchWorkspaceProjects(
    params: SearchWorkspaceProjectsParams
  ): Promise<{ projects: AdminWorkspaceProject[]; total: number }> {
    const { workspaceId, search, limit, offset, sortBy, sortDirection, filterStatus } = params;

    // Build WHERE conditions
    const conditions = [eq(projects.workspaceId, workspaceId)];

    if (search) {
      // Search by project title or project ID (case-insensitive)
      const searchCondition = or(
        ilike(projects.projectTitle, `%${search}%`),
        ilike(projects.projectId, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (filterStatus === 'active') {
      conditions.push(eq(projects.isDeleted, false));
    } else if (filterStatus === 'deleted') {
      conditions.push(eq(projects.isDeleted, true));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await this.db
      .select({ count: count() })
      .from(projects)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Determine sort column and direction
    const sortColumn =
      sortBy === 'project_title'
        ? projects.projectTitle
        : sortBy === 'updated_at'
          ? projects.updatedAt
          : projects.createdAt;
    const orderFn = sortDirection === 'asc' ? asc : desc;

    // Get paginated projects with recording counts
    const result = await this.db
      .select({
        projectId: projects.projectId,
        projectTitle: projects.projectTitle,
        isDefault: projects.isDefault,
        isDeleted: projects.isDeleted,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        deletedAt: projects.deletedAt,
        recordingCount: sql<number>`(
          SELECT COUNT(*)::int FROM recordings r
          WHERE r.project_id = projects.project_id AND r.is_deleted = false
        )`.as('recording_count'),
      })
      .from(projects)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      projects: result.map((p) => ({
        projectId: p.projectId,
        projectTitle: p.projectTitle,
        isDefault: p.isDefault,
        isDeleted: p.isDeleted,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
        recordingCount: p.recordingCount,
      })),
      total,
    };
  }

  /**
   * Deactivate (soft delete) workspace
   */
  async deactivateWorkspace(workspaceId: string): Promise<AdminWorkspaceDetail | null> {
    const [updated] = await this.db
      .update(workspaces)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(workspaces.workspaceId, workspaceId))
      .returning();

    if (!updated) return null;

    return {
      workspaceId: updated.workspaceId,
      workspaceName: updated.workspaceName,
      workspacePlan: updated.workspacePlan,
      createdAt: updated.createdAt,
      isDeleted: updated.isDeleted,
      deletedAt: updated.deletedAt,
    };
  }

  /**
   * Reset invite token
   */
  async resetInviteToken(
    workspaceId: string,
    newToken: string
  ): Promise<AdminWorkspaceDetail | null> {
    const [updated] = await this.db
      .update(workspaces)
      .set({
        workspaceInviteToken: newToken,
      })
      .where(eq(workspaces.workspaceId, workspaceId))
      .returning();

    if (!updated) return null;

    return {
      workspaceId: updated.workspaceId,
      workspaceName: updated.workspaceName,
      workspacePlan: updated.workspacePlan,
      createdAt: updated.createdAt,
      isDeleted: updated.isDeleted,
      deletedAt: updated.deletedAt,
    };
  }
}
