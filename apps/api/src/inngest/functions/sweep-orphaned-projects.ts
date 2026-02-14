import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildProjectDeletionKey, buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { createLogger } from '@/api/lib/logger';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';

const logger = createLogger('inngest:sweep-orphaned-projects');

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
  async ({ event, step }) => {
    const { projectId } = event.data;

    logger.debug({ projectId }, 'Starting orphan project resource cleanup');

    const projectRepo = new ProjectRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await step.run('check-project-status', async () => {
      return projectRepo.isSoftDeleted(projectId);
    });

    if (isDeleted === null) {
      logger.debug({ projectId }, 'Project not found, skipping');
      return {
        success: true,
        projectId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_found',
      };
    }

    if (!isDeleted) {
      logger.debug({ projectId }, 'Project not deleted, skipping');
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

    logger.debug({ projectId, count: recordingsToCleanup.length }, 'Found recordings to cleanup');

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
              ...(getPurgeDelayTimestamp() ? { ts: getPurgeDelayTimestamp() } : {}),
            }))
          );
        });

        logger.debug(
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
  async ({ step }) => {
    // Environment guard: only run in production
    if (env.server.appEnv !== 'production') {
      logger.debug('Skipping orphaned project sweep in non-production environment');
      return { projectsTriggered: 0, dateRangeStart: '', dateRangeEnd: '' };
    }

    logger.debug('Starting sweep for orphaned project recordings');

    const recordingRepo = new RecordingRepository(db);
    const lookbackDays = env.inngest.projectSweepLookbackDays;

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
      'Querying projects deleted within date range with orphaned recordings'
    );

    const projectsWithOrphans = await step.run('find-orphaned-projects', async () => {
      return recordingRepo.findProjectsWithOrphanedRecordings(startDate, endDate);
    });

    logger.debug(
      {
        count: projectsWithOrphans.length,
        projectIds: projectsWithOrphans.map((p) => p.projectId),
      },
      'Found projects with orphaned recordings'
    );

    if (projectsWithOrphans.length > 0) {
      const projectChunks = chunkArray(projectsWithOrphans, BATCH_LIMITS.MAX_BATCH_SIZE);

      for (const [index, chunk] of projectChunks.entries()) {
        await step.run(`send-batch-${index}`, async () => {
          await inngest.send(
            chunk.map((project) => ({
              name: EVENT_NAMES.CLEANUP_ORPHANED_PROJECT,
              data: { projectId: project.projectId },
              id: buildProjectDeletionKey(project.projectId),
            }))
          );
        });

        logger.debug(
          {
            batchIndex: index + 1,
            batchCount: projectChunks.length,
            projectsInBatch: chunk.length,
          },
          'Triggered project cleanup batch'
        );
      }
    }

    const result = {
      projectsTriggered: projectsWithOrphans.length,
      dateRangeStart: startDate.toISOString(),
      dateRangeEnd: endDate.toISOString(),
    };

    logger.debug(result, 'Sweep completed');
    return result;
  }
);
