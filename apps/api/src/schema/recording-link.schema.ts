/**
 * Recording link validation schemas
 * Schemas for recording link operations
 */

import { z } from 'zod';
import { linkProviderTypeEnum } from '@workspace/db';
import { SORT_DIRECTIONS } from './common.schema';

/**
 * All supported link provider types (from database enum)
 */
export const LINK_PROVIDER_TYPES = linkProviderTypeEnum.enumValues;

/**
 * Sortable fields for recording links
 */
export const RECORDING_LINK_SORT_FIELDS = ['created_at', 'link_title'] as const;

/**
 * List recording links query schema
 * Validates pagination, filter, and sort parameters
 */
export const listRecordingLinksQuerySchema = z.object({
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
  domain_id: z.string().optional(),
  link_provider_type: z.enum(LINK_PROVIDER_TYPES).optional(),
  sort_by: z.enum(RECORDING_LINK_SORT_FIELDS).optional().default('created_at'),
  sort_direction: z.enum(SORT_DIRECTIONS).optional().default('desc'),
});

/**
 * Create recording link schema
 */
export const createRecordingLinkSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required').optional(),
  domainId: z.string().min(1, 'Domain ID is required'),
  linkReference: z.string().max(2048, 'Link reference is too long').optional(),
  linkReusable: z.boolean().optional().default(false),
});

/**
 * Update recording link schema
 * All fields are optional - only provided fields will be updated
 * Note: linkGUID is immutable and cannot be updated
 */
export const updateRecordingLinkSchema = z.object({
  linkTitle: z.string().max(255, 'Title must be less than 255 characters').nullable().optional(),
  linkReusable: z.boolean().optional(),
  linkProviderType: z.enum(LINK_PROVIDER_TYPES).nullable().optional(),
  linkProviderId: z
    .string()
    .max(255, 'Provider ID must be less than 255 characters')
    .nullable()
    .optional(),
  linkProviderRef: z
    .string()
    .max(2048, 'Provider reference must be less than 2048 characters')
    .nullable()
    .optional(),
});
