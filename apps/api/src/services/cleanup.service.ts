/**
 * CleanupService - Handles storage/resource cleanup for recordings
 * Deletes storage objects (video, thumbnail, logs)
 * Owns the "purged" state transition - only CleanupService can mark recordings as purged
 *
 * Separation of concerns:
 * - Business logic soft deletes (isDeleted=true) happen in service layer
 * - Storage cleanup and "purged" status happen here in CleanupService
 */

import type {
  VideoStorageClient,
  ThumbnailsStorageClient,
  ConsoleLogsStorageClient,
  NetworkLogsStorageClient,
} from '@workspace/storage';
import type { RecordingRepository } from '@/api/repositories/recordings.repository';

export interface CleanupServiceDeps {
  recordingRepo: RecordingRepository;
  videoStorage: VideoStorageClient;
  thumbnailsStorage: ThumbnailsStorageClient;
  consoleLogsStorage: ConsoleLogsStorageClient;
  networkLogsStorage: NetworkLogsStorageClient;
}

/**
 * File references for cleanup
 */
export interface RecordingFileRefs {
  recordingVideoRef: string | null;
  recordingThumbnailRef: string | null;
  recordingConsoleLogRef: string | null;
  recordingNetworkLogsRef: string | null;
}

/**
 * Result of cleanup operation
 */
export interface CleanupResult {
  success: boolean;
  recordingId: string;
  filesDeleted: string[];
  errors: string[];
}

export class CleanupService {
  constructor(private deps: CleanupServiceDeps) {}

  /**
   * Clean up storage for a recording AND mark as purged
   * This is the ONLY method that can transition recordings to "purged" state
   *
   * Flow:
   * 1. Delete storage objects (video, thumbnail, logs)
   * 2. If successful, mark recording as "purged" in database
   * 3. If storage cleanup fails, recording status unchanged
   *
   * Why delete is safe regardless of upload state:
   * - For in-progress uploads: S3 delete handles partial/multipart uploads via lifecycle policy
   * - For completed uploads: S3 delete removes the object
   * - For never-existed objects: S3 delete is a no-op (idempotent)
   *
   * Use cases:
   * - Failed upload cleanup (failed → purged)
   * - Project deletion cleanup (isDeleted=true, uploadStatus → purged)
   * - Individual recording deletion (isDeleted=true, uploadStatus → purged)
   *
   * @param recordingId - Recording ID to clean up
   * @param fileRefs - Storage paths for the recording files
   * @returns CleanupResult with success status and details
   */
  async cleanupRecording(recordingId: string, fileRefs: RecordingFileRefs): Promise<CleanupResult> {
    const filesDeleted: string[] = [];
    const errors: string[] = [];

    // Delete video
    if (fileRefs.recordingVideoRef) {
      try {
        await this.deps.videoStorage.delete(fileRefs.recordingVideoRef);
        filesDeleted.push('video');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`video: ${message}`);
      }
    }

    // Delete thumbnail
    if (fileRefs.recordingThumbnailRef) {
      try {
        await this.deps.thumbnailsStorage.delete(fileRefs.recordingThumbnailRef);
        filesDeleted.push('thumbnail');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`thumbnail: ${message}`);
      }
    }

    // Delete console logs
    if (fileRefs.recordingConsoleLogRef) {
      try {
        await this.deps.consoleLogsStorage.delete(fileRefs.recordingConsoleLogRef);
        filesDeleted.push('console_log');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`console_log: ${message}`);
      }
    }

    // Delete network logs
    if (fileRefs.recordingNetworkLogsRef) {
      try {
        await this.deps.networkLogsStorage.delete(fileRefs.recordingNetworkLogsRef);
        filesDeleted.push('network_log');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`network_log: ${message}`);
      }
    }

    // Mark as purged if storage cleanup was successful
    const storageSuccess = errors.length === 0;
    if (storageSuccess) {
      try {
        const updated = await this.deps.recordingRepo.markAsPurged(recordingId);
        if (!updated) {
          errors.push('Failed to mark recording as purged');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`mark_as_purged: ${message}`);
      }
    }

    return {
      success: errors.length === 0,
      recordingId,
      filesDeleted,
      errors,
    };
  }
}
