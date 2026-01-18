import { logger, task } from '@trigger.dev/sdk/v3';

import { db } from '@/api/clients/db';
import { chunkArray } from '@/api/lib/batch';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';

import { BATCH_LIMITS, MAX_DURATIONS, TASK_IDS } from './constants';
import { getPurgeDelay } from './delay-calculator';
import { deleteRecordingResources } from './delete-recording-resources';
import { buildRecordingDeletionKey } from './idempotency';

interface DeleteWorkspaceResourcesPayload {
  workspaceId: string;
}

interface DeleteWorkspaceResourcesResult {
  success: boolean;
  workspaceId: string;
  recordingsScheduled: number;
  skipped?: boolean;
  reason?: string;
}

/**
 * deleteWorkspaceResources - Cleanup task for workspace resources
 *
 * Task ID: TASK_IDS.DELETE_WORKSPACE_RESOURCES
 * Input: { workspaceId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify workspace is deleted
 * 2. List recordings to clean up
 * 3. Fan-out to deleteRecordingResources using batchTrigger
 */
export const deleteWorkspaceResources = task({
  id: TASK_IDS.DELETE_WORKSPACE_RESOURCES,
  maxDuration: MAX_DURATIONS.WORKSPACE_CLEANUP,
  run: async (
    payload: DeleteWorkspaceResourcesPayload
  ): Promise<DeleteWorkspaceResourcesResult> => {
    const { workspaceId } = payload;

    logger.info('Starting workspace resource cleanup', { workspaceId });

    const workspaceRepo = new WorkspaceRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await workspaceRepo.isSoftDeleted(workspaceId);

    if (isDeleted === null) {
      logger.info('Workspace not found, skipping', { workspaceId });
      return {
        success: true,
        workspaceId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_found',
      };
    }

    if (!isDeleted) {
      logger.info('Workspace not deleted, skipping', { workspaceId });
      return {
        success: true,
        workspaceId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_deleted',
      };
    }

    // 2. List recordings to clean up
    // Pulls available recordings for deletion
    const recordingsToCleanup = await recordingRepo.findByWorkspaceId(workspaceId);

    logger.info('Found recordings to cleanup', { workspaceId, count: recordingsToCleanup.length });

    // 3. Fan-out (use batchTrigger for multiple recordings)
    // Batch into chunks of 500 (Trigger.dev limit) to handle large numbers of recordings
    if (recordingsToCleanup.length > 0) {
      const recordingChunks = chunkArray(recordingsToCleanup, BATCH_LIMITS.MAX_BATCH_SIZE);

      logger.info('Batching recording cleanup triggers', {
        workspaceId,
        totalRecordings: recordingsToCleanup.length,
        batchCount: recordingChunks.length,
        batchSize: BATCH_LIMITS.MAX_BATCH_SIZE,
      });

      for (const [index, chunk] of recordingChunks.entries()) {
        await deleteRecordingResources.batchTrigger(
          chunk.map((recording) => ({
            payload: { recordingId: recording.recordingId },
            options: {
              idempotencyKey: buildRecordingDeletionKey(recording.recordingId),
              delay: getPurgeDelay(recording.uploadStatus),
            },
          }))
        );

        logger.info('Triggered recording cleanup batch', {
          workspaceId,
          batchIndex: index + 1,
          batchCount: recordingChunks.length,
          recordingsInBatch: chunk.length,
        });
      }

      logger.info('Scheduled recording cleanup tasks', {
        workspaceId,
        recordingsScheduled: recordingsToCleanup.length,
      });
    }

    return {
      success: true,
      workspaceId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  },
});
