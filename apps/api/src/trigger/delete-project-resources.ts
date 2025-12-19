import { task, logger } from '@trigger.dev/sdk/v3';
import { db } from '@/api/clients/db';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { deleteRecordingResources } from './delete-recording-resources';
import { getPurgeDelay } from '@/api/trigger/delay-calculator';
import { TASK_IDS, MAX_DURATIONS, BATCH_LIMITS } from './constants';
import { buildRecordingDeletionKey } from './idempotency';
import { chunkArray } from '@/api/lib/batch';

interface DeleteProjectResourcesPayload {
  projectId: string;
}

interface DeleteProjectResourcesResult {
  success: boolean;
  projectId: string;
  recordingsScheduled: number;
  skipped?: boolean;
  reason?: string;
}

/**
 * deleteProjectResources - Cleanup task for project resources
 *
 * Task ID: TASK_IDS.DELETE_PROJECT_RESOURCES
 * Input: { projectId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify project is deleted
 * 2. List recordings to clean up
 * 3. Fan-out to deleteRecordingResources using batchTrigger
 */
export const deleteProjectResources = task({
  id: TASK_IDS.DELETE_PROJECT_RESOURCES,
  maxDuration: MAX_DURATIONS.PROJECT_CLEANUP,
  run: async (payload: DeleteProjectResourcesPayload): Promise<DeleteProjectResourcesResult> => {
    const { projectId } = payload;

    logger.info('Starting project resource cleanup', { projectId });

    const projectRepo = new ProjectRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await projectRepo.isSoftDeleted(projectId);

    if (isDeleted === null) {
      logger.info('Project not found, skipping', { projectId });
      return {
        success: true,
        projectId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_found',
      };
    }

    if (!isDeleted) {
      logger.info('Project not deleted, skipping', { projectId });
      return {
        success: true,
        projectId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_deleted',
      };
    }

    // 2. List recordings to clean up
    // Pulls available recordings for deletion
    const recordingsToCleanup = await recordingRepo.findByProjectId(projectId);

    logger.info('Found recordings to cleanup', { projectId, count: recordingsToCleanup.length });

    // 3. Fan-out (use batchTrigger for multiple recordings)
    // Batch into chunks of 500 (Trigger.dev limit) to handle large numbers of recordings
    if (recordingsToCleanup.length > 0) {
      const recordingChunks = chunkArray(recordingsToCleanup, BATCH_LIMITS.MAX_BATCH_SIZE);

      logger.info('Batching recording cleanup triggers', {
        projectId,
        totalRecordings: recordingsToCleanup.length,
        batchCount: recordingChunks.length,
        batchSize: BATCH_LIMITS.MAX_BATCH_SIZE,
      });

      for (const [index, chunk] of recordingChunks.entries()) {
        await deleteRecordingResources.batchTrigger(
          chunk.map((recording) => ({
            payload: { recordingId: recording.id },
            options: {
              idempotencyKey: buildRecordingDeletionKey(recording.id),
              delay: getPurgeDelay(recording.uploadStatus),
            },
          }))
        );

        logger.info('Triggered recording cleanup batch', {
          projectId,
          batchIndex: index + 1,
          batchCount: recordingChunks.length,
          recordingsInBatch: chunk.length,
        });
      }

      logger.info('Scheduled recording cleanup tasks', {
        projectId,
        recordingsScheduled: recordingsToCleanup.length,
      });
    }

    return {
      success: true,
      projectId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  },
});
