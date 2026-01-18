/**
 * Check Stale Recording Task
 * Automatically cleans up recordings that never completed upload within the presigned URL expiry window
 *
 * Triggered by: SessionService.initSession (delayed by presignedUrlExpiry + buffer)
 *
 * Logic:
 * - If recording is 'pending': mark as deleted and trigger cleanup (upload never completed)
 * - If recording is 'available': do nothing (upload succeeded)
 * - If recording doesn't exist or already deleted: short-circuit (already handled)
 *
 * This ensures recordings that never complete their upload are automatically cleaned up
 * after the presigned URL expires, preventing orphaned pending recordings.
 */

import { logger, task } from '@trigger.dev/sdk/v3';

import { db } from '@/api/clients/db';
import { RecordingRepository } from '@/api/repositories/recordings.repository';

import { MAX_DURATIONS, TASK_IDS } from './constants';
import { deleteRecordingResources } from './delete-recording-resources';
import { buildRecordingDeletionKey } from './idempotency';

export interface CheckStaleRecordingPayload {
  recordingId: string;
}

export interface CheckStaleRecordingResult {
  recordingId: string;
  action: 'cleaned_up' | 'no_action' | 'not_found';
  previousStatus?: string;
}

export const checkStaleRecording = task({
  id: TASK_IDS.CHECK_STALE_RECORDING,
  maxDuration: MAX_DURATIONS.STALE_CHECK,
  run: async (payload: CheckStaleRecordingPayload): Promise<CheckStaleRecordingResult> => {
    const { recordingId } = payload;

    logger.info('Starting stale recording check', { recordingId });

    const recordingRepo = new RecordingRepository(db);

    // Check if recording exists with STALE status group (pending)
    // This pre-filters at the database level, so if null, it's either:
    // - Not found
    // - Already deleted
    // - Completed successfully (available)
    const recording = await recordingRepo.findByIdWithStatusGroup(recordingId, 'STALE');

    if (!recording) {
      logger.info('Recording not found or not in STALE status, skipping', { recordingId });
      return {
        recordingId,
        action: 'not_found',
      };
    }

    // Short-circuiting based on isDeleted should not be done as pending recordings are already marked as deleted to prevent getting looked up by dashboard facing endpoints

    // Trigger resource cleanup immediately (no delay needed, upload already stale)
    await deleteRecordingResources.trigger(
      {
        recordingId,
      },
      {
        idempotencyKey: buildRecordingDeletionKey(recordingId),
      }
    );

    logger.info('Stale recording marked as deleted and cleanup triggered', {
      recordingId,
      previousStatus: recording.uploadStatus,
    });

    return {
      recordingId,
      action: 'cleaned_up',
      previousStatus: recording.uploadStatus,
    };
  },
});
