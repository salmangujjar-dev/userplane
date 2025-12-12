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
