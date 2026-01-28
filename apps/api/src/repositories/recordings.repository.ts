/**
 * RecordingRepository - Data access layer for recordings
 * Handles all database operations for recording entities
 */

import * as Sentry from '@sentry/bun';
import type { DbClient, Recording } from '@workspace/db';
import { and, asc, count, desc, eq, inArray, sql } from '@workspace/db';
import {
  domains,
  links,
  projects,
  recordings,
  user,
  workspaceMembers,
  workspaces,
} from '@workspace/db';

import { getUploadStatusesForGroup } from '@/api/schema/recording.schema';
import {
  type CustomMeta,
  customMetaSchema,
  type SystemMeta,
  systemMetaSchema,
} from '@/api/schema/recording-meta.schema';
import type { RecordingFilters, RecordingSortOptions } from '@/api/types';

export type { CustomMeta, SystemMeta };

/**
 * Shape of recording list item with joined data
 */
export interface RecordingListRow {
  recordingId: string;
  recordingThumbnailRef: string | null;
  recordingDurationMs: number;
  createdAt: Date;
  creatorId: string;
  creatorName: string;
}

/**
 * Shape of recording detail with all joined data
 * Uses inferred types from database schema to avoid duplication
 */
export interface RecordingDetailRow {
  recordingId: string;
  workspaceId: string;
  projectId: string;
  recordingLinkId: string;
  uploadStatus: Recording['uploadStatus'];
  recordingVideoRef: string | null;
  recordingThumbnailRef: string | null;
  recordingConsoleLogRef: string | null;
  recordingNetworkLogsRef: string | null;
  recordingActionRef: string | null;
  systemMeta: SystemMeta | null;
  customMeta: CustomMeta | null;
  recordingDurationMs: number;
  createdAt: Date;
  updatedAt: Date;
  // Creator info
  creatorId: string;
  creatorName: string;
  // Recording link info
  linkTitle: string | null;
  linkProviderType: string | null;
  linkProviderId: string | null;
  linkProviderRef: string | null;
  linkProviderData: unknown;
  linkCreatedAt: Date;
  // Project info
  projectTitle: string;
  // Domain info
  domainId: string;
  domainUrl: string;
}

/**
 * Transaction type for repository operations
 */
export type Transaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

/**
 * Input for creating a recording
 */
export interface CreateRecordingInput {
  recordingId: string;
  recordingLinkId: string;
  workspaceId: string;
  projectId: string;
  createdBy: string;
  recordingDurationMs: number;
  recordingVideoRef: string | null;
  recordingThumbnailRef: string | null;
  recordingConsoleLogRef: string | null;
  recordingNetworkLogsRef: string | null;
  recordingActionRef: string | null;
  systemMeta?: SystemMeta | null;
  customMeta?: CustomMeta | null;
}

/**
 * Recording file info stored in metadata
 */
export interface RecordingFileInfo {
  videoSize: number | null;
  thumbnailSize: number | null;
  consoleLogSize: number | null;
  networkLogSize: number | null;
  actionSize: number | null;
}

export class RecordingRepository {
  constructor(private db: DbClient) {}

  /**
   * Transform and validate system metadata from database
   */
  private transformSystemMeta(raw: unknown): SystemMeta | null {
    if (!raw) return null;
    const result = systemMetaSchema.safeParse(raw);
    if (!result.success) {
      console.warn('[RecordingRepository] Invalid systemMeta', {
        errors: result.error.errors,
        raw,
      });
      return null;
    }
    return result.data;
  }

  /**
   * Transform and validate custom metadata from database
   */
  private transformCustomMeta(raw: unknown): CustomMeta | null {
    if (!raw) return null;
    const result = customMetaSchema.safeParse(raw);
    if (!result.success) {
      console.warn('[RecordingRepository] Invalid customMeta', {
        errors: result.error.errors,
        raw,
      });
      return null;
    }
    return result.data;
  }

