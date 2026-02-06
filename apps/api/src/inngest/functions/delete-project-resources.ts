import { createAppLogger } from '@workspace/logger';

import { db } from '@/api/clients/db';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';

const logger = createAppLogger('inngest:delete-project-resources');

/**
 * deleteProjectResources - Cleanup function for project resources
 *
 * Event: project/delete-resources
 * Input: { projectId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify project is deleted
 * 2. List recordings to clean up
 * 3. Fan-out to delete-recording-resources via inngest.send()
 */
export const deleteProjectResources = inngest.createFunction(
  {
    id: EVENT_NAMES.DELETE_PROJECT_RESOURCES,
    retries: 3,
  },
  { event: EVENT_NAMES.DELETE_PROJECT_RESOURCES },
  async ({ event, step }) => {
    const { projectId } = event.data;

    logger.info({ projectId }, 'Starting project resource cleanup');

    const projectRepo = new ProjectRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await step.run('check-project-status', async () => {
      return projectRepo.isSoftDeleted(projectId);
    });

    if (isDeleted === null) {
      logger.info({ projectId }, 'Project not found, skipping');
      return {
        success: true,
        projectId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_found',
      };
    }

    if (!isDeleted) {
      logger.info({ projectId }, 'Project not deleted, skipping');
      return {
        success: true,
        projectId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_deleted',
      };
    }

    // 2. List recordings to clean up
    const recordingsToCleanup = await step.run('list-recordings', async () => {
      return recordingRepo.findByProjectId(projectId);
    });

    logger.info({ projectId, count: recordingsToCleanup.length }, 'Found recordings to cleanup');

    // 3. Fan-out in batches of 500
    if (recordingsToCleanup.length > 0) {
      const recordingChunks = chunkArray(recordingsToCleanup, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of recordingChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((recording) => ({
              name: EVENT_NAMES.DELETE_RECORDING_RESOURCES,
              data: { recordingId: recording.recordingId },
              id: buildRecordingDeletionKey(recording.recordingId),
              ...(getPurgeDelayTimestamp(recording.uploadStatus)
                ? { ts: getPurgeDelayTimestamp(recording.uploadStatus) }
                : {}),
            }))
          );
        });

        logger.info(
          {
            projectId,
            batchIndex: index + 1,
            batchCount: recordingChunks.length,
            recordingsInBatch: chunk.length,
          },
          'Triggered recording cleanup batch'
        );
      }
    }

    return {
      success: true,
      projectId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  }
);
