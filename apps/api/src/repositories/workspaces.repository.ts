/**
 * WorkspaceRepository - Data access layer for workspaces
 * Handles all database operations for workspace entities
 */

import { eq, and } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { workspaces } from '@workspace/db';
import type { Transaction, CreateWorkspaceInput } from '@/api/types';

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
        id: data.id,
        workspaceName: data.workspaceName,
        workspaceSlug: data.workspaceSlug,
        workspacePlan: data.workspacePlan,
        workspaceLogoUrl: data.workspaceLogoUrl,
        workspaceInviteToken: data.workspaceInviteToken,
        isDeleted: false,
      })
      .returning();

    return workspace;
  }

  /**
   * Find workspace by ID
   */
  async findById(id: string) {
    const [workspace] = await this.db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }

  /**
   * Find workspace by slug
   */
  async findBySlug(slug: string) {
    const [workspace] = await this.db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.workspaceSlug, slug), eq(workspaces.isDeleted, false)))
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
   * Check if workspace exists by slug
   */
  async existsBySlug(slug: string): Promise<boolean> {
    const [result] = await this.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.workspaceSlug, slug), eq(workspaces.isDeleted, false)))
      .limit(1);

    return !!result;
  }
}
