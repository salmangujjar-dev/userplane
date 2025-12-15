/**
 * RecordingRepository - Data access layer for recordings
 * Handles all database operations for recording entities
 */

import { eq, and, count, desc, asc, or, inArray, lt } from '@workspace/db';
import type { DbClient, Recording } from '@workspace/db';
import { recordings, workspaceMembers, user, links, projects, domains } from '@workspace/db';
import type { RecordingFilters, RecordingSortOptions } from '@/api/types';
import { getUploadStatusesForGroup } from '@/api/schema/recording.schema';
import {
  recordingMetaSchema,
  type RecordingMeta,
  type RecordingSystemMetadata,
  type RecordingCustomMetadata,
  type RecordingInternalMetadata,
} from '@/api/schema/recording-meta.schema';

export type {
  RecordingMeta,
  RecordingSystemMetadata,
  RecordingCustomMetadata,
  RecordingInternalMetadata,
};

/**
 * Shape of recording list item with joined data
 */
export interface RecordingListRow {
  id: string;
  recordingThumbnailRef: string | null;
  recordingDuration: number | null;
  createdAt: Date;
  creatorId: string;
  creatorName: string;
}

/**
 * Shape of recording detail with all joined data
 * Uses inferred types from database schema to avoid duplication
 */
export interface RecordingDetailRow {
  id: string;
  workspaceId: string;
  projectId: string;
  recordingLinkId: string;
  uploadStatus: Recording['uploadStatus'];
  recordingVideoRef: string | null;
  recordingThumbnailRef: string | null;
  recordingConsoleLogRef: string | null;
  recordingNetworkLogsRef: string | null;
  recordingMeta: RecordingMeta | null;
  recordingDuration: number | null;
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
  projectTitle: string | null;
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
  id: string;
  recordingLinkId: string;
  workspaceId: string;
  projectId: string;
  createdBy: string;
  recordingDuration: number;
  recordingVideoRef: string | null;
  recordingThumbnailRef: string | null;
  recordingConsoleLogRef: string | null;
  recordingNetworkLogsRef: string | null;
  recordingMeta?: RecordingMeta | null;
}

/**
 * Recording file info stored in metadata
 */
export interface RecordingFileInfo {
  videoSize: number | null;
  thumbnailSize: number | null;
  consoleLogSize: number | null;
  networkLogSize: number | null;
}

export class RecordingRepository {
  constructor(private db: DbClient) {}

  /**
   * Transform and validate recording metadata from database
   * Uses Zod for version-aware validation and type safety
   *
   * @param raw - Raw metadata from database (unknown type from jsonb)
   * @returns Typed and validated RecordingMeta or null
   */
  private transformRecordingMeta(raw: unknown): RecordingMeta | null {
    if (!raw) return null;

    // Use Zod to parse and validate the metadata
    const result = recordingMetaSchema.safeParse(raw);

    if (!result.success) {
      console.warn('[RecordingRepository] Invalid recordingMeta', {
        errors: result.error.errors,
        raw,
      });
      return null;
    }

    return result.data;
  }

