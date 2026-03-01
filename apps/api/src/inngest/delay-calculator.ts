/**
 * Delay calculation utilities for deletion tasks
 * Calculates appropriate delays based on upload status to allow pending operations to complete
 * Returns epoch milliseconds for Inngest's `ts` field on send()
 */

import type { Recording } from '@userplane/db';

import { env } from '@/api/env';
import { RECORDING_STATUS_GROUPS } from '@/api/schema/recording.schema';

/**
 * getPurgeDelayTimestamp - get the timestamp for purging a recording
 * If the recording is in the STALE status group, return a future timestamp
 * If the recording is in the AVAILABLE status group, return undefined i.e. no delay.
 * @param uploadStatus
 * @returns epoch ms timestamp for Inngest's `ts` field, or undefined for immediate execution
 */
export function getPurgeDelayTimestamp(
  uploadStatus: Recording['uploadStatus'] = 'available'
): number | undefined {
  if (uploadStatus in RECORDING_STATUS_GROUPS.STALE) {
    const delayMinutes = Math.ceil(env.session.presignedUrlExpiry / 60);
    return Date.now() + delayMinutes * 60 * 1000;
  }
  return undefined; // No delay for AVAILABLE status group
}
