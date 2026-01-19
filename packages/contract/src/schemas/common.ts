import validator from 'validator';
import { z } from 'zod';

/**
 * Restoration status enum for soft-deleted resources
 * - possible: Full restoration available (within grace period)
 * - partial: Partial restoration available (beyond grace period but within max window)
 * - impossible: Restoration not available (beyond max window or not deleted)
 */
export const RestorationStatusSchema = z.enum(['possible', 'partial', 'impossible']);

/**
 * Type inference from RestorationStatusSchema
 */
export type RestorationStatus = z.infer<typeof RestorationStatusSchema>;

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

// ============================================================================
// URL & DOMAIN VALIDATION SCHEMAS
// ============================================================================

/**
 * Base URL schema for validating URL strings with protocol (http/https)
 * Example: "https://example.com" or "http://example.com"
 *
 * Use this as the base and chain .optional() where needed instead of creating OptionalUrlSchema
 */
export const URLSchema = z.string().refine(
  (value) => {
    // Allow localhost and local IPs
    return validator.isURL(value, {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
      require_host: true,
      require_tld: false, // Allow localhost without TLD
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
    });
  },
  {
    message: 'Please enter a valid URL',
  }
);

/**
 * Domain URL schema that validates proper domain format
 * Builds on top of URLSchema with additional FQDN validation
 * Accepts: https://example.com, https://subdomain.example.com, https://localhost, http://127.0.0.1
 * Rejects: single characters, incomplete domains
 */
export const DomainUrlSchema = URLSchema.refine((value) => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    // Allow localhost
    if (hostname === 'localhost') return true;

    // Allow valid IP addresses (IPv4 and IPv6)
    if (validator.isIP(hostname)) return true;

    // Allow local development domains (e.g., localhost:3000, 127.0.0.1:3000)
    if (hostname.startsWith('127.') || hostname.startsWith('0.0.0.0')) return true;

    // Validate as FQDN (fully qualified domain name)
    // Require at least one dot for proper domains
    return validator.isFQDN(hostname, {
      require_tld: true,
      allow_underscores: false,
      allow_trailing_dot: false,
    });
  } catch {
    // If URL parsing fails, return false
    return false;
  }
}, 'Please enter a valid domain (e.g., https://example.com, https://localhost, http://127.0.0.1)');

/**
 * Zod schema for validating email domains (FQDNs only, no protocol required)
 * Accepts: example.com, subdomain.example.com, mail.company.org
 * Rejects: https://example.com, localhost, 127.0.0.1, single words
 */
export const EmailDomainSchema = z
  .string()
  .min(1, 'Email domain is required')
  .trim()
  .refine((value) => {
    // Skip validation if empty (will be caught by .min())
    if (!value || value.trim() === '') return true;

    // Should not contain protocol
    if (value.match(/^https?:\/\//i)) {
      return false;
    }

    // Validate as FQDN (fully qualified domain name)
    return validator.isFQDN(value, {
      require_tld: true,
      allow_underscores: false,
      allow_trailing_dot: false,
    });
  }, 'Please enter a valid domain (e.g., example.com)');

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

/**
 * @deprecated Use URLSchema instead
 */
export const UrlWithProtocolSchema = URLSchema;

// ============================================================================
// COMMON ENUMS AND CONSTANTS
// ============================================================================

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
 * Recording streaming status values
 */
export const STREAMING_STATUS_VALUES = [
  'pending',
  'available',
  'failed',
  'expired',
  'purged',
] as const;
export type StreamingStatus = (typeof STREAMING_STATUS_VALUES)[number];

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
 * Sort direction values
 */
export const SORT_DIRECTION_VALUES = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTION_VALUES)[number];

/**
 * Sort directions
 */
export const SortDirectionSchema = z.enum(SORT_DIRECTION_VALUES);

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

// ============================================================================
// DOMAIN-SPECIFIC ID SCHEMAS
// ============================================================================

/**
 * Domain-specific ID schemas for better type safety
 * These provide consistent validation and error messages across the codebase
 */

/**
 * Workspace ID schema
 */
export const WorkspaceIdSchema = z.string().min(1, 'Workspace ID is required');

/**
 * User ID schema
 */
export const UserIdSchema = z.string().min(1, 'User ID is required');

/**
 * Project ID schema
 */
export const ProjectIdSchema = z.string().min(1, 'Project ID is required');

/**
 * Recording ID schema
 */
export const RecordingIdSchema = z.string().min(1, 'Recording ID is required');

/**
 * Link ID schema
 */
export const LinkIdSchema = z.string().min(1, 'Link ID is required');

