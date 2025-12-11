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
  created_by: z.string().optional(),
  project_id: z.string().optional(),
  sort_by: z.enum(RECORDING_SORT_FIELDS).optional().default('created_at'),
  sort_direction: z.enum(SORT_DIRECTIONS).optional().default('desc'),
});
