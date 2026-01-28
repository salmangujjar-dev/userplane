// Initialize Sentry for Trigger.dev workers - must be first import
import './init';

import * as Sentry from '@sentry/bun';
import { logger, task } from '@trigger.dev/sdk/v3';

import { db } from '@/api/clients/db';
import {
  getClientActionsStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
  getThumbnailsStorage,
  getVideoStorage,
} from '@/api/clients/storage';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { withSentryTrigger } from '@/api/sentry';

import { MAX_DURATIONS, TASK_IDS } from './constants';

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
  run: withSentryTrigger(
    async (payload: DeleteRecordingResourcesPayload): Promise<DeleteRecordingResourcesResult> => {
      const { recordingId } = payload;

      logger.info('Starting recording resource cleanup', { recordingId });

      const recordingRepo = new RecordingRepository(db);
      const videoStorage = getVideoStorage();
      const thumbnailsStorage = getThumbnailsStorage();
      const consoleLogsStorage = getConsoleLogsStorage();
      const networkLogsStorage = getNetworkLogsStorage();
      const clientActionsStorage = getClientActionsStorage();

      // 1. Short-circuit check
      const recording = await recordingRepo.findByIdWithStatusGroup(recordingId, 'AVAILABLE');

      if (!recording) {
        logger.info('Recording not found, skipping', { recordingId });
        return { success: true, recordingId, skipped: true, reason: 'not_found' };
      }

      const filesDeleted: string[] = [];
      const errors: string[] = [];

      // 2. Delete R2 objects (following CleanupService pattern)
      if (recording.recordingVideoRef) {
        try {
          await videoStorage.delete(recording.recordingVideoRef);
          filesDeleted.push('video');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`video: ${message}`);

          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              operation: 'storage_cleanup',
              resource_type: 'video',
              recording_id: recordingId,
            },
            contexts: {
              cleanup: {
                recording_id: recordingId,
                file_type: 'video',
                reference: recording.recordingVideoRef,
              },
            },
          });
        }
      }

      if (recording.recordingThumbnailRef) {
        try {
          await thumbnailsStorage.delete(recording.recordingThumbnailRef);
          filesDeleted.push('thumbnail');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`thumbnail: ${message}`);

          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              operation: 'storage_cleanup',
              resource_type: 'thumbnail',
              recording_id: recordingId,
            },
            contexts: {
              cleanup: {
                recording_id: recordingId,
                file_type: 'thumbnail',
                reference: recording.recordingThumbnailRef,
              },
            },
          });
        }
      }

      if (recording.recordingConsoleLogRef) {
        try {
          await consoleLogsStorage.delete(recording.recordingConsoleLogRef);
          filesDeleted.push('console_log');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`console_log: ${message}`);

          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              operation: 'storage_cleanup',
              resource_type: 'console_log',
              recording_id: recordingId,
            },
            contexts: {
              cleanup: {
                recording_id: recordingId,
                file_type: 'console_log',
                reference: recording.recordingConsoleLogRef,
              },
            },
          });
        }
      }

      if (recording.recordingNetworkLogsRef) {
        try {
          await networkLogsStorage.delete(recording.recordingNetworkLogsRef);
          filesDeleted.push('network_log');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`network_log: ${message}`);

          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              operation: 'storage_cleanup',
              resource_type: 'network_log',
              recording_id: recordingId,
            },
            contexts: {
              cleanup: {
                recording_id: recordingId,
                file_type: 'network_log',
                reference: recording.recordingNetworkLogsRef,
              },
            },
          });
        }
      }

      if (recording.recordingActionRef) {
        try {
          await clientActionsStorage.delete(recording.recordingActionRef);
          filesDeleted.push('action');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`action: ${message}`);

          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              operation: 'storage_cleanup',
              resource_type: 'action',
              recording_id: recordingId,
            },
            contexts: {
              cleanup: {
                recording_id: recordingId,
                file_type: 'action',
                reference: recording.recordingActionRef,
              },
            },
          });
        }
      }

      // 3. Mark as purged if storage cleanup was successful
      const storageSuccess = errors.length === 0;
      if (storageSuccess) {
        try {
          await recordingRepo.markAsPurged(recordingId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`mark_as_purged: ${message}`);

          Sentry.captureException(error, {
            level: 'error',
            tags: {
              operation: 'mark_as_purged',
              recording_id: recordingId,
            },
            contexts: {
              cleanup: {
                recording_id: recordingId,
                step: 'mark_as_purged',
              },
            },
          });
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
    }
  ),
});
