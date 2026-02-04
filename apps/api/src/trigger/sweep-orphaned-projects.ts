// Initialize Sentry for Trigger.dev workers - must be first import
import './init';

import { logger, schedules, task } from '@trigger.dev/sdk/v3';

import { db } from '@/api/clients/db';
import { env } from '@/api/env';
import { chunkArray } from '@/api/lib/batch';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { withSentryTrigger } from '@/api/sentry';

import { BATCH_LIMITS, MAX_DURATIONS, TASK_IDS } from './constants';
import { getPurgeDelay } from './delay-calculator';
import { deleteRecordingResources } from './delete-recording-resources';
import { buildProjectDeletionKey, buildRecordingDeletionKey } from './idempotency';

interface CleanupOrphanedProjectPayload {
  projectId: string;
}

interface CleanupOrphanedProjectResult {
  success: boolean;
  projectId: string;
  recordingsScheduled: number;
  skipped?: boolean;
  reason?: string;
}

interface SweepOrphanedProjectsResult {
  projectsTriggered: number;
  dateRangeStart: string;
  dateRangeEnd: string;
}

/**
 * cleanupOrphanedProject - Cleanup task for orphaned project recordings
 *
 * Task ID: TASK_IDS.CLEANUP_ORPHANED_PROJECT
 * Input: { projectId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify project is deleted
 * 2. List orphaned recordings to clean up
 * 3. Fan-out to deleteRecordingResources using batchTrigger
 */
export const cleanupOrphanedProject = task({
  id: TASK_IDS.CLEANUP_ORPHANED_PROJECT,
  maxDuration: MAX_DURATIONS.PROJECT_CLEANUP,
  run: withSentryTrigger(
    async (payload: CleanupOrphanedProjectPayload): Promise<CleanupOrphanedProjectResult> => {
      const { projectId } = payload;

      logger.info('Starting orphan project resource cleanup', { projectId });

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
      // Pulls orphaned recordings for deletion
      const recordingsToCleanup = await recordingRepo.findByProjectId(projectId, 'ORPHAN');

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
              payload: { recordingId: recording.recordingId },
              options: {
                idempotencyKey: buildRecordingDeletionKey(recording.recordingId),
                delay: getPurgeDelay(),
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
    }
  ),
});

/**
 * sweepOrphanedProjects - Background sweep job for projects with orphaned recordings
 *
 * Task ID: TASK_IDS.SWEEP_ORPHANED_PROJECTS
 * Schedule: Configurable via PROJECT_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
 * Lookback period: Configurable via PROJECT_SWEEP_LOOKBACK_DAYS env var (default: 3 days)
 *
 * Purpose: Find projects deleted within a rolling window that have orphaned recordings and trigger cleanup
 *
 * Finds:
 * - Projects deleted between day before yesterday (N-2) and X days back
 * - That have at least one recording with ORPHAN status group (pending, available)
 * - Creates a rolling window based on project deletedAt timestamp
 * - Grace period: excludes yesterday and today to allow for ongoing operations
 * - Triggers project cleanup which cascades to all resources
 */
export const sweepOrphanedProjects = schedules.task({
  id: TASK_IDS.SWEEP_ORPHANED_PROJECTS,
  maxDuration: MAX_DURATIONS.ORPHANED_PROJECT_SWEEP,
  // Cron schedule configured via PROJECT_SWEEP_CRON_SCHEDULE env var (default: daily at midnight UTC)
  cron: {
    pattern: env.trigger.projectSweepCronSchedule,
    timezone: 'UTC',
    // Only run in PRODUCTION and STAGING environments
    environments: ['PRODUCTION'],
  },
  run: withSentryTrigger(async (payload): Promise<SweepOrphanedProjectsResult> => {
    logger.info('Starting sweep for orphaned project recordings', {
      timestamp: payload.timestamp,
      lastTimestamp: payload.lastTimestamp,
      timezone: payload.timezone,
      scheduleId: payload.scheduleId,
      externalId: payload.externalId,
      upcoming: payload.upcoming,
    });

    const recordingRepo = new RecordingRepository(db);

    // Lookback days configured via PROJECT_SWEEP_LOOKBACK_DAYS env var (default: 3 days)
    const lookbackDays = env.trigger.projectSweepLookbackDays;

    // Calculate date range: day before yesterday (N-2) looking back X days
    // endDate: Start of yesterday (00:00:00) - exclusive upper bound, so includes day before yesterday
    // startDate: Start of (lookbackDays + 1) days ago
    // Example with lookbackDays=3: queries projects deleted from 4 days ago through day before yesterday (3 full days)
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today (00:00:00)
    endDate.setDate(endDate.getDate() - 1); // Start of yesterday (00:00:00) - day before yesterday ends here
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - lookbackDays); // lookbackDays before yesterday

    logger.info('Querying projects deleted within date range with orphaned recordings', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lookbackDays,
      dateRangeDescription: `Projects deleted from day before yesterday through ${lookbackDays} days back`,
    });

    // Find deleted projects with orphaned recordings in the date range
    const projectsWithOrphans = await recordingRepo.findProjectsWithOrphanedRecordings(
      startDate,
      endDate
    );

    logger.info('Found projects with orphaned recordings', {
      count: projectsWithOrphans.length,
      projectIds: projectsWithOrphans.map((p) => p.projectId),
    });

    // Trigger project cleanup for each project with orphaned recordings
    // Batch into chunks of 500 (Trigger.dev limit) to handle large numbers of projects
    if (projectsWithOrphans.length > 0) {
      const projectChunks = chunkArray(projectsWithOrphans, BATCH_LIMITS.MAX_BATCH_SIZE);

      logger.info('Batching project cleanup triggers', {
        totalProjects: projectsWithOrphans.length,
        batchCount: projectChunks.length,
        batchSize: BATCH_LIMITS.MAX_BATCH_SIZE,
      });

      for (const [index, chunk] of projectChunks.entries()) {
        await cleanupOrphanedProject.batchTrigger(
          chunk.map((project) => ({
            payload: { projectId: project.projectId },
            options: { idempotencyKey: buildProjectDeletionKey(project.projectId) },
          }))
        );

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
  }),
});
