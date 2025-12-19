/**
 * RecordingService - Business logic for recording operations
 * Contains validation and business rules for recording management
 */

import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { LinkRepository } from '@/api/repositories/links.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import type {
  ThumbnailsStorageClient,
  VideoStorageClient,
  ConsoleLogsStorageClient,
  NetworkLogsStorageClient,
} from '@workspace/storage';
import type {
  RecordingFilters,
  RecordingItem,
  RecordingSortOptions,
  RecordingDetail,
  ResourceResponse,
} from '@/api/types';
import type { Transaction } from '@/api/repositories/recordings.repository';

export interface RecordingServiceDeps {
  recordingRepo: RecordingRepository;
  linkRepo: LinkRepository;
  workspaceMemberRepo: WorkspaceMemberRepository;
  thumbnailsStorage: ThumbnailsStorageClient;
  videoStorage: VideoStorageClient;
  consoleLogsStorage: ConsoleLogsStorageClient;
  networkLogsStorage: NetworkLogsStorageClient;
}

/**
 * Maximum items per page for pagination
 */
const MAX_PER_PAGE = 20;

/**
 * Default items per page
 */
const DEFAULT_PER_PAGE = 10;

/**
 * Presigned URL expiry time in seconds (1 hour)
 */
const PRESIGNED_URL_EXPIRY = 3600;

export class RecordingService {
  constructor(private deps: RecordingServiceDeps) {}

  /**
   * Transform thumbnail ref (stored path) to URL
   * Returns null if ref is empty or storage is not configured
   */
  private getThumbnailUrl(thumbnailRef: string | null): string | null {
    if (!thumbnailRef) {
      return null;
    }

    try {
      return this.deps.thumbnailsStorage.getThumbnailUrl(thumbnailRef);
    } catch {
      return null;
    }
  }

  /**
   * Get recordings for a workspace with pagination, filters, and sorting
   * Defaults to AVAILABLE status group (available)
   * Supports filtering by status groups: AVAILABLE, STALE, UNAVAILABLE, PENDING
   * All filtering and sorting is performed at the database level
   * Default sort: created_at descending (latest first)
   */
  async getByWorkspaceIdPaginated(
    workspaceId: string,
    page: number = 1,
    perPage: number = DEFAULT_PER_PAGE,
    filters?: RecordingFilters,
    sort?: RecordingSortOptions
  ): Promise<{ recordings: RecordingItem[]; total: number }> {
    // Validate pagination params
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > MAX_PER_PAGE) {
      throw new ValidationError(`Per page must be between 1 and ${MAX_PER_PAGE}`);
    }

    // Get total count with filters applied at DB level (defaults to AVAILABLE)
    const total = await this.deps.recordingRepo.countByWorkspace(workspaceId, filters);

    // Calculate offset for pagination
    const offset = (page - 1) * perPage;

    // Get paginated results with all data joined at DB level (defaults to AVAILABLE)
    // Default sort: created_at desc (latest first)
    const rows = await this.deps.recordingRepo.findByWorkspaceIdPaginated(
      workspaceId,
      perPage,
      offset,
      filters,
      sort ?? { field: 'created_at', direction: 'desc' }
    );

    // Map database rows to response shape with thumbnail URL
    const recordings: RecordingItem[] = rows.map((row) => ({
      id: row.id,
      recordingThumbnail: this.getThumbnailUrl(row.recordingThumbnailRef),
      recordingDurationMs: row.recordingDurationMs,
      createdAt: row.createdAt,
      creator: {
        id: row.creatorId,
        name: row.creatorName,
      },
    }));

