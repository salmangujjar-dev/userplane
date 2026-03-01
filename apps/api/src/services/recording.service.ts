/**
 * RecordingService - Business logic for recording operations
 * Contains validation and business rules for recording management
 */

import { billingError, recordingError } from '@userplane/contract';
import type {
  ClientActionsStorageClient,
  ConsoleLogsStorageClient,
  NetworkLogsStorageClient,
  ThumbnailsStorageClient,
  VideoStorageClient,
} from '@userplane/storage';

import { inngest } from '@/api/inngest/client';
import { EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import { LinkRepository } from '@/api/repositories/links.repository';
import type { Transaction } from '@/api/repositories/recordings.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { BillingService } from '@/api/services/billing.service';
import type {
  LinkProviderType,
  RecordingDetail,
  RecordingFilters,
  RecordingItem,
  RecordingSortOptions,
  ResourceResponse,
} from '@/api/types';

export interface RecordingServiceDeps {
  recordingRepo: RecordingRepository;
  linkRepo: LinkRepository;
  workspaceMemberRepo: WorkspaceMemberRepository;
  thumbnailsStorage: ThumbnailsStorageClient;
  videoStorage: VideoStorageClient;
  consoleLogsStorage: ConsoleLogsStorageClient;
  networkLogsStorage: NetworkLogsStorageClient;
  clientActionsStorage: ClientActionsStorageClient;
  billingService: BillingService;
}

/**
 * Default items per page
 */
const DEFAULT_PER_PAGE = 10;

/**
 * Presigned URL expiry time in seconds (1 hour)
 */
const PRESIGNED_URL_EXPIRY = 3600;

const logger = createLogger('recording-service');

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
   * Pagination params are validated by the contract schema
   */
  async getByWorkspaceIdPaginated(
    workspaceId: string,
    page: number = 1,
    perPage: number = DEFAULT_PER_PAGE,
    filters?: RecordingFilters,
    sort?: RecordingSortOptions
  ): Promise<{ recordings: RecordingItem[]; total: number }> {
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
      recordingId: row.recordingId,
      recordingThumbnail: this.getThumbnailUrl(row.recordingThumbnailRef),
      recordingDurationMs: row.recordingDurationMs,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      creator: {
        workspaceMemberId: row.creatorId,
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
   * Throws RECORDING_NOT_FOUND if recording doesn't exist
   * Throws RECORDING_GONE if recording already deleted
   * Throws RECORDING_WORKSPACE_MISMATCH if validation fails
   * Throws RECORDING_DELETE_FAILED if soft delete fails
   */
  async delete(recordingId: string, workspaceId: string, options?: { tx?: Transaction }) {
    // Get existing recording with file paths for cleanup
    const existingRecording = await this.deps.recordingRepo.findByIdWithFilePaths(recordingId);

    if (!existingRecording) {
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw recordingError.RECORDING_GONE();
      }
      throw recordingError.RECORDING_NOT_FOUND();
    }

    // Verify recording belongs to the workspace
    if (existingRecording.workspaceId !== workspaceId) {
      throw recordingError.RECORDING_WORKSPACE_MISMATCH();
    }

    // Perform soft delete
    const deleted = await this.deps.recordingRepo.softDelete(recordingId, options);

    if (!deleted) {
      throw recordingError.RECORDING_DELETE_FAILED();
    }

    // Schedule recording resource cleanup
    // Sends event to Inngest to delete storage resources (video, thumbnail, logs, etc.)
    // Note: Inngest failures are non-blocking - recording soft delete has already succeeded
    try {
      const ts = getPurgeDelayTimestamp(existingRecording.uploadStatus);
      await inngest.send({
        name: EVENT_NAMES.DELETE_RECORDING_RESOURCES,
        data: { recordingId },
        id: buildRecordingDeletionKey(recordingId),
        ...(ts ? { ts } : {}),
      });
    } catch (error) {
      // Log but don't fail the request - cleanup is a background task
      // The recording has been soft deleted and cleanup can be retried later
      logger.error({ err: error }, 'Error scheduling recording resource cleanup');
      captureException(error, undefined, { operation: 'schedule_recording_cleanup' });
    }

    return deleted;
  }

  /**
   * Get recording by ID with full details
   * Defaults to AVAILABLE status group (available)
   * Returns recording metadata and metrics (resources fetched via separate endpoints)
   * Throws RECORDING_NOT_FOUND if recording doesn't exist or doesn't belong to workspace
   * Throws RECORDING_GONE if recording has been deleted
   */
  async getById(recordingId: string, workspaceId: string): Promise<RecordingDetail> {
    const row = await this.deps.recordingRepo.findByIdWithDetailsAndStatusGroup(recordingId);

    if (!row) {
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw recordingError.RECORDING_GONE();
      }
      throw recordingError.RECORDING_NOT_FOUND();
    }

    if (row.workspaceId !== workspaceId) {
      throw recordingError.RECORDING_NOT_FOUND();
    }

    return {
      recordingId: row.recordingId,
      recordingDurationMs: row.recordingDurationMs,
      recordingStartedAt: row.recordingStartedAt ?? null,
      meta: {
        link: {
          linkId: row.recordingLinkId,
          title: row.linkTitle,
          providerType: row.linkProviderType as LinkProviderType,
          providerId: row.linkProviderId,
          providerRef: row.linkProviderRef,
          providerData: row.linkProviderData,
          createdAt: row.linkCreatedAt,
        },
        creator: {
          workspaceMemberId: row.creatorId,
          name: row.creatorName,
        },
        project: {
          projectId: row.projectId,
          title: row.projectTitle,
        },
        domain: {
          domainId: row.domainId,
          url: row.domainUrl,
        },
        workspaceId: row.workspaceId,
        status: row.uploadStatus,
        systemMeta: row.systemMeta,
        customMeta: row.customMeta,
        notes: row.notes,
        expiresAt: row.expiresAt,
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
        type: null,
        sources: [],
        durationMs: null,
      };
    }

    try {
      const url = await this.deps.videoStorage.getRecordingDownloadUrl(
        recording.recordingVideoRef,
        { expiresIn: PRESIGNED_URL_EXPIRY }
      );

      // Determine video type based on URL
      const videoType = this.getVideoType(url);

      return {
        url,
        message: 'Video URL generated successfully',
        type: videoType,
        sources: [{ url, type: videoType }],
        durationMs: recording.recordingDurationMs,
      };
    } catch {
      return {
        url: null,
        message: 'Failed to generate video URL',
        type: null,
        sources: [],
        durationMs: recording.recordingDurationMs,
      };
    }
  }

  /**
   * Determine video MIME type from URL
   */
  private getVideoType(url: string): string {
    // Cloudflare Stream uses HLS
    if (url.includes('cloudflarestream.com') || url.includes('.m3u8')) {
      return 'application/x-mpegURL';
    }

    // For R2/direct files, extract extension from path (before query params)
    try {
      const pathname = new URL(url).pathname;
      const extension = pathname.split('.').pop()?.toLowerCase();

      switch (extension) {
        case 'webm':
          return 'video/webm';
        case 'mp4':
          return 'video/mp4';
        case 'ogg':
          return 'video/ogg';
        default:
          return 'video/webm'; // default to webm since that's R2 format
      }
    } catch {
      return 'video/webm'; // fallback to webm
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
   * Returns captureEnabled to indicate current domain preference
   */
  async getConsoleLogResource(recordingId: string, workspaceId: string): Promise<ResourceResponse> {
    const recording = await this.validateAvailableRecordingAccess(recordingId, workspaceId);
    const prefs = await this.deps.recordingRepo.getDomainCapturePreferences(recordingId);
    const captureEnabled = prefs?.captureClientLog ?? false;

    if (!recording.recordingConsoleLogRef) {
      return {
        url: null,
        message: 'Console logs not available for this recording',
        captureEnabled,
      };
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
        captureEnabled,
      };
    } catch {
      return {
        url: null,
        message: 'Failed to generate console log URL',
        captureEnabled,
      };
    }
  }

  /**
   * Get network log resource for an available recording
   * Only works with recordings that have uploadStatus = 'available'
   * Returns captureEnabled to indicate current domain preference
   */
  async getNetworkLogResource(recordingId: string, workspaceId: string): Promise<ResourceResponse> {
    const recording = await this.validateAvailableRecordingAccess(recordingId, workspaceId);
    const prefs = await this.deps.recordingRepo.getDomainCapturePreferences(recordingId);
    const captureEnabled = prefs?.captureNetworkLog ?? false;

    if (!recording.recordingNetworkLogsRef) {
      return {
        url: null,
        message: 'Network logs not available for this recording',
        captureEnabled,
      };
    }

    try {
      const url = await this.deps.networkLogsStorage.getDownloadUrl(
        recording.recordingNetworkLogsRef,
        { expiresIn: PRESIGNED_URL_EXPIRY }
      );
      return {
        url,
        message: 'Network log URL generated successfully',
        captureEnabled,
      };
    } catch {
      return {
        url: null,
        message: 'Failed to generate network log URL',
        captureEnabled,
      };
    }
  }

  /**
   * Get client action resource for an available recording
   * Only works with recordings that have uploadStatus = 'available'
   * Returns captureEnabled to indicate current domain preference
   */
  async getActionResource(recordingId: string, workspaceId: string): Promise<ResourceResponse> {
    const recording = await this.validateAvailableRecordingAccess(recordingId, workspaceId);
    const prefs = await this.deps.recordingRepo.getDomainCapturePreferences(recordingId);
    const captureEnabled = prefs?.captureClientAction ?? false;

    if (!recording.recordingActionRef) {
      return {
        url: null,
        message: 'Client actions not available for this recording',
        captureEnabled,
      };
    }

    try {
      const url = await this.deps.clientActionsStorage.getDownloadUrl(
        recording.recordingActionRef,
        { expiresIn: PRESIGNED_URL_EXPIRY }
      );
      return {
        url,
        message: 'Client action URL generated successfully',
        captureEnabled,
      };
    } catch {
      return {
        url: null,
        message: 'Failed to generate client action URL',
        captureEnabled,
      };
    }
  }

  /**
   * Validate available recording exists and belongs to workspace
   * Defaults to AVAILABLE status group (available)
   * Returns the recording if valid, throws otherwise
   * Throws RECORDING_NOT_FOUND if recording doesn't exist or doesn't belong to workspace
   * Throws RECORDING_GONE if recording has been deleted
   */
  private async validateAvailableRecordingAccess(recordingId: string, workspaceId: string) {
    const recording = await this.deps.recordingRepo.findByIdWithStatusGroup(recordingId);

    if (!recording) {
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw recordingError.RECORDING_GONE();
      }
      throw recordingError.RECORDING_NOT_FOUND();
    }

    if (recording.workspaceId !== workspaceId) {
      throw recordingError.RECORDING_NOT_FOUND();
    }

    return recording;
  }

  /**
   * Update the expiresAt date for a recording
   * Validates workspace membership before updating
   */
  async updateExpiresAt(recordingId: string, workspaceId: string, expiresAt: Date | null) {
    const recording = await this.deps.recordingRepo.findByIdWithStatusGroup(recordingId);

    if (!recording) {
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw recordingError.RECORDING_GONE();
      }
      throw recordingError.RECORDING_NOT_FOUND();
    }

    if (recording.workspaceId !== workspaceId) {
      throw recordingError.RECORDING_WORKSPACE_MISMATCH();
    }

    // Validate feature gate for custom expiration
    if (expiresAt !== null) {
      const featureGates = await this.deps.billingService.getFeatureGates(workspaceId);

      if (!featureGates.customizeRetentionPolicy) {
        throw billingError.PLAN_FEATURE_UNAVAILABLE({
          feature: 'customizeRetentionPolicy',
        });
      }
    }

    const updated = await this.deps.recordingRepo.updateExpiresAt(recordingId, expiresAt);
    if (!updated) {
      throw recordingError.RECORDING_UPDATE_FAILED();
    }

    return updated;
  }

  /**
   * Count recordings in workspace by status group
   * Returns the total number of recordings with the specified status group in the workspace
   */
  async countByWorkspace(
    workspaceId: string,
    filters?: {
      statusGroup?: 'AVAILABLE' | 'PENDING' | 'TERMINAL' | 'STALE' | 'ORPHAN' | 'UNAVAILABLE';
    }
  ): Promise<number> {
    return this.deps.recordingRepo.countByWorkspace(workspaceId, filters);
  }
}
