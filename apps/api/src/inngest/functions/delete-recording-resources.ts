import * as Sentry from '@sentry/node';
import { createAppLogger } from '@workspace/logger';

import { db } from '@/api/clients/db';
import {
  getClientActionsStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
  getThumbnailsStorage,
  getVideoStorage,
} from '@/api/clients/storage';
import { inngest } from '@/api/inngest/client';
import { EVENT_NAMES } from '@/api/inngest/constants';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { withSentryInngest } from '@/api/sentry';

const logger = createAppLogger('inngest:delete-recording-resources');

/**
 * deleteRecordingResources - Cleanup function for recording resources
 *
 * Event: recording/delete-resources
 * Input: { recordingId: string }
 *
 * Flow:
 * 1. Short-circuit check - skip if not found or already purged
 * 2. Delete R2 objects (video, thumbnail, logs)
 * 3. Mark recording as purged
 */
export const deleteRecordingResources = inngest.createFunction(
  {
    id: EVENT_NAMES.DELETE_RECORDING_RESOURCES,
    retries: 3,
  },
  { event: EVENT_NAMES.DELETE_RECORDING_RESOURCES },
  withSentryInngest(async ({ event, step }) => {
    const { recordingId } = event.data;

    logger.info('Starting recording resource cleanup', { recordingId });

    const recordingRepo = new RecordingRepository(db);
    const videoStorage = getVideoStorage();
    const thumbnailsStorage = getThumbnailsStorage();
    const consoleLogsStorage = getConsoleLogsStorage();
    const networkLogsStorage = getNetworkLogsStorage();
    const clientActionsStorage = getClientActionsStorage();

    // 1. Short-circuit check
    const recording = await step.run('check-recording', async () => {
      return recordingRepo.findByIdWithStatusGroup(recordingId, 'AVAILABLE');
    });

    if (!recording) {
      logger.info('Recording not found, skipping', { recordingId });
      return { success: true, recordingId, skipped: true, reason: 'not_found' };
    }

    const filesDeleted: string[] = [];
    const errors: string[] = [];

    // 2. Delete R2 objects
    await step.run('delete-storage-objects', async () => {
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
          });
        }
      }
    });

    // 3. Mark as purged if storage cleanup was successful
    const storageSuccess = errors.length === 0;
    if (storageSuccess) {
      await step.run('mark-as-purged', async () => {
        try {
          await recordingRepo.markAsPurged(recordingId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`mark_as_purged: ${message}`);
          Sentry.captureException(error, {
            level: 'error',
            tags: { operation: 'mark_as_purged', recording_id: recordingId },
          });
        }
      });
    }

    logger.info('Recording resource cleanup completed', { recordingId, filesDeleted, errors });

    return {
      success: errors.length === 0,
      recordingId,
      filesDeleted,
      errors,
    };
  })
);
