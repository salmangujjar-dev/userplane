/**
 * ProjectRepository - Data access layer for projects
 * Handles all database operations for project entities
 */

import { eq, and, ne, count } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { projects } from '@workspace/db';
import type { Transaction, CreateProjectInput } from '@/api/types';

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
        id: data.id,
        workspaceId: data.workspaceId,
        projectTitle: data.projectTitle,
        projectPath: data.projectPath,
        isDefault: data.isDefault,
        isDeleted: false,
      })
      .returning();

    return project;
  }

  /**
   * Find project by ID
   */
  async findById(id: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.isDeleted, false)))
      .limit(1);

    return project || null;
  }

  /**
   * Check if project is soft-deleted
   * Returns true if project exists but is marked as deleted
   */
  async isSoftDeleted(id: string) {
    const [project] = await this.db
      .select({
        id: projects.id,
        isDeleted: projects.isDeleted,
      })
      .from(projects)
      .where(eq(projects.id, id))
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
   * Update project
   */
  async update(
    id: string,
    data: Partial<Pick<CreateProjectInput, 'projectTitle' | 'isDefault'>>,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(projects)
      .set(data)
      .where(and(eq(projects.id, id), eq(projects.isDeleted, false)))
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
   * Find projects in workspace with pagination
   */
  async findByWorkspacePaginated(workspaceId: string, limit: number, offset: number) {
    return this.db
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isDeleted, false)))
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
          ne(projects.id, excludeProjectId),
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
  async softDelete(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(projects)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.isDeleted, false)))
      .returning();

    return deleted || null;
  }
}
