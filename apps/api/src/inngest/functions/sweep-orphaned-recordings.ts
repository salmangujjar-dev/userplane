import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { createLogger } from '@/api/lib/logger';
import { RecordingRepository } from '@/api/repositories/recordings.repository';

const logger = createLogger('inngest:sweep-orphaned-recordings');

/**
 * sweepOrphanedRecordings - Background sweep job for deleted recordings from active entities
 *
 * Schedule: Configurable via RECORDING_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
 * Lookback period: Configurable via RECORDING_SWEEP_LOOKBACK_DAYS env var (default: 3 days)
 *
 * Purpose: Find recordings deleted within a rolling window from active workspaces/projects and trigger cleanup
 */
export const sweepOrphanedRecordings = inngest.createFunction(
  {
    id: 'sweep-orphaned-recordings',
    retries: 3,
  },
  { cron: env.inngest.recordingSweepCronSchedule },
  async ({ step }) => {
    // Environment guard: only run in production
    if (env.server.appEnv !== 'production') {
      logger.debug('Skipping orphaned recording sweep in non-production environment');
      return { recordingsTriggered: 0, dateRangeStart: '', dateRangeEnd: '' };
    }

    logger.debug('Starting sweep for orphaned recordings');

    const recordingRepo = new RecordingRepository(db);
    const lookbackDays = env.inngest.recordingSweepLookbackDays;

    // Calculate date range
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays);

    logger.debug(
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        lookbackDays,
      },
      'Querying deleted recordings from active workspaces and projects'
    );

    const deletedRecordings = await step.run('find-orphaned-recordings', async () => {
      return recordingRepo.findDeletedRecordingsFromActiveEntities(startDate, endDate);
    });

    logger.debug(
      {
        count: deletedRecordings.length,
        recordingIds: deletedRecordings.map((r) => r.recordingId),
      },
      'Found deleted recordings from active entities'
    );

    if (deletedRecordings.length > 0) {
      const recordingChunks = chunkArray(deletedRecordings, BATCH_LIMITS.MAX_BATCH_SIZE);

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

        logger.debug(
          {
            batchIndex: index + 1,
            batchCount: recordingChunks.length,
            recordingsInBatch: chunk.length,
          },
          'Triggered recording cleanup batch'
        );
      }
    }

    const result = {
      recordingsTriggered: deletedRecordings.length,
      dateRangeStart: startDate.toISOString(),
      dateRangeEnd: endDate.toISOString(),
    };

    logger.debug(result, 'Sweep completed');
    return result;
  }
);
