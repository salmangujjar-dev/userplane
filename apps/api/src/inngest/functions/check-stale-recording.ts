import { db } from '@/api/clients/db';
import { inngest } from '@/api/inngest/client';
import { EVENT_NAMES } from '@/api/inngest/constants';
import { buildRecordingDeletionKey } from '@/api/inngest/idempotency';
import { createLogger } from '@/api/lib/logger';
import { RecordingRepository } from '@/api/repositories/recordings.repository';

const logger = createLogger('inngest:check-stale-recording');

/**
 * checkStaleRecording - Automatically cleans up recordings that never completed upload
 *
 * Triggered by: SessionService.initUpload (delayed by presignedUrlExpiry + buffer)
 *
 * Logic:
 * - If recording is 'pending': trigger cleanup (upload never completed)
 * - If recording is 'available': do nothing (upload succeeded)
 * - If recording doesn't exist or already deleted: short-circuit
 */
export const checkStaleRecording = inngest.createFunction(
  {
    id: EVENT_NAMES.CHECK_STALE_RECORDING,
    retries: 3,
  },
  { event: EVENT_NAMES.CHECK_STALE_RECORDING },
  async ({ event, step }) => {
    const { recordingId } = event.data;

    logger.debug({ recordingId }, 'Starting stale recording check');

    const recordingRepo = new RecordingRepository(db);

    const recording = await step.run('check-recording-status', async () => {
      return recordingRepo.findByIdWithStatusGroup(recordingId, 'STALE');
    });

    if (!recording) {
      logger.debug({ recordingId }, 'Recording not found or not in STALE status, skipping');
      return { recordingId, action: 'not_found' };
    }

    // Trigger resource cleanup immediately (no delay needed, upload already stale)
    await step.run('trigger-cleanup', async () => {
      await inngest.send({
        name: EVENT_NAMES.DELETE_RECORDING_RESOURCES,
        data: { recordingId },
        id: buildRecordingDeletionKey(recordingId),
      });
    });

    logger.debug(
      {
        recordingId,
        previousStatus: recording.uploadStatus,
      },
      'Stale recording marked as deleted and cleanup triggered'
    );

    return {
      recordingId,
      action: 'cleaned_up',
      previousStatus: recording.uploadStatus,
    };
  }
);
