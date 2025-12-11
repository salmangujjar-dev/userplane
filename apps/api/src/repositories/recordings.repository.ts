/**
 * RecordingRepository - Data access layer for recordings
 * Handles all database operations for recording entities
 */

import { eq, and, count, desc, asc } from '@workspace/db';
import type { DbClient, Recording } from '@workspace/db';
import {
  recordings,
  workspaceMembers,
  user,
  recordingLinks,
  projects,
  domains,
} from '@workspace/db';
import type { RecordingFilters, RecordingSortOptions } from '@/api/types';

/**
 * System metadata captured during recording
 */
export interface RecordingSystemMetadata {
  date: string;
  time: string;
  browser: string;
  os: string;
  windowSize: {
    width: number;
    height: number;
  };
}

/**
 * Custom metadata - arbitrary key-value pairs
 */
export type RecordingCustomMetadata = Record<string, unknown>;

/**
 * Recording metadata structure
 * Versioned for backward compatibility
 */
export interface RecordingMeta {
  version: number;
  systemMetadata: RecordingSystemMetadata;
  customMetadata: RecordingCustomMetadata;
}

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
  recordingMediaRef: string | null;
  recordingConsoleLogRef: string | null;
  recordingNetworkLogsRef: string | null;
  recordingThumbnailRef: string | null;
  recordingMeta: RecordingMeta | null;
  recordingDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Creator info
  creatorId: string;
  creatorName: string;
  // Recording link info
  linkGUID: string;
  linkTitle: string | null;
  linkProviderType: string | null;
  linkProviderId: string | null;
  linkProviderRef: string | null;
  linkProviderData: unknown;
  linkCreatedAt: Date;
  // Project info
  projectTitle: string | null;
  projectPath: string;
  // Domain info
  domainId: string;
  domainUrl: string;
}

/**
 * Transaction type for repository operations
 */
export type Transaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

export class RecordingRepository {
  constructor(private db: DbClient) {}

  /**
   * Build WHERE conditions for recording queries
   * Handles workspaceId and optional filters at the SQL level
   */
  private buildWhereConditions(workspaceId: string, filters?: RecordingFilters) {
    const conditions = [eq(recordings.workspaceId, workspaceId), eq(recordings.isDeleted, false)];

    if (filters?.createdBy) {
      conditions.push(eq(recordings.createdBy, filters.createdBy));
    }

    if (filters?.projectId) {
      conditions.push(eq(recordings.projectId, filters.projectId));
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
        recordingMediaRef: recordings.recordingMediaRef,
        recordingConsoleLogRef: recordings.recordingConsoleLogRef,
        recordingNetworkLogsRef: recordings.recordingNetworkLogsRef,
        recordingThumbnailRef: recordings.recordingThumbnailRef,
        recordingMeta: recordings.recordingMeta,
        recordingDuration: recordings.recordingDuration,
        createdAt: recordings.createdAt,
        updatedAt: recordings.updatedAt,
        // Creator info
        creatorId: workspaceMembers.id,
        creatorName: user.name,
        // Recording link info
        linkGUID: recordingLinks.linkGUID,
        linkTitle: recordingLinks.linkTitle,
        linkProviderType: recordingLinks.linkProviderType,
        linkProviderId: recordingLinks.linkProviderId,
        linkProviderRef: recordingLinks.linkProviderRef,
        linkProviderData: recordingLinks.linkProviderData,
        linkCreatedAt: recordingLinks.createdAt,
        // Project info
        projectTitle: projects.projectTitle,
        projectPath: projects.projectPath,
        // Domain info
        domainId: domains.id,
        domainUrl: domains.domainUrl,
      })
      .from(recordings)
      .innerJoin(workspaceMembers, eq(recordings.createdBy, workspaceMembers.id))
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .innerJoin(recordingLinks, eq(recordings.recordingLinkId, recordingLinks.id))
      .innerJoin(projects, eq(recordings.projectId, projects.id))
      .innerJoin(domains, eq(recordingLinks.domainId, domains.id))
      .where(and(eq(recordings.id, id), eq(recordings.isDeleted, false)))
      .limit(1);

    if (!result) {
      return null;
    }

    // Cast jsonb fields to their typed equivalents
    return {
      ...result,
      recordingMeta: result.recordingMeta as RecordingMeta | null,
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
}
