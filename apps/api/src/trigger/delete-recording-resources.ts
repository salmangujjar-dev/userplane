import { task, logger } from '@trigger.dev/sdk/v3';
import { db } from '@/api/clients/db';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import {
  getVideoStorage,
  getThumbnailsStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
} from '@/api/clients/storage';
import { recordings } from '@workspace/db';
import { eq } from '@workspace/db';
import { TASK_IDS, MAX_DURATIONS } from './constants';

interface DeleteRecordingResourcesPayload {
  recordingId: string;
}

interface DeleteRecordingResourcesResult {
  success: boolean;
  recordingId: string;
  skipped?: boolean;
  reason?: string;
  filesDeleted?: string[];
  errors?: string[];
}

/**
 * deleteRecordingResources - Cleanup task for recording resources
 * Follows the same pattern as CleanupService
 *
 * Task ID: TASK_IDS.DELETE_RECORDING_RESOURCES
 * Input: { recordingId: string }
 *
 * Flow:
 * 1. Short-circuit check - skip if not found or already purged
 * 2. Mark recording as deleted if not already
 * 3. Delete R2 objects (video, thumbnail, logs)
 * 4. Mark recording as purged
 */
export const deleteRecordingResources = task({
  id: TASK_IDS.DELETE_RECORDING_RESOURCES,
  maxDuration: MAX_DURATIONS.RECORDING_CLEANUP,
  run: async (
    payload: DeleteRecordingResourcesPayload
  ): Promise<DeleteRecordingResourcesResult> => {
    const { recordingId } = payload;

    logger.info('Starting recording resource cleanup', { recordingId });

    const recordingRepo = new RecordingRepository(db);
    const videoStorage = getVideoStorage();
    const thumbnailsStorage = getThumbnailsStorage();
    const consoleLogsStorage = getConsoleLogsStorage();
    const networkLogsStorage = getNetworkLogsStorage();

    // 1. Short-circuit check
    const recording = await recordingRepo.findById(recordingId);

    if (!recording) {
      logger.info('Recording not found, skipping', { recordingId });
      return { success: true, recordingId, skipped: true, reason: 'not_found' };
    }

    if (recording.uploadStatus === 'expired' || recording.uploadStatus === 'purged') {
      logger.info('Recording already cleaned, skipping', {
        recordingId,
        uploadStatus: recording.uploadStatus,
      });
      return { success: true, recordingId, skipped: true, reason: 'already_cleaned' };
    }

    // 2. Mark deleted (if not already)
    if (!recording.isDeleted) {
      await recordingRepo.softDelete(recordingId);
      logger.info('Recording marked as deleted', { recordingId });
    }

    const filesDeleted: string[] = [];
    const errors: string[] = [];

    // 3. Delete R2 objects (following CleanupService pattern)
    if (recording.recordingVideoRef) {
      try {
        await videoStorage.delete(recording.recordingVideoRef);
        filesDeleted.push('video');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`video: ${message}`);
      }
    }

    if (recording.recordingThumbnailRef) {
      try {
        await thumbnailsStorage.delete(recording.recordingThumbnailRef);
        filesDeleted.push('thumbnail');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`thumbnail: ${message}`);
      }
    }

    if (recording.recordingConsoleLogRef) {
      try {
        await consoleLogsStorage.delete(recording.recordingConsoleLogRef);
        filesDeleted.push('console_log');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`console_log: ${message}`);
      }
    }

    if (recording.recordingNetworkLogsRef) {
      try {
        await networkLogsStorage.delete(recording.recordingNetworkLogsRef);
        filesDeleted.push('network_log');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`network_log: ${message}`);
      }
    }

    // 4. Mark as purged if storage cleanup was successful
    const storageSuccess = errors.length === 0;
    if (storageSuccess) {
      try {
        // markAsPurged only works for 'failed' status, so update directly
        await db
          .update(recordings)
          .set({
            uploadStatus: 'purged',
            updatedAt: new Date(),
          })
          .where(eq(recordings.id, recordingId));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`mark_as_purged: ${message}`);
      }
    }

    logger.info('Recording resource cleanup completed', {
      recordingId,
      filesDeleted,
      errors,
    });

    return {
      success: errors.length === 0,
      recordingId,
      filesDeleted,
      errors,
    };
  },
});
