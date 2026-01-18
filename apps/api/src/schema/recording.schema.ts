/**
 * Recording validation schemas
 * Schemas for recording operations
 */

import type { Recording } from '@workspace/db';
import { z } from 'zod';

import { SORT_DIRECTIONS } from './common.schema';

/**
 * Sortable fields for recordings
 */
export const RECORDING_SORT_FIELDS = ['created_at', 'recording_duration'] as const;

/**
 * List recordings query schema
 * Validates pagination, filter, and sort parameters
 * Filters accept comma-separated values for multiple selections
 * Note: statusGroup is intentionally NOT exposed at API level
 * API always returns AVAILABLE recordings (available) by default
 */
export const listRecordingsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, { message: 'Page must be at least 1' }),
  per_page: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 20, { message: 'Per page must be between 1 and 20' }),
  created_by: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return val
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');
    }),
  project_id: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return val
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');
    }),
  link_id: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return val
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');
    }),
  sort_by: z.enum(RECORDING_SORT_FIELDS).optional().default('created_at'),
  sort_direction: z.enum(SORT_DIRECTIONS).optional().default('desc'),
});

/**
 * Recording status groups for filtering
 * Groups upload statuses into logical categories for querying
 * Note: API layer only exposes AVAILABLE recordings by default
 */
export const RECORDING_STATUS_GROUPS = {
  /**
   * Available recordings - fully uploaded and ready
   * Includes: available
   * This is the default for API-facing endpoints
   */
  AVAILABLE: ['available'] as const,

  /**
   * Terminal recordings - uploads that have reached a final state
   * Includes: available, expired, purged
   * Used internally for non-reusable link validation
   */
  TERMINAL: ['available', 'expired', 'purged'] as const,

  /**
   * Stale recordings - pending uploads that never completed
   * Includes: pending
   * Used internally for cleanup of stale recordings
   */
  STALE: ['pending'] as const,

  /**
   * Orphan recordings - recordings which are no longer associated
   * Includes: pending, available
   * Used internally for cleanup of orphan recordings
   */
  ORPHAN: ['pending', 'available'] as const,

  /**
   * Unavailable recordings - not yet ready or expired
   * Includes: pending, expired, purged
   * Used internally for status tracking
   */
  UNAVAILABLE: ['pending', 'expired', 'purged'] as const,

  /**
   * Pending recordings - currently being uploaded
   * Includes: pending
   * Used internally for upload tracking
   */
  PENDING: ['pending'] as const,
} as const;

/**
 * Status group keys as union type
 */
export type RecordingStatusGroup = keyof typeof RECORDING_STATUS_GROUPS;

/**
 * Upload status values (derived from database enum)
 * Automatically stays in sync with the database schema
 */
export type UploadStatus = Recording['uploadStatus'];

/**
 * Get upload statuses for a given status group
 * Used by repository layer to filter recordings by status group
 */
export function getUploadStatusesForGroup(group: RecordingStatusGroup): readonly UploadStatus[] {
  return RECORDING_STATUS_GROUPS[group];
}

/**
 * Type-safe helper to check if a status belongs to a group
 */
export function isStatusInGroup(status: UploadStatus, group: RecordingStatusGroup): boolean {
  return (RECORDING_STATUS_GROUPS[group] as readonly string[]).includes(status);
}
