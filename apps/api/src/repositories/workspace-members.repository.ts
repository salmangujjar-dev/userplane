/**
 * WorkspaceMemberRepository - Data access layer for workspace members
 * Handles all database operations for workspace member entities
 */

import { eq, and } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { workspaceMembers } from '@workspace/db';
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
        id: data.id,
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
   * Update member role
   */
  async updateRole(
    memberId: string,
    newRole: 'owner' | 'admin' | 'member',
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(workspaceMembers)
      .set({ workspaceRole: newRole })
      .where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.isDeleted, false)))
      .returning();

    return updated;
  }
}