    return {
      recordings,
      total,
    };
  }

  /**
   * Delete a recording
   * Validates ownership before soft deleting
   * Performs soft delete by marking isDeleted as true
   * Triggers storage cleanup asynchronously
   */
  async delete(recordingId: string, workspaceId: string, options?: { tx?: Transaction }) {
    // Get existing recording with file paths for cleanup
    const existingRecording = await this.deps.recordingRepo.findByIdWithFilePaths(recordingId);

    if (!existingRecording) {
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw new GoneError('Recording has already been deleted');
      }
      throw new NotFoundError('Recording not found');
    }

    // Verify recording belongs to the workspace
    if (existingRecording.workspaceId !== workspaceId) {
      throw new ValidationError('Recording does not belong to this workspace');
    }

    // Perform soft delete
    const deleted = await this.deps.recordingRepo.softDelete(recordingId, options);

    if (!deleted) {
      throw new ValidationError('Failed to delete recording');
    }

    return deleted;
  }

  /**
   * Get recording by ID with full details
   * Defaults to AVAILABLE status group (available)
   * Returns recording metadata and metrics (resources fetched via separate endpoints)
   */
  async getById(recordingId: string, workspaceId: string): Promise<RecordingDetail> {
    const row = await this.deps.recordingRepo.findByIdWithDetailsAndStatusGroup(recordingId);

    if (!row) {
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw new GoneError('Recording has already been deleted');
      }
      throw new NotFoundError('Recording not found');
    }

    if (row.workspaceId !== workspaceId) {
      throw new NotFoundError('Recording not found');
    }

    return {
      id: row.id,
      meta: {
        link: {
          id: row.recordingLinkId,
          title: row.linkTitle,
          providerType: row.linkProviderType,
          providerId: row.linkProviderId,
          providerRef: row.linkProviderRef,
          providerData: row.linkProviderData,
          createdAt: row.linkCreatedAt,
        },
        creator: {
          id: row.creatorId,
          name: row.creatorName,
        },
        project: {
          id: row.projectId,
          title: row.projectTitle,
        },
        domain: {
          id: row.domainId,
          url: row.domainUrl,
        },
        workspaceId: row.workspaceId,
        status: row.uploadStatus,
        recordingMeta: row.recordingMeta,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    };
  }

  /**
   * Get video resource for an available recording
   * Only works with recordings that have uploadStatus = 'available'
   */
  async getVideoResource(recordingId: string, workspaceId: string): Promise<ResourceResponse> {
    const recording = await this.validateAvailableRecordingAccess(recordingId, workspaceId);

    if (!recording.recordingVideoRef) {
      return {
        url: null,
        message: 'Video not available for this recording',
        durationMs: null,
      };
    }

    try {
      const url = await this.deps.videoStorage.getRecordingDownloadUrl(
        recording.recordingVideoRef,
        { expiresIn: PRESIGNED_URL_EXPIRY }
      );
      return {
        url,
        message: 'Video URL generated successfully',
        durationMs: recording.recordingDurationMs,
      };
    } catch {
      return {
        url: null,
        message: 'Failed to generate video URL',
        durationMs: recording.recordingDurationMs,
      };
    }
  }

  /**
   * Get thumbnail resource for an available recording
   * Only works with recordings that have uploadStatus = 'available'
   */
  async getThumbnailResource(recordingId: string, workspaceId: string): Promise<ResourceResponse> {
    const recording = await this.validateAvailableRecordingAccess(recordingId, workspaceId);

    if (!recording.recordingThumbnailRef) {
      return { url: null, message: 'Thumbnail not available for this recording' };
    }

    try {
      const url = await this.deps.thumbnailsStorage.getThumbnailDownloadUrl(
        recording.recordingThumbnailRef,
        { expiresIn: PRESIGNED_URL_EXPIRY }
      );
      return { url, message: 'Thumbnail URL generated successfully' };
    } catch {
      return { url: null, message: 'Failed to generate thumbnail URL' };
    }
  }

  /**
   * Get console log resource for an available recording
   * Only works with recordings that have uploadStatus = 'available'
   */
  async getConsoleLogResource(recordingId: string, workspaceId: string): Promise<ResourceResponse> {
    const recording = await this.validateAvailableRecordingAccess(recordingId, workspaceId);

    if (!recording.recordingConsoleLogRef) {
      return { url: null, message: 'Console logs not available for this recording' };
    }

    try {
      const url = await this.deps.consoleLogsStorage.getDownloadUrl(
        recording.recordingConsoleLogRef,
        {
          expiresIn: PRESIGNED_URL_EXPIRY,
        }
      );
      return {
        url,
        message: 'Console log URL generated successfully',
      };
    } catch {
      return {
        url: null,
        message: 'Failed to generate console log URL',
      };
    }
  }

  /**
   * Get network log resource for an available recording
   * Only works with recordings that have uploadStatus = 'available'
   */
  async getNetworkLogResource(recordingId: string, workspaceId: string): Promise<ResourceResponse> {
    const recording = await this.validateAvailableRecordingAccess(recordingId, workspaceId);

    if (!recording.recordingNetworkLogsRef) {
      return { url: null, message: 'Network logs not available for this recording' };
    }

    try {
      const url = await this.deps.networkLogsStorage.getDownloadUrl(
        recording.recordingNetworkLogsRef,
        { expiresIn: PRESIGNED_URL_EXPIRY }
      );
      return {
        url,
        message: 'Network log URL generated successfully',
      };
    } catch {
      return {
        url: null,
        message: 'Failed to generate network log URL',
      };
    }
  }

  /**
   * Validate available recording exists and belongs to workspace
   * Defaults to AVAILABLE status group (available)
   * Returns the recording if valid, throws otherwise
   */
  private async validateAvailableRecordingAccess(recordingId: string, workspaceId: string) {
    const recording = await this.deps.recordingRepo.findByIdWithStatusGroup(recordingId);

    if (!recording) {
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw new GoneError('Recording has already been deleted');
      }
      throw new NotFoundError('Recording not found');
    }

    if (recording.workspaceId !== workspaceId) {
      throw new NotFoundError('Recording not found');
    }

    return recording;
  }
}
