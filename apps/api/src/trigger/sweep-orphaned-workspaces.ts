import { task, logger, schedules } from '@trigger.dev/sdk/v3';
import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { deleteRecordingResources } from './delete-recording-resources';
import { TASK_IDS, MAX_DURATIONS, BATCH_LIMITS } from './constants';
import { buildWorkspaceDeletionKey, buildRecordingDeletionKey } from './idempotency';
import { getPurgeDelay } from './delay-calculator';
import { chunkArray } from '@/api/lib/batch';

interface CleanupOrphanedWorkspacePayload {
  workspaceId: string;
}

interface CleanupOrphanedWorkspaceResult {
  success: boolean;
  workspaceId: string;
  recordingsScheduled: number;
  skipped?: boolean;
  reason?: string;
}

interface SweepOrphanedWorkspacesResult {
  workspacesTriggered: number;
}

/**
 * cleanupOrphanedWorkspace - Cleanup task for orphaned workspace recordings
 *
 * Task ID: TASK_IDS.CLEANUP_ORPHANED_WORKSPACE
 * Input: { workspaceId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify workspace is deleted
 * 2. List orphaned recordings to clean up
 * 3. Fan-out to deleteRecordingResources using batchTrigger
 */
export const cleanupOrphanedWorkspace = task({
  id: TASK_IDS.CLEANUP_ORPHANED_WORKSPACE,
  maxDuration: MAX_DURATIONS.WORKSPACE_CLEANUP,
  run: async (
    payload: CleanupOrphanedWorkspacePayload
  ): Promise<CleanupOrphanedWorkspaceResult> => {
    const { workspaceId } = payload;

    logger.info('Starting orphan workspace resource cleanup', { workspaceId });

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
    // Pulls orphaned recordings for deletion
    const recordingsToCleanup = await recordingRepo.findByWorkspaceId(workspaceId, 'ORPHAN');

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
              delay: getPurgeDelay(),
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

/**
 * sweepOrphanedWorkspaces - Background sweep job for workspaces with orphaned recordings
 *
 * Task ID: TASK_IDS.SWEEP_ORPHANED_WORKSPACES
 * Schedule: Configurable via WORKSPACE_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
 * Lookback period: Configurable via WORKSPACE_SWEEP_LOOKBACK_DAYS env var (default: 7 days)
 *
 * Purpose: Find workspaces deleted within a rolling window that have orphaned recordings and trigger cleanup
 *
 * Finds:
 * - Workspaces deleted between day before yesterday (N-2) and X days back
 * - That have at least one recording with ORPHAN status group (pending, available)
 * - Creates a rolling window based on workspace deletedAt timestamp
 * - Grace period: excludes yesterday and today to allow for ongoing operations
 * - Triggers workspace cleanup which cascades to all resources
 */
export const sweepOrphanedWorkspaces = schedules.task({
  id: TASK_IDS.SWEEP_ORPHANED_WORKSPACES,
  maxDuration: MAX_DURATIONS.ORPHANED_SWEEP,
  // Cron schedule configured via WORKSPACE_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
  cron: {
    pattern: env.trigger.workspaceSweepCronSchedule,
    timezone: 'UTC',
    // Only run in PRODUCTION and STAGING environments
    environments: ['PRODUCTION', 'STAGING'],
  },
  run: async (payload): Promise<SweepOrphanedWorkspacesResult> => {
    logger.info('Starting sweep for orphaned workspace recordings', {
      timestamp: payload.timestamp,
      lastTimestamp: payload.lastTimestamp,
      timezone: payload.timezone,
      scheduleId: payload.scheduleId,
      externalId: payload.externalId,
      upcoming: payload.upcoming,
    });

    const recordingRepo = new RecordingRepository(db);

    // Lookback days configured via WORKSPACE_SWEEP_LOOKBACK_DAYS env var (default: 7 days)
    const lookbackDays = env.trigger.workspaceSweepLookbackDays;

    // Calculate date range: day before yesterday (N-2) looking back X days
    // endDate: Start of yesterday (00:00:00) - exclusive upper bound, so includes day before yesterday
    // startDate: Start of (lookbackDays + 1) days ago
    // Example with lookbackDays=7: queries workspaces deleted from 8 days ago through day before yesterday (7 full days)
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today (00:00:00)
    endDate.setDate(endDate.getDate() - 1); // Start of yesterday (00:00:00) - day before yesterday ends here
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays); // lookbackDays before yesterday

    logger.info('Querying workspaces deleted within date range with orphaned recordings', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lookbackDays,
      dateRangeDescription: `Workspaces deleted from day before yesterday through ${lookbackDays} days back`,
    });

    // Find deleted workspaces with orphaned recordings in the date range
    const workspacesWithOrphans = await recordingRepo.findWorkspacesWithOrphanedRecordings(
      startDate,
      endDate
    );

    logger.info('Found workspaces with orphaned recordings', {
      count: workspacesWithOrphans.length,
      workspaceIds: workspacesWithOrphans.map((w) => w.workspaceId),
    });

    // Trigger workspace cleanup for each workspace with orphaned recordings
    // Batch into chunks of 500 (Trigger.dev limit) to handle large numbers of workspaces
    if (workspacesWithOrphans.length > 0) {
      const workspaceChunks = chunkArray(workspacesWithOrphans, BATCH_LIMITS.MAX_BATCH_SIZE);

      logger.info('Batching workspace cleanup triggers', {
        totalWorkspaces: workspacesWithOrphans.length,
        batchCount: workspaceChunks.length,
        batchSize: BATCH_LIMITS.MAX_BATCH_SIZE,
      });

      for (const [index, chunk] of workspaceChunks.entries()) {
        await cleanupOrphanedWorkspace.batchTrigger(
          chunk.map((workspace) => ({
            payload: { workspaceId: workspace.workspaceId },
            options: { idempotencyKey: buildWorkspaceDeletionKey(workspace.workspaceId) },
          }))
        );

        logger.info('Triggered workspace cleanup batch', {
          batchIndex: index + 1,
          batchCount: workspaceChunks.length,
          workspacesInBatch: chunk.length,
        });
      }
    }

    const result = {
      workspacesTriggered: workspacesWithOrphans.length,
    };

    logger.info('Sweep completed', result);

    return result;
  },
});
