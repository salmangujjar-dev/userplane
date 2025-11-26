/**
 * ProjectRepository - Data access layer for projects
 * Handles all database operations for project entities
 */

import { eq, and } from '@workspace/db';
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
        storeId: data.storeId,
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
}