  /**
   * Build WHERE conditions for recording queries
   * Handles workspaceId and optional filters at the SQL level
   * Filters support multiple values using inArray for OR conditions
   * statusGroup defaults to 'AVAILABLE' if not specified
   */
  private buildWhereConditions(workspaceId: string, filters?: RecordingFilters) {
    const conditions = [eq(recordings.workspaceId, workspaceId), eq(recordings.isDeleted, false)];

    // Apply status group filter (defaults to AVAILABLE)
    const statusGroup = filters?.statusGroup ?? 'AVAILABLE';
    const statuses = [...getUploadStatusesForGroup(statusGroup)];
    conditions.push(inArray(recordings.uploadStatus, statuses));

    if (filters?.createdBy && filters.createdBy.length > 0) {
      conditions.push(inArray(recordings.createdBy, filters.createdBy));
    }

    if (filters?.projectId && filters.projectId.length > 0) {
      conditions.push(inArray(recordings.projectId, filters.projectId));
    }

    if (filters?.linkId && filters.linkId.length > 0) {
      conditions.push(inArray(recordings.recordingLinkId, filters.linkId));
    }

    return and(...conditions);
  }

  /**
   * Build ORDER BY clause based on sort options
   * Defaults to createdAt descending (latest first)
   */
  private buildOrderBy(sort?: RecordingSortOptions) {
    const direction = sort?.direction === 'asc' ? asc : desc;

    switch (sort?.field) {
      case 'recording_duration':
        return direction(recordings.recordingDurationMs);
      case 'created_at':
      default:
        return direction(recordings.createdAt);
    }
  }

