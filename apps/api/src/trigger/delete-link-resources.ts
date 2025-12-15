import { task, logger } from '@trigger.dev/sdk/v3';
import { db } from '@/api/clients/db';
import { LinkRepository } from '@/api/repositories/links.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { deleteRecordingResources } from './delete-recording-resources';
import { getPurgeDelay } from '@/api/trigger/delay-calculator';
import { TASK_IDS, MAX_DURATIONS } from './constants';
import { buildRecordingDeletionKey } from './idempotency';

interface DeleteLinkResourcesPayload {
  linkId: string;
}

interface DeleteLinkResourcesResult {
  success: boolean;
  linkId: string;
  recordingsScheduled: number;
  skipped?: boolean;
  reason?: string;
}

/**
 * deleteLinkResources - Cleanup task for link resources
 *
 * Task ID: TASK_IDS.DELETE_LINK_RESOURCES
 * Input: { linkId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify link is deleted
 * 2. List recordings to clean up
 * 3. Fan-out to deleteRecordingResources using batchTrigger
 */
export const deleteLinkResources = task({
  id: TASK_IDS.DELETE_LINK_RESOURCES,
  maxDuration: MAX_DURATIONS.LINK_CLEANUP,
  run: async (payload: DeleteLinkResourcesPayload): Promise<DeleteLinkResourcesResult> => {
    const { linkId } = payload;

    logger.info('Starting link resource cleanup', { linkId });

    const linkRepo = new LinkRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await linkRepo.isSoftDeleted(linkId);

    if (isDeleted === null) {
      logger.info('Link not found, skipping', { linkId });
      return { success: true, linkId, recordingsScheduled: 0, skipped: true, reason: 'not_found' };
    }

    if (!isDeleted) {
      logger.info('Link not deleted, skipping', { linkId });
      return {
        success: true,
        linkId,
        recordingsScheduled: 0,
        skipped: true,
        reason: 'not_deleted',
      };
    }

    // 2. List recordings to clean up
    // Pulls available recordings for deletion
    const recordingsToCleanup = await recordingRepo.findByLinkId(linkId);

    logger.info('Found recordings to cleanup', { linkId, count: recordingsToCleanup.length });

    // 3. Fan-out (use batchTrigger for multiple recordings)
    if (recordingsToCleanup.length > 0) {
      await deleteRecordingResources.batchTrigger(
        recordingsToCleanup.map((recording) => ({
          payload: { recordingId: recording.id },
          options: {
            idempotencyKey: buildRecordingDeletionKey(recording.id),
            delay: getPurgeDelay(recording.uploadStatus),
          },
        }))
      );

      logger.info('Scheduled recording cleanup tasks', {
        linkId,
        recordingsScheduled: recordingsToCleanup.length,
      });
    }

    return {
      success: true,
      linkId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  },
});
