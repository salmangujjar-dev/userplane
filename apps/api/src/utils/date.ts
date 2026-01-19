/**
 * Date utility functions for restoration and deletion operations
 */

import type { RestorationStatus } from '@workspace/contract';

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