  /**
   * Find recordings by workspace ID with pagination and optional filters
   * Uses JOINs to fetch creator name in a single query
   * All filtering and sorting happens at the database level
   * Excludes recordings from deleted projects or deleted workspaces
   */
  async findByWorkspaceIdPaginated(
    workspaceId: string,
    limit: number,
    offset: number,
    filters?: RecordingFilters,
    sort?: RecordingSortOptions
  ): Promise<RecordingListRow[]> {
    const whereConditions = this.buildWhereConditions(workspaceId, filters);
    const orderBy = this.buildOrderBy(sort);

    const results = await this.db
      .select({
        recordingId: recordings.recordingId,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingDurationMs: recordings.recordingDurationMs,
        createdAt: recordings.createdAt,
        creatorId: workspaceMembers.workspaceMemberId,
        creatorName: user.name,
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(projects, eq(recordings.projectId, projects.projectId))
      .innerJoin(workspaces, eq(recordings.workspaceId, workspaces.workspaceId))
      .where(and(whereConditions, eq(projects.isDeleted, false), eq(workspaces.isDeleted, false)))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Count recordings in a workspace with optional filters
   * Uses the same filtering logic as the paginated query
   * Excludes recordings from deleted projects or deleted workspaces
   */
  async countByWorkspace(workspaceId: string, filters?: RecordingFilters): Promise<number> {
    const whereConditions = this.buildWhereConditions(workspaceId, filters);

    const [result] = await this.db
      .select({ count: count() })
      .from(recordings)
      .innerJoin(projects, eq(recordings.projectId, projects.projectId))
      .innerJoin(workspaces, eq(recordings.workspaceId, workspaces.workspaceId))
      .where(and(whereConditions, eq(projects.isDeleted, false), eq(workspaces.isDeleted, false)));

    return Number(result?.count || 0);
  }

  /**
   * Count active (non-deleted) recordings in a project
   */
  async countByProject(projectId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(recordings)
      .where(and(eq(recordings.projectId, projectId), eq(recordings.isDeleted, false)));

    return Number(result?.count || 0);
  }

  /**
   * Find recording by ID
   * Excludes recordings from deleted projects or deleted workspaces
   */
  async findById(recordingId: string) {
    const [result] = await this.db
      .select({
        recordings,
      })
      .from(recordings)
      .innerJoin(projects, eq(recordings.projectId, projects.projectId))
      .innerJoin(workspaces, eq(recordings.workspaceId, workspaces.workspaceId))
      .where(
        and(
          eq(recordings.recordingId, recordingId),
          eq(recordings.isDeleted, false),
          eq(projects.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      )
      .limit(1);

    return result?.recordings || null;
  }

  /**
   * Find recording by ID with status group filter
   * Defaults to 'AVAILABLE' status group if not specified
   * Excludes recordings from deleted projects or deleted workspaces
   */
  async findByIdWithStatusGroup(
    recordingId: string,
    statusGroup: RecordingFilters['statusGroup'] = 'AVAILABLE'
  ) {
    Sentry.addBreadcrumb({
      category: 'db.query',
      message: 'Query recording by ID with status group',
      level: 'info',
      data: {
        recording_id: recordingId,
        status_group: statusGroup,
        operation: 'select',
      },
    });

    const statuses = [...getUploadStatusesForGroup(statusGroup ?? 'AVAILABLE')];

    const [result] = await this.db
      .select({
        recordings,
      })
      .from(recordings)
      .innerJoin(projects, eq(recordings.projectId, projects.projectId))
      .innerJoin(workspaces, eq(recordings.workspaceId, workspaces.workspaceId))
      .where(
        and(
          eq(recordings.recordingId, recordingId),
          eq(recordings.isDeleted, false),
          inArray(recordings.uploadStatus, statuses),
          eq(projects.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      )
      .limit(1);

    if (!result) {
      Sentry.addBreadcrumb({
        category: 'db.query',
        message: 'Recording not found',
        level: 'warning',
        data: { recording_id: recordingId, status_group: statusGroup },
      });
    }

    return result?.recordings || null;
  }

  /**
   * Find recording by ID with all related data joined and status group filter
   * Defaults to 'AVAILABLE' status group if not specified
   * Returns full recording details including recording link, creator, project, and domain
   * Excludes recordings from deleted projects or deleted workspaces
   */
  async findByIdWithDetailsAndStatusGroup(
    recordingId: string,
    statusGroup: RecordingFilters['statusGroup'] = 'AVAILABLE'
  ): Promise<RecordingDetailRow | null> {
    const statuses = [...getUploadStatusesForGroup(statusGroup ?? 'AVAILABLE')];

    const [result] = await this.db
      .select({
        // Recording fields
        recordingId: recordings.recordingId,
        workspaceId: recordings.workspaceId,
        projectId: recordings.projectId,
        recordingLinkId: recordings.recordingLinkId,
        uploadStatus: recordings.uploadStatus,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingActionRef: recordings.recordingActionRef,
        systemMeta: recordings.systemMeta,
        customMeta: recordings.customMeta,
        recordingDurationMs: recordings.recordingDurationMs,
        createdAt: recordings.createdAt,
        updatedAt: recordings.updatedAt,
        // Creator info
        creatorId: workspaceMembers.workspaceMemberId,
        creatorName: user.name,
        // Link info
        linkTitle: links.linkTitle,
        linkProviderType: links.linkProviderType,
        linkProviderId: links.linkProviderId,
        linkProviderRef: links.linkProviderRef,
        linkProviderData: links.linkProviderData,
        linkCreatedAt: links.createdAt,
        // Project info
        projectTitle: projects.projectTitle,
        // Domain info
        domainId: domains.domainId,
        domainUrl: domains.domainUrl,
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(links, eq(recordings.recordingLinkId, links.linkId))
      .innerJoin(projects, eq(recordings.projectId, projects.projectId))
      .innerJoin(workspaces, eq(recordings.workspaceId, workspaces.workspaceId))
      .innerJoin(domains, eq(links.domainId, domains.domainId))
      .where(
        and(
          eq(recordings.recordingId, recordingId),
          eq(recordings.isDeleted, false),
          inArray(recordings.uploadStatus, statuses),
          eq(projects.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      )
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      systemMeta: this.transformSystemMeta(result.systemMeta),
      customMeta: this.transformCustomMeta(result.customMeta),
    };
  }

  /**
   * Find recording by ID with all related data joined
   * Returns full recording details including recording link, creator, project, and domain
   * Excludes recordings from deleted projects or deleted workspaces
   */
  async findByIdWithDetails(recordingId: string): Promise<RecordingDetailRow | null> {
    const [result] = await this.db
      .select({
        // Recording fields
        recordingId: recordings.recordingId,
        workspaceId: recordings.workspaceId,
        projectId: recordings.projectId,
        recordingLinkId: recordings.recordingLinkId,
        uploadStatus: recordings.uploadStatus,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingActionRef: recordings.recordingActionRef,
        systemMeta: recordings.systemMeta,
        customMeta: recordings.customMeta,
        recordingDurationMs: recordings.recordingDurationMs,
        createdAt: recordings.createdAt,
        updatedAt: recordings.updatedAt,
        // Creator info
        creatorId: workspaceMembers.workspaceMemberId,
        creatorName: user.name,
        // Link info
        linkTitle: links.linkTitle,
        linkProviderType: links.linkProviderType,
        linkProviderId: links.linkProviderId,
        linkProviderRef: links.linkProviderRef,
        linkProviderData: links.linkProviderData,
        linkCreatedAt: links.createdAt,
        // Project info
        projectTitle: projects.projectTitle,
        // Domain info
        domainId: domains.domainId,
        domainUrl: domains.domainUrl,
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.workspaceMemberId))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(links, eq(recordings.recordingLinkId, links.linkId))
      .innerJoin(projects, eq(recordings.projectId, projects.projectId))
      .innerJoin(workspaces, eq(recordings.workspaceId, workspaces.workspaceId))
      .innerJoin(domains, eq(links.domainId, domains.domainId))
      .where(
        and(
          eq(recordings.recordingId, recordingId),
          eq(recordings.isDeleted, false),
          eq(projects.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      )
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      systemMeta: this.transformSystemMeta(result.systemMeta),
      customMeta: this.transformCustomMeta(result.customMeta),
    };
  }

  /**
   * Check if recording is soft-deleted
   * Returns true if recording exists but is marked as deleted
   */
  async isSoftDeleted(recordingId: string) {
    const [recording] = await this.db
      .select({
        recordingId: recordings.recordingId,
        isDeleted: recordings.isDeleted,
      })
      .from(recordings)
      .where(eq(recordings.recordingId, recordingId))
      .limit(1);

    return recording ? recording.isDeleted : null;
  }

  /**
   * Soft delete a recording
   * Marks the recording as deleted without removing it from the database
   */
  async softDelete(recordingId: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(recordings)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(recordings.recordingId, recordingId), eq(recordings.isDeleted, false)))
      .returning();

    return deleted || null;
  }

  /**
   * Soft delete all recordings in workspace
   * Used for workspace deletion cascade
   */
  async softDeleteByWorkspaceId(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const deleted = await dbClient
      .update(recordings)
      .set({
        isDeleted: true,
        deletedAt: deletedAt,
      })
      .where(and(eq(recordings.workspaceId, workspaceId), eq(recordings.isDeleted, false)))
      .returning();

    return deleted;
  }

  /**
   * Restore recordings in workspace that were deleted at a specific timestamp
   * Used for workspace restoration to restore associated recordings
   * Only restores recordings deleted at the exact same time as the workspace
   */
  async restoreByWorkspaceIdAndDeletionTime(
    workspaceId: string,
    deletedAt: Date,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const restored = await dbClient
      .update(recordings)
      .set({
        isDeleted: false,
        deletedAt: null,
      })
      .where(
        and(
          eq(recordings.workspaceId, workspaceId),
          eq(recordings.isDeleted, true),
          eq(recordings.deletedAt, deletedAt)
        )
      )
      .returning();

    return restored;
  }

  /**
   * Count recordings in workspace that were deleted at a specific timestamp
   * Used for workspace restore info to show how many recordings will be restored
   */
  async countByWorkspaceIdAndDeletionTime(workspaceId: string, deletedAt: Date) {
    const [result] = await this.db
      .select({ count: count() })
      .from(recordings)
      .where(
        and(
          eq(recordings.workspaceId, workspaceId),
          eq(recordings.isDeleted, true),
          eq(recordings.deletedAt, deletedAt)
        )
      );

    return result?.count ?? 0;
  }

  /**
   * Create a new recording with pending status
   * isDeleted is set to true because pending recordings should not be visible to users
   * until they become available
   */
  async create(data: CreateRecordingInput, options?: { tx?: Transaction }) {
    Sentry.addBreadcrumb({
      category: 'db.query',
      message: 'Create new recording',
      level: 'info',
      data: {
        recording_id: data.recordingId,
        workspace_id: data.workspaceId,
        project_id: data.projectId,
        operation: 'insert',
      },
    });

    const dbClient = options?.tx || this.db;

    const [recording] = await dbClient
      .insert(recordings)
      .values({
        recordingId: data.recordingId,
        recordingLinkId: data.recordingLinkId,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        createdBy: data.createdBy,
        recordingDurationMs: data.recordingDurationMs,
        recordingVideoRef: data.recordingVideoRef,
        recordingThumbnailRef: data.recordingThumbnailRef,
        recordingConsoleLogRef: data.recordingConsoleLogRef,
        recordingNetworkLogsRef: data.recordingNetworkLogsRef,
        recordingActionRef: data.recordingActionRef,
        systemMeta: data.systemMeta,
        customMeta: data.customMeta,
        uploadStatus: 'pending',
        isDeleted: true,
      })
      .returning();

    return recording;
  }

  /**
   * Update recording upload status to available
   * All files uploaded successfully
   * Sets isDeleted to false so recording becomes visible to users
   */
  async markAsAvailable(recordingId: string, options?: { tx?: Transaction }) {
    Sentry.addBreadcrumb({
      category: 'db.query',
      message: 'Mark recording as available',
      level: 'info',
      data: {
        recording_id: recordingId,
        operation: 'update',
        new_status: 'available',
      },
    });

    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(recordings)
      .set({
        uploadStatus: 'available',
        isDeleted: false,
        updatedAt: new Date(),
      })
      .where(and(eq(recordings.recordingId, recordingId), eq(recordings.uploadStatus, 'pending')))
      .returning();

    return updated || null;
  }

  /**
   * Get recording with file paths for verification
   * Excludes recordings from deleted projects or deleted workspaces
   */
  async findByIdWithFilePaths(recordingId: string): Promise<{
    recordingId: string;
    recordingLinkId: string;
    workspaceId: string;
    uploadStatus: Recording['uploadStatus'];
    recordingVideoRef: string | null;
    recordingThumbnailRef: string | null;
    recordingConsoleLogRef: string | null;
    recordingNetworkLogsRef: string | null;
    recordingActionRef: string | null;
    systemMeta: SystemMeta | null;
    customMeta: CustomMeta | null;
  } | null> {
    const [result] = await this.db
      .select({
        recordingId: recordings.recordingId,
        recordingLinkId: recordings.recordingLinkId,
        workspaceId: recordings.workspaceId,
        uploadStatus: recordings.uploadStatus,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingActionRef: recordings.recordingActionRef,
        systemMeta: recordings.systemMeta,
        customMeta: recordings.customMeta,
      })
      .from(recordings)
      .innerJoin(projects, eq(recordings.projectId, projects.projectId))
      .innerJoin(workspaces, eq(recordings.workspaceId, workspaces.workspaceId))
      .where(
        and(
          eq(recordings.recordingId, recordingId),
          eq(recordings.isDeleted, false),
          eq(projects.isDeleted, false),
          eq(workspaces.isDeleted, false)
        )
      )
      .limit(1);

    if (!result) return null;

    return {
      ...result,
      systemMeta: this.transformSystemMeta(result.systemMeta),
      customMeta: this.transformCustomMeta(result.customMeta),
    };
  }

  /**
   * Find pending recording by ID with file paths
   */
  async findPendingRecordingByIdWithFilePaths(recordingId: string): Promise<{
    recordingId: string;
    recordingLinkId: string;
    workspaceId: string;
    uploadStatus: Recording['uploadStatus'];
    recordingVideoRef: string | null;
    recordingThumbnailRef: string | null;
    recordingConsoleLogRef: string | null;
    recordingNetworkLogsRef: string | null;
    recordingActionRef: string | null;
    systemMeta: SystemMeta | null;
    customMeta: CustomMeta | null;
  } | null> {
    const [result] = await this.db
      .select({
        recordingId: recordings.recordingId,
        recordingLinkId: recordings.recordingLinkId,
        workspaceId: recordings.workspaceId,
        uploadStatus: recordings.uploadStatus,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingActionRef: recordings.recordingActionRef,
        systemMeta: recordings.systemMeta,
        customMeta: recordings.customMeta,
      })
      .from(recordings)
      .where(and(eq(recordings.recordingId, recordingId), eq(recordings.uploadStatus, 'pending')))
      .limit(1);

    if (!result) return null;

    return {
      ...result,
      systemMeta: this.transformSystemMeta(result.systemMeta),
      customMeta: this.transformCustomMeta(result.customMeta),
    };
  }

  /**
   * Find all recordings by project ID and workspace ID with file paths
   * Returns recordings that are not soft-deleted
   * Used for bulk operations like project cleanup
   */
  async findByProjectIdWithFilePaths(projectId: string, workspaceId: string) {
    return this.db
      .select({
        recordingId: recordings.recordingId,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingActionRef: recordings.recordingActionRef,
      })
      .from(recordings)
      .where(
        and(
          eq(recordings.projectId, projectId),
          eq(recordings.workspaceId, workspaceId),
          eq(recordings.isDeleted, false)
        )
      );
  }

  /**
   * Update recording upload status to purged
   * Sets status after storage cleanup has been attempted
   * Sets isDeleted to true to mark recording as cleaned up
   */
  async markAsPurged(recordingId: string, options?: { tx?: Transaction }) {
    Sentry.addBreadcrumb({
      category: 'db.query',
      message: 'Mark recording as purged',
      level: 'info',
      data: {
        recording_id: recordingId,
        operation: 'update',
        new_status: 'purged',
      },
    });

    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(recordings)
      .set({
        uploadStatus: 'purged',
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(recordings.recordingId, recordingId))
      .returning();

    if (!updated) {
      Sentry.addBreadcrumb({
        category: 'db.query',
        message: 'Failed to mark recording as purged - recording not found',
        level: 'warning',
        data: { recording_id: recordingId },
      });
    }

    return updated || null;
  }

  /**
   * Soft delete multiple recordings by project ID and workspace ID
   * More efficient than individual deletes for bulk operations
   * Used for project deletion cleanup
   */
  async softDeleteByProjectId(
    projectId: string,
    workspaceId: string,
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    const deleted = await dbClient
      .update(recordings)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(recordings.projectId, projectId),
          eq(recordings.workspaceId, workspaceId),
          eq(recordings.isDeleted, false)
        )
      )
      .returning({
        recordingId: recordings.recordingId,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingActionRef: recordings.recordingActionRef,
      });

    return deleted;
  }

  /**
   * Find recordings by workspace ID with optional status group filter
   * Defaults to 'AVAILABLE' status group if not specified
   */
  async findByWorkspaceId(
    workspaceId: string,
    statusGroup: RecordingFilters['statusGroup'] = 'AVAILABLE'
  ): Promise<Array<{ recordingId: string; uploadStatus: Recording['uploadStatus'] }>> {
    const statuses = [...getUploadStatusesForGroup(statusGroup ?? 'AVAILABLE')];

    const results = await this.db
      .select({
        recordingId: recordings.recordingId,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .where(
        and(eq(recordings.workspaceId, workspaceId), inArray(recordings.uploadStatus, statuses))
      );

    return results;
  }

  /**
   * Find recordings by project ID with optional status group filter
   * Defaults to 'AVAILABLE' status group if not specified
   */
  async findByProjectId(
    projectId: string,
    statusGroup: RecordingFilters['statusGroup'] = 'AVAILABLE'
  ): Promise<Array<{ recordingId: string; uploadStatus: Recording['uploadStatus'] }>> {
    const statuses = [...getUploadStatusesForGroup(statusGroup ?? 'AVAILABLE')];

    const results = await this.db
      .select({
        recordingId: recordings.recordingId,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .where(and(eq(recordings.projectId, projectId), inArray(recordings.uploadStatus, statuses)));

    return results;
  }

  /**
   * Find recordings by link ID with optional status group filter
   * Defaults to 'AVAILABLE' status group if not specified
   */
  async findByLinkId(
    linkId: string,
    statusGroup: RecordingFilters['statusGroup'] = 'AVAILABLE'
  ): Promise<Array<{ recordingId: string; uploadStatus: Recording['uploadStatus'] }>> {
    const statuses = [...getUploadStatusesForGroup(statusGroup ?? 'AVAILABLE')];

    const results = await this.db
      .select({
        recordingId: recordings.recordingId,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .where(
        and(eq(recordings.recordingLinkId, linkId), inArray(recordings.uploadStatus, statuses))
      );

    return results;
  }

  /**
   * Find deleted workspaces that have orphaned recordings
   * Orphaned recordings are those with ORPHAN status group (pending, available)
   * Filters workspaces based on when they were deleted (deletedAt between startDate and endDate)
   * Used by sweep job to trigger workspace cleanup
   */
  async findWorkspacesWithOrphanedRecordings(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ workspaceId: string }>> {
    const orphanStatuses = [...getUploadStatusesForGroup('ORPHAN')];

    const results = await this.db
      .selectDistinct({
        workspaceId: recordings.workspaceId,
      })
      .from(recordings)
      .innerJoin(workspaces, eq(workspaces.workspaceId, recordings.workspaceId))
      .where(
        and(
          eq(workspaces.isDeleted, true),
          inArray(recordings.uploadStatus, orphanStatuses),
          sql`${workspaces.deletedAt} >= ${startDate}`,
          sql`${workspaces.deletedAt} < ${endDate}`
        )
      );

    return results;
  }

  /**
   * Find deleted projects that have orphaned recordings
   * Orphaned recordings are those with ORPHAN status group (pending, available)
   * Filters projects based on when they were deleted (deletedAt between startDate and endDate)
   * Used by daily sweep job to trigger project cleanup
   */
  async findProjectsWithOrphanedRecordings(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ projectId: string }>> {
    const orphanStatuses = [...getUploadStatusesForGroup('ORPHAN')];

    const results = await this.db
      .selectDistinct({
        projectId: recordings.projectId,
      })
      .from(recordings)
      .innerJoin(projects, eq(projects.projectId, recordings.projectId))
      .where(
        and(
          eq(projects.isDeleted, true),
          inArray(recordings.uploadStatus, orphanStatuses),
          sql`${projects.deletedAt} >= ${startDate}`,
          sql`${projects.deletedAt} < ${endDate}`
        )
      );

    return results;
  }

  /**
   * Find deleted recordings from active workspaces and projects
   * Returns recordings that were deleted (deletedAt between startDate and endDate)
   * But belong to workspaces and projects that are still active (not deleted)
   * Used by daily sweep job to trigger recording cleanup
   */
  async findDeletedRecordingsFromActiveEntities(
    startDate: Date,
    endDate: Date
  ): Promise<
    Array<{
      recordingId: string;
      uploadStatus: Recording['uploadStatus'];
    }>
  > {
    const results = await this.db
      .select({
        recordingId: recordings.recordingId,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .innerJoin(projects, eq(projects.projectId, recordings.projectId))
      .innerJoin(workspaces, eq(workspaces.workspaceId, recordings.workspaceId))
      .where(
        and(
          eq(recordings.isDeleted, true),
          eq(projects.isDeleted, false),
          eq(workspaces.isDeleted, false),
          sql`${recordings.deletedAt} >= ${startDate}`,
          sql`${recordings.deletedAt} < ${endDate}`
        )
      );

    return results;
  }
}
