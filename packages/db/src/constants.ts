/**
 * Database enum constants
 *
 * API-contract constants are imported from @userplane/contract (single source of truth)
 * Database-specific constants are defined here
 *
 * NOTE: The enum values below are defined in @userplane/contract/src/schemas/common.ts
 * They are re-exported here for backward compatibility and used to create PostgreSQL enum types
 */

/**
 * Re-export contract enums for backward compatibility
 * Source of truth: @userplane/contract/src/schemas/common.ts
 */
export {
  DOMAIN_STATUS_VALUES,
  type DomainStatus,
  FILE_TYPE_VALUES,
  type FileType,
  LINK_PROVIDER_TYPE_VALUES,
  LINK_TYPE_VALUES,
  type LinkProviderType,
  type LinkType,
  UPLOAD_STATUS_VALUES,
  type UploadStatus,
  WORKSPACE_INVITE_POLICY_VALUES,
  WORKSPACE_ROLE_VALUES,
  type WorkspaceInvitePolicy,
  type WorkspaceRole,
} from '@userplane/contract';

/**
 * Stream providers for hot storage
 */
export const STREAM_PROVIDER_VALUES = ['cloudflare', 'mux'] as const;
export type StreamProvider = (typeof STREAM_PROVIDER_VALUES)[number];

/**
 * Streaming status for hot storage
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
 * Re-export pricing-related constants for database schema
 * Source of truth: @userplane/pricing
 * These are used to create PostgreSQL enum types and maintain consistency
 */
export { RESOURCE_TYPE_VALUES, type ResourceType } from '@userplane/pricing';