/**
 * Domain ID schema
 */
export const DomainIdSchema = z.string().min(1, 'Domain ID is required');

/**
 * Workspace member ID schema
 */
export const WorkspaceMemberIdSchema = z.string().min(1, 'Workspace member ID is required');

/**
 * Session ID schema
 */
export const SessionIdSchema = z.string().min(1, 'Session ID is required');

/**
 * Generic token schema
 * Used for invite tokens, access tokens, verification tokens, etc.
 */
export const TokenSchema = z.string().min(1, 'Token is required');

// ============================================================================
// NAME & STRING LENGTH SCHEMAS
// ============================================================================

/**
 * Standard name schema for user names, member names, etc.
 * Trims whitespace and validates length
 */
export const NameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters');

/**
 * Standard search query schema
 * Used across all search endpoints for consistency
 */
export const SearchQuerySchema = z
  .string()
  .min(1, 'Search query is required')
  .max(100, 'Search query must be less than 100 characters');

/**
 * Standard reason text schema
 * Used for ban reasons, error descriptions, etc.
 */
export const ReasonTextSchema = z
  .string()
  .min(1, 'Reason is required')
  .max(500, 'Reason must be less than 500 characters');

/**
 * Standard reference text schema
 * Used for external references, provider refs, etc.
 */
export const ReferenceTextSchema = z
  .string()
  .max(2048, 'Reference must be less than 2048 characters');

/**
 * Standard title schema for link titles, etc.
 * Allows nullable for optional titles
 */
export const TitleSchema = z.string().trim().max(255, 'Title must be less than 255 characters');

/**
 * Standard provider ID schema
 * Used for external provider IDs (Intercom, Zendesk, etc.)
 */
export const ProviderIdSchema = z.string().max(255, 'Provider ID must be less than 255 characters');

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

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

/**
 * Streaming status enum
 * Synced with database: STREAMING_STATUS_VALUES
 */
export const StreamingStatusSchema = z.enum(STREAMING_STATUS_VALUES);

// ============================================
// ADMIN-SPECIFIC CONSTANTS
// ============================================

/**
 * Admin user sort field values
 */
export const ADMIN_USER_SORT_FIELDS = ['createdAt', 'name', 'email'] as const;
export type AdminUserSortField = (typeof ADMIN_USER_SORT_FIELDS)[number];

/**
 * Admin user filter status values
 */
export const ADMIN_USER_FILTER_STATUS_VALUES = ['active', 'banned'] as const;
export type AdminUserFilterStatus = (typeof ADMIN_USER_FILTER_STATUS_VALUES)[number];

/**
 * Admin workspace sort field values
 */
export const ADMIN_WORKSPACE_SORT_FIELDS = ['createdAt', 'name', 'memberCount'] as const;
export type AdminWorkspaceSortField = (typeof ADMIN_WORKSPACE_SORT_FIELDS)[number];

/**
 * Admin workspace filter status values
 */
export const ADMIN_WORKSPACE_FILTER_STATUS_VALUES = ['active', 'deleted'] as const;
export type AdminWorkspaceFilterStatus = (typeof ADMIN_WORKSPACE_FILTER_STATUS_VALUES)[number];

/**
 * Admin project sort field values
 */
export const ADMIN_PROJECT_SORT_FIELDS = ['created_at', 'project_title', 'updated_at'] as const;
export type AdminProjectSortField = (typeof ADMIN_PROJECT_SORT_FIELDS)[number];

/**
 * Admin filter status values (with all option)
 */
export const ADMIN_FILTER_STATUS_VALUES = ['all', 'active', 'deleted'] as const;
export type AdminFilterStatus = (typeof ADMIN_FILTER_STATUS_VALUES)[number];

/**
 * Admin recording stats weeks to show values
 */
export const ADMIN_RECORDING_WEEKS_VALUES = ['12', '24', '36', '48'] as const;
export type AdminRecordingWeeks = (typeof ADMIN_RECORDING_WEEKS_VALUES)[number];

/**
 * Admin provision member role values
 */
export const ADMIN_PROVISION_ROLE_VALUES = ['admin', 'member'] as const;
export type AdminProvisionRole = (typeof ADMIN_PROVISION_ROLE_VALUES)[number];

/**
 * Admin workspace invite notify duration values
 * Determines when to send the invite email
 */
export const ADMIN_NOTIFY_DURATION_VALUES = [
  'never',
  'immediate',
  '5m',
  '15m',
  '30m',
  '60m',
] as const;
export type AdminNotifyDuration = (typeof ADMIN_NOTIFY_DURATION_VALUES)[number];
