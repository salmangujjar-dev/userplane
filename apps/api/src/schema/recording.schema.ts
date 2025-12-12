/**
 * Recording validation schemas
 * Schemas for recording operations
 */

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
 * API always returns AVAILABLE recordings (available, partial) by default
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
   * Available recordings - fully uploaded and ready, or partially uploaded
   * Includes: available, partial
   * This is the default for API-facing endpoints
   */
  AVAILABLE: ['available', 'partial'] as const,

  /**
   * Terminal recordings - uploads that have reached a final state
   * Includes: available, failed, expired, purged
   * Used internally for non-reusable link validation
   */
  TERMINAL: ['available', 'failed', 'expired', 'purged'] as const,

  /**
   * Stale recordings - failed or expired uploads
   * Includes: failed, expired, purged
   * Used internally for cleanup/monitoring
   */
  STALE: ['failed', 'expired', 'purged'] as const,

  /**
   * Unavailable recordings - not yet ready or failed
   * Includes: pending, failed, expired, purged
   * Used internally for status tracking
   */
  UNAVAILABLE: ['pending', 'failed', 'expired', 'purged'] as const,

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
 * Upload status values (derived from database schema)
 */
export type UploadStatus = 'pending' | 'partial' | 'available' | 'failed' | 'expired' | 'purged';

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
