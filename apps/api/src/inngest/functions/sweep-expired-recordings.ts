import { cron } from 'inngest';

import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { EVENTS, inngest } from '@/api/inngest/client';
import { BATCH_LIMITS } from '@/api/inngest/constants';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { createLogger } from '@/api/lib/logger';
import { RecordingRepository } from '@/api/repositories/recordings.repository';

const logger = createLogger('inngest:sweep-expired-recordings');

/**
 * sweepExpiredRecordings - Background sweep job for expired recordings
 *
 * Schedule: Configurable via EXPIRED_RECORDING_SWEEP_CRON_SCHEDULE env var (default: daily at 2 AM UTC)
 *
 * Purpose: Find recordings past their expiresAt date and soft-delete them,
 * then fan out DELETE_RECORDING_RESOURCES events for physical cleanup.
 */
export const sweepExpiredRecordings = inngest.createFunction(
  {
    id: 'sweep-expired-recordings',
    retries: 3,
    triggers: [cron(env.inngest.expiredRecordingSweepCronSchedule)],
  },
  async ({ step }) => {
    // Environment guard: only run in production
    if (env.server.appEnv !== 'production') {
      logger.debug('Skipping expired recording sweep in non-production environment');
      return { recordingsDeleted: 0 };
    }

    logger.debug('Starting sweep for expired recordings');

    const recordingRepo = new RecordingRepository(db);

    // Single atomic query: find and soft-delete all expired recordings
    const deletedRecordings = await step.run('soft-delete-expired', async () => {
      return recordingRepo.softDeleteExpired();
    });

    logger.debug(
      {
        count: deletedRecordings.length,
        recordingIds: deletedRecordings.map((r) => r.recordingId),
      },
      'Soft-deleted expired recordings'
    );

    // Fan out DELETE_RECORDING_RESOURCES events in batches for physical cleanup
    if (deletedRecordings.length > 0) {
      const recordingChunks = chunkArray(deletedRecordings, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of recordingChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((recording) =>
              EVENTS.deleteRecordingResources.create(
                { recordingId: recording.recordingId },
                { id: buildRecordingDeletionKey(recording.recordingId) }
              )
            )
          );
        });

        logger.debug(
          {
            batchIndex: index + 1,
            batchCount: recordingChunks.length,
            recordingsInBatch: chunk.length,
          },
          'Triggered expired recording cleanup batch'
        );
      }
    }

    const result = {
      recordingsDeleted: deletedRecordings.length,
    };

    logger.debug(result, 'Expired recording sweep completed');
    return result;
  }
);