  /**
   * Merge internal metadata updates into existing metadata
   * Preserves user-provided metadata while updating system operational data
   *
   * @param existingMeta - Raw metadata from database (unknown type)
   * @param internalUpdates - Internal metadata fields to merge
   * @returns Merged metadata object or undefined if no updates
   */
  private mergeInternalMetadata(
    existingMeta: unknown,
    internalUpdates: Partial<RecordingInternalMetadata>
  ): RecordingMeta | { internalMetadata: Partial<RecordingInternalMetadata> } | undefined {
    const parsedMeta = this.transformRecordingMeta(existingMeta);

    if (parsedMeta) {
      return {
        ...parsedMeta,
        internalMetadata: {
          ...(parsedMeta.internalMetadata ?? {}),
          ...internalUpdates,
        },
      };
    }

    // If no existing metadata and we have updates, create minimal structure
    const hasUpdates = Object.values(internalUpdates).some((v) => v !== undefined);
    return hasUpdates ? { internalMetadata: internalUpdates } : undefined;
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
        return direction(recordings.recordingDuration);
      case 'created_at':
      default:
        return direction(recordings.createdAt);
    }
  }

  /**
   * Find recordings by workspace ID with pagination and optional filters
   * Uses JOINs to fetch creator name in a single query
   * All filtering and sorting happens at the database level
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
        id: recordings.id,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingDuration: recordings.recordingDuration,
        createdAt: recordings.createdAt,
        creatorId: workspaceMembers.id,
        creatorName: user.name,
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.id))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Count recordings in a workspace with optional filters
   * Uses the same filtering logic as the paginated query
   */
  async countByWorkspace(workspaceId: string, filters?: RecordingFilters): Promise<number> {
    const whereConditions = this.buildWhereConditions(workspaceId, filters);

    const [result] = await this.db
      .select({ count: count() })
      .from(recordings)
      .where(whereConditions);

    return Number(result?.count || 0);
  }

  /**
   * Find recording by ID
   */
  async findById(id: string) {
    const [recording] = await this.db
      .select()
      .from(recordings)
      .where(and(eq(recordings.id, id), eq(recordings.isDeleted, false)))
      .limit(1);

    return recording || null;
  }

  /**
   * Find recording by ID with status group filter
   * Defaults to 'AVAILABLE' status group if not specified
   */
  async findByIdWithStatusGroup(
    id: string,
    statusGroup: RecordingFilters['statusGroup'] = 'AVAILABLE'
  ) {
    const statuses = [...getUploadStatusesForGroup(statusGroup ?? 'AVAILABLE')];

    const [recording] = await this.db
      .select()
      .from(recordings)
      .where(
        and(
          eq(recordings.id, id),
          eq(recordings.isDeleted, false),
          inArray(recordings.uploadStatus, statuses)
        )
      )
      .limit(1);

    return recording || null;
  }

  /**
   * Find recording by ID with all related data joined and status group filter
   * Defaults to 'AVAILABLE' status group if not specified
   * Returns full recording details including recording link, creator, project, and domain
   */
  async findByIdWithDetailsAndStatusGroup(
    id: string,
    statusGroup: RecordingFilters['statusGroup'] = 'AVAILABLE'
  ): Promise<RecordingDetailRow | null> {
    const statuses = [...getUploadStatusesForGroup(statusGroup ?? 'AVAILABLE')];

    const [result] = await this.db
      .select({
        // Recording fields
        id: recordings.id,
        workspaceId: recordings.workspaceId,
        projectId: recordings.projectId,
        recordingLinkId: recordings.recordingLinkId,
        uploadStatus: recordings.uploadStatus,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingMeta: recordings.recordingMeta,
        recordingDuration: recordings.recordingDuration,
        createdAt: recordings.createdAt,
        updatedAt: recordings.updatedAt,
        // Creator info
        creatorId: workspaceMembers.id,
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
        domainId: domains.id,
        domainUrl: domains.domainUrl,
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.id))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(links, eq(recordings.recordingLinkId, links.id))
      .innerJoin(projects, eq(recordings.projectId, projects.id))
      .innerJoin(domains, eq(links.domainId, domains.id))
      .where(
        and(
          eq(recordings.id, id),
          eq(recordings.isDeleted, false),
          inArray(recordings.uploadStatus, statuses)
        )
      )
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      recordingMeta: this.transformRecordingMeta(result.recordingMeta),
    };
  }

  /**
   * Find recording by ID with all related data joined
   * Returns full recording details including recording link, creator, project, and domain
   */
  async findByIdWithDetails(id: string): Promise<RecordingDetailRow | null> {
    const [result] = await this.db
      .select({
        // Recording fields
        id: recordings.id,
        workspaceId: recordings.workspaceId,
        projectId: recordings.projectId,
        recordingLinkId: recordings.recordingLinkId,
        uploadStatus: recordings.uploadStatus,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingMeta: recordings.recordingMeta,
        recordingDuration: recordings.recordingDuration,
        createdAt: recordings.createdAt,
        updatedAt: recordings.updatedAt,
        // Creator info
        creatorId: workspaceMembers.id,
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
        domainId: domains.id,
        domainUrl: domains.domainUrl,
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.id))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(links, eq(recordings.recordingLinkId, links.id))
      .innerJoin(projects, eq(recordings.projectId, projects.id))
      .innerJoin(domains, eq(links.domainId, domains.id))
      .where(and(eq(recordings.id, id), eq(recordings.isDeleted, false)))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      recordingMeta: this.transformRecordingMeta(result.recordingMeta),
    };
  }

  /**
   * Check if recording is soft-deleted
   * Returns true if recording exists but is marked as deleted
   */
  async isSoftDeleted(id: string) {
    const [recording] = await this.db
      .select({
        id: recordings.id,
        isDeleted: recordings.isDeleted,
      })
      .from(recordings)
      .where(eq(recordings.id, id))
      .limit(1);

    return recording ? recording.isDeleted : null;
  }

  /**
   * Soft delete a recording
   * Marks the recording as deleted without removing it from the database
   */
  async softDelete(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [deleted] = await dbClient
      .update(recordings)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(and(eq(recordings.id, id), eq(recordings.isDeleted, false)))
      .returning();

    return deleted || null;
  }

  /**
   * Create a new recording with pending status
   * isDeleted is set to true because pending recordings should not be visible to users
   * until they become available or partial
   */
  async create(data: CreateRecordingInput, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [recording] = await dbClient
      .insert(recordings)
      .values({
        id: data.id,
        recordingLinkId: data.recordingLinkId,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        createdBy: data.createdBy,
        recordingDuration: data.recordingDuration,
        recordingVideoRef: data.recordingVideoRef,
        recordingThumbnailRef: data.recordingThumbnailRef,
        recordingConsoleLogRef: data.recordingConsoleLogRef,
        recordingNetworkLogsRef: data.recordingNetworkLogsRef,
        recordingMeta: data.recordingMeta,
        uploadStatus: 'pending',
        isDeleted: true,
      })
      .returning();

    return recording;
  }

  /**
   * Update recording upload status to available
   * Can transition from pending or partial
   * Sets isDeleted to false so recording becomes visible to users
   */
  async markAsAvailable(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(recordings)
      .set({
        uploadStatus: 'available',
        isDeleted: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recordings.id, id),
          or(eq(recordings.uploadStatus, 'pending'), eq(recordings.uploadStatus, 'partial'))
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Update recording upload status to partial
   * Video uploaded, some secondary files missing
   * Sets isDeleted to false so recording becomes visible to users
   */
  async markAsPartial(
    id: string,
    uploadedFiles: {
      video: boolean;
      thumbnail: boolean;
      consoleLog?: boolean;
      networkLog?: boolean;
    },
    options?: { tx?: Transaction }
  ) {
    const dbClient = options?.tx || this.db;

    // Fetch existing recording to preserve metadata
    const [existing] = await dbClient
      .select({
        recordingMeta: recordings.recordingMeta,
      })
      .from(recordings)
      .where(eq(recordings.id, id))
      .limit(1);

    // Merge uploaded files into existing metadata
    const updatedMeta = this.mergeInternalMetadata(existing?.recordingMeta, { uploadedFiles });

    const [updated] = await dbClient
      .update(recordings)
      .set({
        uploadStatus: 'partial',
        isDeleted: false,
        recordingMeta: updatedMeta,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recordings.id, id),
          or(eq(recordings.uploadStatus, 'pending'), eq(recordings.uploadStatus, 'partial'))
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Update recording upload status to failed
   * Can transition from pending or partial
   * Sets isDeleted to true so failed recordings are hidden from users
   */
  async markAsFailed(id: string, reason?: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    // Fetch existing recording to preserve metadata
    const [existing] = await dbClient
      .select({
        recordingMeta: recordings.recordingMeta,
      })
      .from(recordings)
      .where(eq(recordings.id, id))
      .limit(1);

    // Merge failure reason into existing metadata
    const updatedMeta = this.mergeInternalMetadata(existing?.recordingMeta, {
      failureReason: reason,
    });

    const [updated] = await dbClient
      .update(recordings)
      .set({
        uploadStatus: 'failed',
        isDeleted: true,
        recordingMeta: updatedMeta,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recordings.id, id),
          or(eq(recordings.uploadStatus, 'pending'), eq(recordings.uploadStatus, 'partial'))
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Get recording with file paths for verification
   */
  async findByIdWithFilePaths(id: string): Promise<{
    id: string;
    recordingLinkId: string;
    workspaceId: string;
    uploadStatus: Recording['uploadStatus'];
    recordingVideoRef: string | null;
    recordingThumbnailRef: string | null;
    recordingConsoleLogRef: string | null;
    recordingNetworkLogsRef: string | null;
    recordingMeta: RecordingMeta | null;
  } | null> {
    const [result] = await this.db
      .select({
        id: recordings.id,
        recordingLinkId: recordings.recordingLinkId,
        workspaceId: recordings.workspaceId,
        uploadStatus: recordings.uploadStatus,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingMeta: recordings.recordingMeta,
      })
      .from(recordings)
      .where(and(eq(recordings.id, id), eq(recordings.isDeleted, false)))
      .limit(1);

    if (!result) return null;

    return {
      ...result,
      recordingMeta: this.transformRecordingMeta(result.recordingMeta),
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
        id: recordings.id,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
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
  async markAsPurged(id: string, options?: { tx?: Transaction }) {
    const dbClient = options?.tx || this.db;

    const [updated] = await dbClient
      .update(recordings)
      .set({
        uploadStatus: 'purged',
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(recordings.id, id))
      .returning();

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
        id: recordings.id,
        recordingVideoRef: recordings.recordingVideoRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
      });

    return deleted;
  }

  /**
   * Find recordings that need cleanup by workspace ID
   * Returns only recordings that are not expired or purged
   */
  async findForCleanupByWorkspaceId(
    workspaceId: string
  ): Promise<Array<{ id: string; uploadStatus: Recording['uploadStatus'] }>> {
    const results = await this.db
      .select({
        id: recordings.id,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .where(
        and(
          eq(recordings.workspaceId, workspaceId),
          or(
            eq(recordings.uploadStatus, 'pending'),
            eq(recordings.uploadStatus, 'partial'),
            eq(recordings.uploadStatus, 'available'),
            eq(recordings.uploadStatus, 'failed')
          )
        )
      );

    return results;
  }

  /**
   * Find recordings that need cleanup by project ID
   * Returns only recordings that are not expired or purged
   */
  async findForCleanupByProjectId(
    projectId: string
  ): Promise<Array<{ id: string; uploadStatus: Recording['uploadStatus'] }>> {
    const results = await this.db
      .select({
        id: recordings.id,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .where(
        and(
          eq(recordings.projectId, projectId),
          or(
            eq(recordings.uploadStatus, 'pending'),
            eq(recordings.uploadStatus, 'partial'),
            eq(recordings.uploadStatus, 'available'),
            eq(recordings.uploadStatus, 'failed')
          )
        )
      );

    return results;
  }

  /**
   * Find recordings that need cleanup by link ID
   * Returns only recordings that are not expired or purged
   */
  async findForCleanupByLinkId(
    linkId: string
  ): Promise<Array<{ id: string; uploadStatus: Recording['uploadStatus'] }>> {
    const results = await this.db
      .select({
        id: recordings.id,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .where(
        and(
          eq(recordings.recordingLinkId, linkId),
          or(
            eq(recordings.uploadStatus, 'pending'),
            eq(recordings.uploadStatus, 'partial'),
            eq(recordings.uploadStatus, 'available'),
            eq(recordings.uploadStatus, 'failed')
          )
        )
      );

    return results;
  }

  /**
   * Find orphaned recordings that are soft-deleted but not yet purged
   * Used by sweep job to catch failed cleanup triggers
   */
  async findOrphanedRecordings(
    cutoffDate: Date
  ): Promise<Array<{ id: string; uploadStatus: Recording['uploadStatus'] }>> {
    const results = await this.db
      .select({
        id: recordings.id,
        uploadStatus: recordings.uploadStatus,
      })
      .from(recordings)
      .where(
        and(
          eq(recordings.isDeleted, true),
          or(
            eq(recordings.uploadStatus, 'pending'),
            eq(recordings.uploadStatus, 'partial'),
            eq(recordings.uploadStatus, 'available'),
            eq(recordings.uploadStatus, 'failed')
          ),
          lt(recordings.deletedAt, cutoffDate)
        )
      );

    return results;
  }
}
