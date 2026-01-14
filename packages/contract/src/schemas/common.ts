import { z } from 'zod';
import validator from 'validator';

/**
 * Email schema with normalization
 * Uses validator.normalizeEmail to handle casing and other normalization
 * This should be used for ALL email inputs to ensure consistent handling
 */
export const EmailSchema = z
  .string()
  .transform((value) => validator.normalizeEmail(value))
  .refine((value): value is string => value !== false, {
    message: 'Invalid email address',
  });

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
 * Workspace invite policy values
 * - private: Not discoverable, only explicit invites work
 * - whitelisted: Discoverable, matching domains can join directly
 * - protected: Discoverable, matching domains can request access (owner approval required)
 */
export const WORKSPACE_INVITE_POLICY_VALUES = ['private', 'whitelisted', 'protected'] as const;
export type WorkspaceInvitePolicy = (typeof WORKSPACE_INVITE_POLICY_VALUES)[number];

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
export const UPLOAD_STATUS_VALUES = ['pending', 'available', 'expired', 'purged'] as const;
export type UploadStatus = (typeof UPLOAD_STATUS_VALUES)[number];

/**
 * File type values for recording uploads
 * Maps to recording table columns: video, thumbnail, console_log, network_log, action
 */
export const FILE_TYPE_VALUES = [
  'video',
  'thumbnail',
  'console_log',
  'network_log',
  'action',
] as const;
export type FileType = (typeof FILE_TYPE_VALUES)[number];
export type UploadFileType = FileType;

/**
 * Pagination metadata
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

/**
 * Pagination query parameters
 * Uses coerce to handle HTTP query params which are always strings
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  per_page: z.coerce.number().int().min(1).max(20).optional().default(10),
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
 * Workspace invite policy enum
 * Synced with database: WORKSPACE_INVITE_POLICY_VALUES
 */
export const WorkspaceInvitePolicySchema = z.enum(WORKSPACE_INVITE_POLICY_VALUES);

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
