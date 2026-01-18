/**
 * Delay calculation utilities for deletion tasks
 * Calculates appropriate delays based on upload status to allow pending operations to complete
 */

import type { Recording } from '@workspace/db';

import { env } from '@/api/env';
import { RECORDING_STATUS_GROUPS } from '@/api/schema/recording.schema';

/**
 * getPurgeDelay - get the delay for purging a recording
 * If the recording is in the STALE status group, return the delay for purging the recording
 * If the recording is in the AVAILABLE status group, return undefined i.e. no delay.
 * @param uploadStatus
 * @returns
 */
export function getPurgeDelay(
  uploadStatus: Recording['uploadStatus'] = 'available'
): string | undefined {
  if (uploadStatus in RECORDING_STATUS_GROUPS.STALE) {
    const delayMinutes = Math.ceil(env.session.presignedUrlExpiry / 60);
    return `${delayMinutes}m`; // Delay for STALE status group
  }
  return undefined; // No delay for AVAILABLE status group
}
