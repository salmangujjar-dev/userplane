import { z } from 'zod';

/**
 * Common schemas and enum constants used across multiple API contracts
 *
 * IMPORTANT: This is the single source of truth for all enum values used in both API and database.
 *
 * WARNING: Changing these enum constants requires corresponding changes in @workspace/db package:
 * - Database schema definitions (PostgreSQL enum types)
 * - Database migrations to add/remove/rename enum values
 * - Any existing database records with these enum values
 *
 * The @workspace/db package imports and re-exports these constants to maintain backward compatibility.
 */

/**
 * Domain verification status values
 */
export const DOMAIN_STATUS_VALUES = ['pending', 'verified', 'revoked'] as const;
export type DomainStatus = (typeof DOMAIN_STATUS_VALUES)[number];

/**
 * Workspace member role values
 */
export const WORKSPACE_ROLE_VALUES = ['owner', 'admin', 'member'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLE_VALUES)[number];

/**
 * Link provider integration values
 */
export const LINK_PROVIDER_TYPE_VALUES = [
  // Support/Helpdesk
  'intercom',
  'zendesk',
  'hubspot',
  'freshdesk',
  'freshchat',
  'jira_service_management',
  'helpscout',
  'happyfox',
  'ada',
  'forethought',
  'servicenow',
  'front',
  'zoho_desk',
  'crisp',
  'pylon',
  'plain',
  // Project Management / Dev Tools
  'asana',
  'azure_devops',
  'clickup',
  'github',
  'gitlab',
  'jira',
  'linear',
  'notion',
  'sentry',
  'slack',
  // Fallback
  'web',
  'others',
] as const;
export type LinkProviderType = (typeof LINK_PROVIDER_TYPE_VALUES)[number];

/**
 * Link content type values
 */
export const LINK_TYPE_VALUES = ['file', 'recording', 'session', 'screenshot'] as const;
export type LinkType = (typeof LINK_TYPE_VALUES)[number];

/**
 * Recording upload status values
 */
export const UPLOAD_STATUS_VALUES = [
  'pending',
  'partial',
  'available',
  'failed',
  'expired',
  'purged',
] as const;
export type UploadStatus = (typeof UPLOAD_STATUS_VALUES)[number];

/**
 * File type values for recording uploads
 * Maps to recording table columns: video, thumbnail, console_log, network_log
 */
export const FILE_TYPE_VALUES = ['video', 'thumbnail', 'console_log', 'network_log'] as const;
export type FileType = (typeof FILE_TYPE_VALUES)[number];

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
