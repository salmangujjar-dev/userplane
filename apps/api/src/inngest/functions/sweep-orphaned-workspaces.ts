import { createAppLogger } from '@workspace/logger';

import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildRecordingDeletionKey, buildWorkspaceDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { withSentryInngest } from '@/api/sentry';

const logger = createAppLogger('inngest:sweep-orphaned-workspaces');

/**
 * cleanupOrphanedWorkspace - Cleanup function for orphaned workspace recordings
 *
 * Event: workspace/cleanup-orphaned
 * Input: { workspaceId: string }
 */
export const cleanupOrphanedWorkspace = inngest.createFunction(
  {
    id: 'cleanup-orphaned-workspace',
    retries: 3,
  },
  { event: EVENT_NAMES.CLEANUP_ORPHANED_WORKSPACE },
  withSentryInngest(async ({ event, step }) => {
    const { workspaceId } = event.data;

    logger.info('Starting orphan workspace resource cleanup', { workspaceId });

    const workspaceRepo = new WorkspaceRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await step.run('check-workspace-status', async () => {
      return workspaceRepo.isSoftDeleted(workspaceId);
    });

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

    // 2. List orphaned recordings to clean up
    const recordingsToCleanup = await step.run('list-orphaned-recordings', async () => {
      return recordingRepo.findByWorkspaceId(workspaceId, 'ORPHAN');
    });

    logger.info('Found recordings to cleanup', { workspaceId, count: recordingsToCleanup.length });

    // 3. Fan-out in batches of 500
    if (recordingsToCleanup.length > 0) {
      const recordingChunks = chunkArray(recordingsToCleanup, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of recordingChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((recording) => ({
              name: EVENT_NAMES.DELETE_RECORDING_RESOURCES as const,
              data: { recordingId: recording.recordingId },
              id: buildRecordingDeletionKey(recording.recordingId),
              ...(getPurgeDelayTimestamp() ? { ts: getPurgeDelayTimestamp() } : {}),
            }))
          );
        });

        logger.info('Triggered recording cleanup batch', {
          workspaceId,
          batchIndex: index + 1,
          batchCount: recordingChunks.length,
          recordingsInBatch: chunk.length,
        });
      }
    }

    return {
      success: true,
      workspaceId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  })
);

/**
 * sweepOrphanedWorkspaces - Background sweep job for workspaces with orphaned recordings
 *
 * Schedule: Configurable via WORKSPACE_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
 * Lookback period: Configurable via WORKSPACE_SWEEP_LOOKBACK_DAYS env var (default: 7 days)
 */
export const sweepOrphanedWorkspaces = inngest.createFunction(
  {
    id: 'sweep-orphaned-workspaces',
    retries: 3,
  },
  { cron: env.inngest.workspaceSweepCronSchedule },
  withSentryInngest(async ({ step }) => {
    // Environment guard: only run in production
    if (env.server.appEnv !== 'production') {
      logger.info('Skipping orphaned workspace sweep in non-production environment');
      return { workspacesTriggered: 0 };
    }

    logger.info('Starting sweep for orphaned workspace recordings');

    const recordingRepo = new RecordingRepository(db);
    const lookbackDays = env.inngest.workspaceSweepLookbackDays;

    // Calculate date range
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays);

    logger.info('Querying workspaces deleted within date range with orphaned recordings', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lookbackDays,
    });

    const workspacesWithOrphans = await step.run('find-orphaned-workspaces', async () => {
      return recordingRepo.findWorkspacesWithOrphanedRecordings(startDate, endDate);
    });

    logger.info('Found workspaces with orphaned recordings', {
      count: workspacesWithOrphans.length,
      workspaceIds: workspacesWithOrphans.map((w) => w.workspaceId),
    });

    if (workspacesWithOrphans.length > 0) {
      const workspaceChunks = chunkArray(workspacesWithOrphans, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of workspaceChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((workspace) => ({
              name: EVENT_NAMES.CLEANUP_ORPHANED_WORKSPACE as const,
              data: { workspaceId: workspace.workspaceId },
              id: buildWorkspaceDeletionKey(workspace.workspaceId),
            }))
          );
        });

        logger.info('Triggered workspace cleanup batch', {
          batchIndex: index + 1,
          batchCount: workspaceChunks.length,
          workspacesInBatch: chunk.length,
        });
      }
    }

    const result = { workspacesTriggered: workspacesWithOrphans.length };
    logger.info('Sweep completed', result);
    return result;
  })
);
