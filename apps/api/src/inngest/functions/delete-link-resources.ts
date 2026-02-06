import { createAppLogger } from '@workspace/logger';

import { db } from '@/api/clients/db';
import { inngest } from '@/api/inngest/client';
import { BATCH_LIMITS, EVENT_NAMES } from '@/api/inngest/constants';
import { getPurgeDelayTimestamp } from '@/api/inngest/delay-calculator';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { chunkArray } from '@/api/lib/batch';
import { LinkRepository } from '@/api/repositories/links.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { withSentryInngest } from '@/api/sentry';

const logger = createAppLogger('inngest:delete-link-resources');

/**
 * deleteLinkResources - Cleanup function for link resources
 *
 * Event: link/delete-resources
 * Input: { linkId: string }
 *
 * Flow:
 * 1. Short-circuit check - verify link is deleted
 * 2. List recordings to clean up
 * 3. Fan-out to delete-recording-resources via inngest.send()
 */
export const deleteLinkResources = inngest.createFunction(
  {
    id: EVENT_NAMES.DELETE_LINK_RESOURCES,
    retries: 3,
  },
  { event: EVENT_NAMES.DELETE_LINK_RESOURCES },
  withSentryInngest(async ({ event, step }) => {
    const { linkId } = event.data;

    logger.info('Starting link resource cleanup', { linkId });

    const linkRepo = new LinkRepository(db);
    const recordingRepo = new RecordingRepository(db);

    // 1. Short-circuit check
    const isDeleted = await step.run('check-link-status', async () => {
      return linkRepo.isSoftDeleted(linkId);
    });

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
    const recordingsToCleanup = await step.run('list-recordings', async () => {
      return recordingRepo.findByLinkId(linkId);
    });

    logger.info('Found recordings to cleanup', { linkId, count: recordingsToCleanup.length });

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
              ...(getPurgeDelayTimestamp(recording.uploadStatus)
                ? { ts: getPurgeDelayTimestamp(recording.uploadStatus) }
                : {}),
            }))
          );
        });

        logger.info('Triggered recording cleanup batch', {
          linkId,
          batchIndex: index + 1,
          batchCount: recordingChunks.length,
          recordingsInBatch: chunk.length,
        });
      }
    }

    return {
      success: true,
      linkId,
      recordingsScheduled: recordingsToCleanup.length,
    };
  })
);
