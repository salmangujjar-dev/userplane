import { z } from 'zod';
import {
  DOMAIN_STATUS_VALUES,
  WORKSPACE_ROLE_VALUES,
  LINK_PROVIDER_TYPE_VALUES,
  LINK_TYPE_VALUES,
  UPLOAD_STATUS_VALUES,
  FILE_TYPE_VALUES,
} from '@workspace/db';

/**
 * Common schemas used across multiple API contracts
 * Enum values are imported from @workspace/db to ensure database and API contract alignment
 */

/**
 * Pagination metadata
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

/**
 * Pagination query parameters
 */
export const PaginationQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  per_page: z.number().int().min(1).max(20).optional().default(10),
});

/**
 * Sort directions
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * API response wrapper
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    message: z.string(),
    data: dataSchema,
  });

/**
 * API error response
 */
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

/**
 * ID parameter schema
 */
export const IdParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * Domain status enum
 * Synced with database: DOMAIN_STATUS_VALUES
 */
export const DomainStatusSchema = z.enum(DOMAIN_STATUS_VALUES);

/**
 * Workspace role enum
 * Synced with database: WORKSPACE_ROLE_VALUES
 */
export const WorkspaceRoleSchema = z.enum(WORKSPACE_ROLE_VALUES);

/**
 * Link provider type enum
 * Synced with database: LINK_PROVIDER_TYPE_VALUES
 */
export const LinkProviderTypeSchema = z.enum(LINK_PROVIDER_TYPE_VALUES);

/**
 * Link type enum
 * Synced with database: LINK_TYPE_VALUES
 */
export const LinkTypeSchema = z.enum(LINK_TYPE_VALUES);

/**
 * Upload status enum
 * Synced with database: UPLOAD_STATUS_VALUES
 */
export const UploadStatusSchema = z.enum(UPLOAD_STATUS_VALUES);

/**
 * File type enum for uploads
 * Synced with database: FILE_TYPE_VALUES
 */
export const FileTypeSchema = z.enum(FILE_TYPE_VALUES);

/**
 * Upload state enum
 * API-specific: used in upload completion flow, not stored in database
 */
export const UploadStateSchema = z.enum(['complete', 'partial', 'failed']);
