import { createAppLogger } from '@workspace/logger';

import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildProjectDeletionKey, buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { withSentryInngest } from '@/api/sentry';

const logger = createAppLogger('inngest:sweep-orphaned-projects');

/**
 * cleanupOrphanedProject - Cleanup function for orphaned project recordings
 *
 * Event: project/cleanup-orphaned
 * Input: { projectId: string }
 */
export const cleanupOrphanedProject = inngest.createFunction(
  {
    id: 'cleanup-orphaned-project',
    retries: 3,
  },
  { event: EVENT_NAMES.CLEANUP_ORPHANED_PROJECT },
  withSentryInngest(async ({ event, step }) => {
    const { projectId } = event.data;

    logger.info('Starting orphan project resource cleanup', { projectId });

    const projectRepo = new ProjectRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await step.run('check-project-status', async () => {
      return projectRepo.isSoftDeleted(projectId);
    });

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

    // 2. List orphaned recordings to clean up
    const recordingsToCleanup = await step.run('list-orphaned-recordings', async () => {
      return recordingRepo.findByProjectId(projectId, 'ORPHAN');
    });

    logger.info('Found recordings to cleanup', { projectId, count: recordingsToCleanup.length });

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
          projectId,
          batchIndex: index + 1,
          batchCount: recordingChunks.length,
          recordingsInBatch: chunk.length,
        });
      }
    }

    return {
      success: true,
      projectId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  })
);

/**
 * sweepOrphanedProjects - Background sweep job for projects with orphaned recordings
 *
 * Schedule: Configurable via PROJECT_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
 * Lookback period: Configurable via PROJECT_SWEEP_LOOKBACK_DAYS env var (default: 3 days)
 */
export const sweepOrphanedProjects = inngest.createFunction(
  {
    id: 'sweep-orphaned-projects',
    retries: 3,
  },
  { cron: env.inngest.projectSweepCronSchedule },
  withSentryInngest(async ({ step }) => {
    // Environment guard: only run in production
    if (env.server.appEnv !== 'production') {
      logger.info('Skipping orphaned project sweep in non-production environment');
      return { projectsTriggered: 0, dateRangeStart: '', dateRangeEnd: '' };
    }

    logger.info('Starting sweep for orphaned project recordings');

    const recordingRepo = new RecordingRepository(db);
    const lookbackDays = env.inngest.projectSweepLookbackDays;

    // Calculate date range
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays);

    logger.info('Querying projects deleted within date range with orphaned recordings', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lookbackDays,
    });

    const projectsWithOrphans = await step.run('find-orphaned-projects', async () => {
      return recordingRepo.findProjectsWithOrphanedRecordings(startDate, endDate);
    });

    logger.info('Found projects with orphaned recordings', {
      count: projectsWithOrphans.length,
      projectIds: projectsWithOrphans.map((p) => p.projectId),
    });

    if (projectsWithOrphans.length > 0) {
      const projectChunks = chunkArray(projectsWithOrphans, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of projectChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((project) => ({
              name: EVENT_NAMES.CLEANUP_ORPHANED_PROJECT as const,
              data: { projectId: project.projectId },
              id: buildProjectDeletionKey(project.projectId),
            }))
          );
        });

        logger.info('Triggered project cleanup batch', {
          batchIndex: index + 1,
          batchCount: projectChunks.length,
          projectsInBatch: chunk.length,
        });
      }
    }

    const result = {
      projectsTriggered: projectsWithOrphans.length,
      dateRangeStart: startDate.toISOString(),
      dateRangeEnd: endDate.toISOString(),
    };

    logger.info('Sweep completed', result);
    return result;
  })
);
