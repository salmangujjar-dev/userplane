/**
 * ProjectRepository - Data access layer for projects
 * Handles all database operations for project entities
 */

import type { DbClient } from '@workspace/db';
import { and, asc, count, desc, eq, ilike, ne } from '@workspace/db';
import { projects } from '@workspace/db';

import type { CreateProjectInput, Transaction } from '@/api/types';

export type ProjectSortField = 'created_at' | 'project_title';
export type SortDirection = 'asc' | 'desc';

export class ProjectRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new project
   */
  async create(data: CreateProjectInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [project] = await dbClient
      .insert(projects)
      .values({
        projectId: data.projectId,
        workspaceId: data.workspaceId,
        projectTitle: data.projectTitle,
        isDefault: data.isDefault,
        isDeleted: false,
      })
      .returning();

    return project;
  }

  /**
   * Find project by ID
   */
  async findById(projectId: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.projectId, projectId), eq(projects.isDeleted, false)))
      .limit(1);

    return project || null;
  }

  /**
   * Check if project is soft-deleted
   * Returns true if project exists but is marked as deleted
   */
  async isSoftDeleted(projectId: string) {
    const [project] = await this.db
      .select({
        projectId: projects.projectId,
        isDeleted: projects.isDeleted,
      })
      .from(projects)
      .where(eq(projects.projectId, projectId))
      .limit(1);

    return project ? project.isDeleted : null;
  }

  /**
   * Find default project by workspace ID
   */
  async findDefaultByWorkspace(workspaceId: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.isDefault, true),
          eq(projects.isDeleted, false)
        )
      )
      .limit(1);

    return project || null;
  }

  /**
   * Unset all default projects in a workspace
   * Used when setting a new project as default to ensure only one default exists
   */
  async unsetAllDefaultProjects(workspaceId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    await dbClient
      .update(projects)
      .set({ isDefault: false })
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isDefault, true)));
  }

  /**
   * Update project
   */
  async update(
    projectId: string,
    data: Partial<Pick<CreateProjectInput, 'projectTitle' | 'isDefault'>>,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(projects)
      .set(data)
      .where(and(eq(projects.projectId, projectId), eq(projects.isDeleted, false)))
      .returning();

    return updated;
  }

  /**
   * Find all projects in workspace
   */
  async findByWorkspace(workspaceId: string) {
    return this.db
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isDeleted, false)));
  }

  /**
   * Find projects in workspace with pagination and sorting
   */
  async findByWorkspacePaginated(
    workspaceId: string,
    limit: number,
    offset: number,
    sortBy: ProjectSortField = 'created_at',
    sortDirection: SortDirection = 'desc'
  ) {
    const sortColumn = sortBy === 'project_title' ? projects.projectTitle : projects.createdAt;
    const orderFn = sortDirection === 'asc' ? asc : desc;

    return this.db
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isDeleted, false)))
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count projects in a workspace
   */
  async countByWorkspace(workspaceId: string) {
    const [result] = await this.db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isDeleted, false)));

    return Number(result?.count || 0);
  }

  /**
   * Find one project in workspace that is not the given project
   * Used when deleting a default project to find a replacement
   */
  async findOtherProject(workspaceId: string, excludeProjectId: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          ne(projects.projectId, excludeProjectId),
          eq(projects.isDeleted, false)
        )
      )
      .limit(1);

    return project || null;
  }

  /**
   * Soft delete a project
   * Sets isDeleted to true and updates deletedAt timestamp
   */
  async softDelete(projectId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(projects)
      .set({
        isDeleted: true,
        isDefault: false,
        deletedAt: new Date(),
      })
      .where(and(eq(projects.projectId, projectId), eq(projects.isDeleted, false)))
      .returning();

    return deleted || null;
  }

  /**
   * Search projects by title
   * Uses case-insensitive ILIKE pattern matching on project title
   */
  async searchByTitle(workspaceId: string, searchTerms: string[], limit: number) {
    const conditions = [eq(projects.workspaceId, workspaceId), eq(projects.isDeleted, false)];

    // Add ILIKE conditions for each search term
    // Each term must match somewhere in the title (AND logic)
    for (const term of searchTerms) {
      conditions.push(ilike(projects.projectTitle, `%${term}%`));
    }

    return this.db
      .select()
      .from(projects)
      .where(and(...conditions))
      .limit(limit);
  }

  /**
   * Soft delete all projects in workspace
   * Used for workspace deletion cascade
   */
  async softDeleteByWorkspaceId(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const deleted = await dbClient
      .update(projects)
      .set({
        isDeleted: true,
        deletedAt: deletedAt,
      })
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isDeleted, false)))
      .returning();

    return deleted;
  }

  /**
   * Restore projects in workspace that were deleted at a specific timestamp
   * Used for workspace restoration to restore associated projects
   * Only restores projects deleted at the exact same time as the workspace
   */
  async restoreByWorkspaceIdAndDeletionTime(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const restored = await dbClient
      .update(projects)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.isDeleted, true),
          eq(projects.deletedAt, deletedAt)
        )
      )
      .returning();

    return restored;
  }

  /**
   * Restore a soft-deleted project
   * Resets isDeleted to false and clears deletedAt
   * Used for individual project restoration within grace period
   * Does NOT restore associated links - only the project itself
   */
  async restore(projectId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [restored] = await dbClient
      .update(projects)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(and(eq(projects.projectId, projectId), eq(projects.isDeleted, true)))
      .returning();

    return restored || null;
  }

  /**
   * Get project with deletion timestamp
   * Used for restoration to validate grace period
   */
  async findByIdWithDeletionInfo(projectId: string) {
    const [project] = await this.db
      .select({
        projectId: projects.projectId,
        workspaceId: projects.workspaceId,
        projectTitle: projects.projectTitle,
        isDefault: projects.isDefault,
        isDeleted: projects.isDeleted,
        deletedAt: projects.deletedAt,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.projectId, projectId))
      .limit(1);

    return project || null;
  }
}
