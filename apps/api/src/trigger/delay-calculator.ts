/**
 * Delay calculation utilities for deletion tasks
 * Calculates appropriate delays based on upload status to allow pending operations to complete
 */

import { env } from '@/api/env';
import type { Recording } from '@workspace/db';

/**
 * Calculate delay for recording deletion based on uploadStatus
 * Uses presignedUrlExpiry as base to ensure uploads complete before cleanup
 *
 * For pending/partial/failed uploads: delay = presignedUrlExpiry (converted to minutes)
 * For available uploads: no delay (immediate cleanup)
 *
 * @param uploadStatus - The recording upload status
 * @returns Delay string (e.g. "90m") or undefined for no delay
 */
export function calculateDelay(uploadStatus: Recording['uploadStatus']): string | undefined {
  if (uploadStatus === 'pending' || uploadStatus === 'partial' || uploadStatus === 'failed') {
    const delayMinutes = Math.ceil(env.session.presignedUrlExpiry / 60);
    return `${delayMinutes}m`;
  }
  return undefined;
}
