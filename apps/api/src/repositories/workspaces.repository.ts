/**
 * WorkspaceRepository - Data access layer for workspaces
 * Handles all database operations for workspace entities
 */

import { eq, and, count } from '@workspace/db';
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
        recordingSlug: data.recordingSlug,
        workspacePlan: data.workspacePlan,
        workspaceInviteToken: data.workspaceInviteToken,
        isDeleted: false,
      })
      .returning();

    return workspace;
  }

  /**
   * Find workspace by ID
   * Returns only basic workspace info
   */
  async findById(id: string) {
    const [workspace] = await this.db
      .select({
        id: workspaces.id,
        workspaceName: workspaces.workspaceName,
        workspacePlan: workspaces.workspacePlan,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.isDeleted, false)))
      .limit(1);

    return workspace || null;
  }

  /**
   * Check if workspace is soft-deleted
   * Returns true if workspace exists but is marked as deleted
   */
  async isSoftDeleted(id: string) {
    const [workspace] = await this.db
      .select({
        id: workspaces.id,
        isDeleted: workspaces.isDeleted,
      })
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    return workspace ? workspace.isDeleted : null;
  }

  /**
   * Find workspace preferences by ID
   * Returns recording-related settings
   */
  async findPreferencesById(id: string) {
    const [preferences] = await this.db
      .select({
        recordingSlug: workspaces.recordingSlug,
        recordingCustomizeLink: workspaces.recordingCustomizeLink,
        recordingHideSensitive: workspaces.recordingHideSensitive,
        recordingCaptureClientLog: workspaces.recordingCaptureClientLog,
        recordingCaptureServerLog: workspaces.recordingCaptureServerLog,
        recordingCompanyName: workspaces.recordingCompanyName,
        recordingCompanyLogoPath: workspaces.recordingCompanyLogoPath,
        recordingHeader: workspaces.recordingHeader,
        recordingFootnote: workspaces.recordingFootnote,
        recordingPrimaryColor: workspaces.recordingPrimaryColor,
        recordingMaxDuration: workspaces.recordingMaxDuration,
      })
      .from(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.isDeleted, false)))
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
  async findInviteTokenById(id: string) {
    const [workspace] = await this.db
      .select({
        workspaceInviteToken: workspaces.workspaceInviteToken,
      })
      .from(workspaces)
      .where(and(eq(workspaces.id, id), eq(workspaces.isDeleted, false)))
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
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.isDeleted, false)))
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
      includeNotificationPreferences?: boolean;
      includeWorkspaceMembership?: boolean;
    }
  ) {
    const { workspaceMembers } = await import('@workspace/db');
    const includeNotifications = options?.includeNotificationPreferences || false;
    const includeMembership = options?.includeWorkspaceMembership || false;

    // Build the select object dynamically based on options
    const selectFields: any = {
      id: workspaces.id,
      workspaceName: workspaces.workspaceName,
      workspacePlan: workspaces.workspacePlan,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    };

    if (includeNotifications) {
      selectFields.notificationPreferences = {
        notifyOnLinkUsage: workspaceMembers.notifyOnLinkUsage,
        notifyOnQuotaReset: workspaceMembers.notifyOnQuotaReset,
        notifyOnQuotaLimit: workspaceMembers.notifyOnQuotaLimit,
        notifyOnInviteAccepted: workspaceMembers.notifyOnInviteAccepted,
        notifyOnMemberJoin: workspaceMembers.notifyOnMemberJoin,
      };
    }

    if (includeMembership) {
      selectFields.workspaceMembership = {
        workspaceMemberId: workspaceMembers.id,
        workspaceRole: workspaceMembers.workspaceRole,
      };
    }

    const result = await this.db
      .select(selectFields)
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
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
    const { workspaceMembers } = await import('@workspace/db');

    const [result] = await this.db
      .select({ count: count() })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
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
   * Find workspaces for a user with pagination
   */
  async findByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number,
    options?: {
      includeNotificationPreferences?: boolean;
      includeWorkspaceMembership?: boolean;
    }
  ) {
    const { workspaceMembers } = await import('@workspace/db');
    const includeNotifications = options?.includeNotificationPreferences || false;
    const includeMembership = options?.includeWorkspaceMembership || false;

    // Build the select object dynamically based on options
    const selectFields: any = {
      id: workspaces.id,
      workspaceName: workspaces.workspaceName,
      workspacePlan: workspaces.workspacePlan,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    };

    if (includeNotifications) {
      selectFields.notificationPreferences = {
        notifyOnLinkUsage: workspaceMembers.notifyOnLinkUsage,
        notifyOnQuotaReset: workspaceMembers.notifyOnQuotaReset,
        notifyOnQuotaLimit: workspaceMembers.notifyOnQuotaLimit,
        notifyOnInviteAccepted: workspaceMembers.notifyOnInviteAccepted,
        notifyOnMemberJoin: workspaceMembers.notifyOnMemberJoin,
      };
    }

    if (includeMembership) {
      selectFields.workspaceMembership = {
        workspaceMemberId: workspaceMembers.id,
        workspaceRole: workspaceMembers.workspaceRole,
      };
    }

    const result = await this.db
      .select(selectFields)
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaces.isDeleted, false),
          eq(workspaceMembers.isDeleted, false)
        )
      )
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Update workspace preferences
   * Updates recording-related settings
   */
  async updatePreferences(
    workspaceId: string,
    data: Partial<{
      recordingCustomizeLink: boolean;
      recordingHideSensitive: boolean;
      recordingCaptureClientLog: boolean;
      recordingCaptureServerLog: boolean;
      recordingCompanyName: string | null;
      recordingCompanyLogoPath: string | null;
      recordingHeader: string | null;
      recordingFootnote: string | null;
      recordingPrimaryColor: string | null;
      recordingMaxDuration: number | null;
    }>,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(workspaces)
      .set(data)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.isDeleted, false)))
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
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.isDeleted, false)))
      .returning({
        id: workspaces.id,
        workspaceName: workspaces.workspaceName,
        workspacePlan: workspaces.workspacePlan,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      });

    return updated || null;
  }

  /**
   * Soft delete a workspace
   * Sets isDeleted to true and updates deletedAt timestamp
   */
  async softDelete(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(workspaces)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(workspaces.id, id), eq(workspaces.isDeleted, false)))
      .returning();

    return deleted || null;
  }
}
