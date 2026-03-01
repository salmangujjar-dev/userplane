/**
 * Date utility functions for restoration and deletion operations
 */

import type { AdminNotifyDuration, RestorationStatus } from '@userplane/contract';

import { env } from '@/api/env';

/**
 * Calculate days since a date
 * Returns a number rounded to 1 decimal place
 */
export function calculateDaysSince(date: Date): number {
  const now = new Date();
  const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(daysSince * 10) / 10;
}

/**
 * Get restoration grace period from environment
 * Within this period, full restoration is possible
 */
export function getRestorationGracePeriodDays(): number {
  return env.restoration.gracePeriodDays;
}

/**
 * Get maximum restoration window from environment
 * Beyond this period, restoration is impossible
 */
export function getRestorationMaxWindowDays(): number {
  return env.restoration.maxWindowDays;
}

/**
 * Determine restoration status based on days since deletion
 * - possible: within grace period (full restoration)
 * - partial: beyond grace period but within max window (some data may not be recoverable)
 * - impossible: beyond max window (restoration period expired)
 */
export function getRestorationStatus(daysSinceDeletion: number): RestorationStatus {
  const gracePeriod = getRestorationGracePeriodDays();
  const maxWindow = getRestorationMaxWindowDays();

  if (daysSinceDeletion <= gracePeriod) {
    return 'possible';
  } else if (daysSinceDeletion <= maxWindow) {
    return 'partial';
  } else {
    return 'impossible';
  }
}

/**
 * Get reason message for restoration status
 */
export function getRestorationReason(status: RestorationStatus): string | undefined {
  const gracePeriod = getRestorationGracePeriodDays();
  const maxWindow = getRestorationMaxWindowDays();

  switch (status) {
    case 'partial':
      return `Some data may not be recoverable after ${gracePeriod} days`;
    case 'impossible':
      return `Restoration period has expired (${maxWindow} days)`;
    default:
      return undefined;
  }
}

/**
 * Maximum restoration window in days
 * @deprecated Use getRestorationMaxWindowDays() instead
 */
export const RESTORATION_WINDOW_DAYS = getRestorationMaxWindowDays();

/**
 * Calculate scheduled time for email notifications based on AdminNotifyDuration
 * Returns ISO string for scheduled time, or undefined for 'never' or 'immediate'
 *
 * @param notify - The notification timing option
 * @returns ISO string of scheduled time, or undefined if immediate/never
 *
 * @example
 * ```typescript
 * const scheduledAt = calculateScheduledTime('5m');
 * // Returns: "2024-01-01T12:05:00.000Z" (5 minutes from now)
 *
 * const immediate = calculateScheduledTime('immediate');
 * // Returns: undefined
 * ```
 */
export function calculateScheduledTime(notify: AdminNotifyDuration): string | undefined {
  // No scheduling for 'never' or 'immediate'
  if (notify === 'never' || notify === 'immediate') {
    return undefined;
  }

  // Parse the duration string (e.g., '5m', '15m', '30m', '60m')
  const minutes = Number.parseInt(notify.replace('m', ''), 10);

  // Validate parsed minutes
  if (Number.isNaN(minutes) || minutes <= 0) {
    return undefined;
  }

  // Calculate scheduled time
  const scheduleDate = new Date();
  scheduleDate.setMinutes(scheduleDate.getMinutes() + minutes);

  return scheduleDate.toISOString();
}
