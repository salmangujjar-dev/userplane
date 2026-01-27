/**
 * IntercomIntegrationRepository - Data access layer for Intercom integrations
 * Handles all database operations for Intercom OAuth connections
 */

import type { DbClient } from '@workspace/db';
import { and, eq, sql } from '@workspace/db';
import { intercomIntegrations, type IntercomRegion } from '@workspace/db';

import type { Transaction } from '@/api/types';

export interface CreateIntercomIntegrationInput {
  id: string;
  workspaceId: string;
  intercomWorkspaceId: string;
  accessToken: string;
  region: IntercomRegion;
  adminId: string;
  adminEmail: string;
  adminName?: string;
  appIdCode: string;
  appName?: string;
}

export class IntercomIntegrationRepository {
  constructor(private db: DbClient) {}

  /**
   * Create a new Intercom integration
   */
  async create(data: CreateIntercomIntegrationInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [integration] = await dbClient
      .insert(intercomIntegrations)
      .values({
        id: data.id,
        workspaceId: data.workspaceId,
        intercomWorkspaceId: data.intercomWorkspaceId,
        accessToken: data.accessToken,
        region: data.region,
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        appIdCode: data.appIdCode,
        appName: data.appName,
        isDeleted: false,
      })
      .returning();

    return integration;
  }

  /**
   * Find integration by Intercom workspace ID
   * Used to check for duplicate connections
   * Only returns non-deleted integrations
   */
  async findByIntercomWorkspaceId(intercomWorkspaceId: string) {
    const [integration] = await this.db
      .select()
      .from(intercomIntegrations)
      .where(
        and(
          eq(intercomIntegrations.intercomWorkspaceId, intercomWorkspaceId),
          eq(intercomIntegrations.isDeleted, false)
        )
      )
      .limit(1);

    return integration || null;
  }

  /**
   * Find integration by workspace ID
   * Only returns non-deleted integrations
   */
  async findByWorkspaceId(workspaceId: string) {
    const [integration] = await this.db
      .select()
      .from(intercomIntegrations)
      .where(
        and(
          eq(intercomIntegrations.workspaceId, workspaceId),
          eq(intercomIntegrations.isDeleted, false)
        )
      )
      .limit(1);

    return integration || null;
  }

  /**
   * Delete an Intercom integration (soft delete) by workspace ID
   * Sets isDeleted to true and updates deletedAt timestamp
   * If deletedAt is provided, uses that timestamp; otherwise uses current date
   */
  async delete(workspaceId: string, options?: { tx?: Transaction; deletedAt?: Date }) {
    const dbClient = options?.tx || this.db;
    const deletionTime = options?.deletedAt || new Date();

    const [deleted] = await dbClient
      .update(intercomIntegrations)
      .set({
        isDeleted: true,
        deletedAt: deletionTime,
      })
      .where(
        and(
          eq(intercomIntegrations.workspaceId, workspaceId),
          eq(intercomIntegrations.isDeleted, false)
        )
      )
      .returning();

    return deleted || null;
  }

  /**
   * Restore a soft-deleted Intercom integration by workspace ID
   * Sets isDeleted to false and clears deletedAt timestamp
   * Restores only the record matching the specific deletedAt timestamp
   * No-op if the intercomWorkspaceId is already associated with another active workspace
   * Uses a single query with subquery to check for active duplicates
   */
  async restore(workspaceId: string, deletedAt: Date, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    // Single UPDATE query with subquery to prevent duplicate intercomWorkspaceId
    const [restored] = await dbClient
      .update(intercomIntegrations)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(
        sql`workspace_id = ${workspaceId} 
        AND is_deleted = true 
        AND deleted_at = ${deletedAt}
        AND NOT EXISTS (
          SELECT 1 FROM ${intercomIntegrations} AS active
          WHERE active.intercom_workspace_id = ${intercomIntegrations}.intercom_workspace_id
          AND active.is_deleted = false
        )`
      )
      .returning();

    return restored || null;
  }
}
