/**
 * RecordingService - Business logic for recording operations
 * Contains validation and business rules for recording management
 */

import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import type { ThumbnailsStorageClient } from '@workspace/storage';
import type { RecordingFilters, RecordingItem, RecordingSortOptions } from '@/api/types';
import type { Transaction } from '@/api/repositories/recordings.repository';

export interface RecordingServiceDeps {
  recordingRepo: RecordingRepository;
  thumbnailsStorage: ThumbnailsStorageClient;
}

/**
 * Maximum items per page for pagination
 */
const MAX_PER_PAGE = 20;

/**
 * Default items per page
 */
const DEFAULT_PER_PAGE = 10;

export class RecordingService {
  constructor(private deps: RecordingServiceDeps) {}

  /**
   * Transform thumbnail ref to URL
   * Returns null if ref is empty or storage is not configured
   */
  private getThumbnailUrl(recordingId: string, thumbnailRef: string | null): string | null {
    if (!thumbnailRef) {
      return null;
    }

    try {
      return this.deps.thumbnailsStorage.getThumbnailUrl(recordingId, 'webp');
    } catch {
      return null;
    }
  }

  /**
   * Get recordings for a workspace with pagination, filters, and sorting
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

    // Get total count with filters applied at DB level
    const total = await this.deps.recordingRepo.countByWorkspace(workspaceId, filters);

    // Calculate offset for pagination
    const offset = (page - 1) * perPage;

    // Get paginated results with all data joined at DB level
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
      recordingThumbnail: this.getThumbnailUrl(row.id, row.recordingThumbnailRef),
      recordingDuration: row.recordingDuration,
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
   */
  async delete(recordingId: string, workspaceId: string, options?: { tx?: Transaction }) {
    // Get existing recording
    const existingRecording = await this.deps.recordingRepo.findById(recordingId);

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
}
