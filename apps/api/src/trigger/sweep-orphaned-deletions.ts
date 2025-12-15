import { task, logger, schedules } from '@trigger.dev/sdk/v3';
import { db } from '@/api/clients/db';
import { SweepRepository } from '@/api/repositories/sweep.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { deleteWorkspaceResources } from './delete-workspace-resources';
import { deleteProjectResources } from './delete-project-resources';
import { deleteLinkResources } from './delete-link-resources';
import { deleteRecordingResources } from './delete-recording-resources';
import { calculateDelay } from '@/api/trigger/delay-calculator';
import { TASK_IDS, MAX_DURATIONS, SCHEDULES } from './constants';
import {
  buildWorkspaceDeletionKey,
  buildProjectDeletionKey,
  buildLinkDeletionKey,
  buildRecordingDeletionKey,
} from './idempotency';

interface SweepOrphanedDeletionsResult {
  workspacesTriggered: number;
  projectsTriggered: number;
  linksTriggered: number;
  recordingsTriggered: number;
}

/**
 * sweepOrphanedDeletions - Background sweep job for orphaned deletions
 *
 * Task ID: TASK_IDS.SWEEP_ORPHANED_DELETIONS
 * Schedule: Every 10 minutes
 * Grace period: 5 minutes (prevents racing with normal post-commit triggers)
 *
 * Purpose: Catch deletions where process died after transaction commit but before trigger call
 *
 * Finds:
 * 1. Orphaned workspace deletions
 * 2. Orphaned project deletions
 * 3. Orphaned link deletions
 * 4. Orphaned recording deletions
 */
export const sweepOrphanedDeletions = task({
  id: TASK_IDS.SWEEP_ORPHANED_DELETIONS,
  maxDuration: MAX_DURATIONS.ORPHANED_SWEEP,
  run: async (): Promise<SweepOrphanedDeletionsResult> => {
    logger.info('Starting sweep for orphaned deletions');

    const sweepRepo = new SweepRepository(db);
    const recordingRepo = new RecordingRepository(db);

    const graceMinutes = 5;
    const cutoffDate = new Date(Date.now() - graceMinutes * 60 * 1000);

    // 1. Orphaned workspace deletions
    const orphanedWorkspaces = await sweepRepo.findOrphanedWorkspaces(cutoffDate);

    logger.info('Found orphaned workspace deletions', { count: orphanedWorkspaces.length });

    if (orphanedWorkspaces.length > 0) {
      await deleteWorkspaceResources.batchTrigger(
        orphanedWorkspaces.map((workspace) => ({
          payload: { workspaceId: workspace.id },
          options: { idempotencyKey: buildWorkspaceDeletionKey(workspace.id) },
        }))
      );
    }

    // 2. Orphaned project deletions
    const orphanedProjects = await sweepRepo.findOrphanedProjects(cutoffDate);

    logger.info('Found orphaned project deletions', { count: orphanedProjects.length });

    if (orphanedProjects.length > 0) {
      await deleteProjectResources.batchTrigger(
        orphanedProjects.map((project) => ({
          payload: { projectId: project.id },
          options: { idempotencyKey: buildProjectDeletionKey(project.id) },
        }))
      );
    }

    // 3. Orphaned link deletions
    const orphanedLinks = await sweepRepo.findOrphanedLinks(cutoffDate);

    logger.info('Found orphaned link deletions', { count: orphanedLinks.length });

    if (orphanedLinks.length > 0) {
      await deleteLinkResources.batchTrigger(
        orphanedLinks.map((link) => ({
          payload: { linkId: link.id },
          options: { idempotencyKey: buildLinkDeletionKey(link.id) },
        }))
      );
    }

    // 4. Orphaned recording deletions
    const orphanedRecordings = await recordingRepo.findOrphanedRecordings(cutoffDate);

    logger.info('Found orphaned recording deletions', { count: orphanedRecordings.length });

    if (orphanedRecordings.length > 0) {
      await deleteRecordingResources.batchTrigger(
        orphanedRecordings.map((recording) => ({
          payload: { recordingId: recording.id },
          options: {
            idempotencyKey: buildRecordingDeletionKey(recording.id),
            delay: calculateDelay(recording.uploadStatus),
          },
        }))
      );
    }

    const result = {
      workspacesTriggered: orphanedWorkspaces.length,
      projectsTriggered: orphanedProjects.length,
      linksTriggered: orphanedLinks.length,
      recordingsTriggered: orphanedRecordings.length,
    };

    logger.info('Sweep completed', result);

    return result;
  },
});

/**
 * Schedule the sweep job to run every 10 minutes
 */
schedules.create({
  task: sweepOrphanedDeletions.id,
  cron: SCHEDULES.ORPHANED_SWEEP.CRON,
  deduplicationKey: SCHEDULES.ORPHANED_SWEEP.ID,
  externalId: SCHEDULES.ORPHANED_SWEEP.ID,
});
