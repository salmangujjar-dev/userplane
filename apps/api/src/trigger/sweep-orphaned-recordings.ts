import { logger, schedules } from '@trigger.dev/sdk/v3';
import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { deleteRecordingResources } from './delete-recording-resources';
import { TASK_IDS, MAX_DURATIONS, BATCH_LIMITS } from './constants';
import { buildRecordingDeletionKey } from './idempotency';
import { getPurgeDelay } from './delay-calculator';
import { chunkArray } from '@/api/lib/batch';

interface SweepOrphanedRecordingsResult {
  recordingsTriggered: number;
  dateRangeStart: string;
  dateRangeEnd: string;
}

/**
 * sweepOrphanedRecordings - Background sweep job for deleted recordings from active entities
 *
 * Task ID: TASK_IDS.SWEEP_ORPHANED_RECORDINGS
 * Schedule: Configurable via RECORDING_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
 * Lookback period: Configurable via RECORDING_SWEEP_LOOKBACK_DAYS env var (default: 3 days)
 *
 * Purpose: Find recordings deleted within a rolling window from active workspaces/projects and trigger cleanup
 *
 * Finds:
 * - Recordings deleted between day before yesterday (N-2) and X days back
 * - That belong to active (not deleted) workspaces and projects
 * - Creates a rolling window based on recording deletedAt timestamp
 * - Grace period: excludes yesterday and today to allow for ongoing operations
 * - Triggers recording cleanup to delete storage resources
 */
export const sweepOrphanedRecordings = schedules.task({
  id: TASK_IDS.SWEEP_ORPHANED_RECORDINGS,
  maxDuration: MAX_DURATIONS.ORPHANED_RECORDING_SWEEP,
  // Cron schedule configured via RECORDING_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
  cron: {
    pattern: env.trigger.recordingSweepCronSchedule,
    timezone: 'UTC',
    // Only run in PRODUCTION and STAGING environments
    environments: ['PRODUCTION', 'STAGING'],
  },
  run: async (payload): Promise<SweepOrphanedRecordingsResult> => {
    logger.info('Starting sweep for orphaned recordings', {
      timestamp: payload.timestamp,
      lastTimestamp: payload.lastTimestamp,
      timezone: payload.timezone,
      scheduleId: payload.scheduleId,
      externalId: payload.externalId,
      upcoming: payload.upcoming,
    });

    const recordingRepo = new RecordingRepository(db);

    // Lookback days configured via RECORDING_SWEEP_LOOKBACK_DAYS env var (default: 3 days)
    const lookbackDays = env.trigger.recordingSweepLookbackDays;

    // Calculate date range: day before yesterday (N-2) looking back X days
    // endDate: Start of yesterday (00:00:00) - exclusive upper bound, so includes day before yesterday
    // startDate: Start of (lookbackDays + 1) days ago
    // Example with lookbackDays=3: queries recordings deleted from 4 days ago through day before yesterday (3 full days)
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today (00:00:00)
    endDate.setDate(endDate.getDate() - 1); // Start of yesterday (00:00:00) - day before yesterday ends here
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays); // lookbackDays before yesterday

    logger.info('Querying deleted recordings from active workspaces and projects', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lookbackDays,
      dateRangeDescription: `Recordings deleted from day before yesterday through ${lookbackDays} days back`,
    });

    // Find deleted recordings from active workspaces and projects
    const deletedRecordings = await recordingRepo.findDeletedRecordingsFromActiveEntities(
      startDate,
      endDate
    );

    logger.info('Found deleted recordings from active entities', {
      count: deletedRecordings.length,
      recordingIds: deletedRecordings.map((r) => r.recordingId),
    });

    // Trigger recording cleanup for each deleted recording
    // Batch into chunks of 500 (Trigger.dev limit) to handle large numbers of recordings
    if (deletedRecordings.length > 0) {
      const recordingChunks = chunkArray(deletedRecordings, BATCH_LIMITS.MAX_BATCH_SIZE);

      logger.info('Batching recording cleanup triggers', {
        totalRecordings: deletedRecordings.length,
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
          batchIndex: index + 1,
          batchCount: recordingChunks.length,
          recordingsInBatch: chunk.length,
        });
      }
    }

    const result = {
      recordingsTriggered: deletedRecordings.length,
      dateRangeStart: startDate.toISOString(),
      dateRangeEnd: endDate.toISOString(),
    };

    logger.info('Sweep completed', result);

    return result;
  },
});
