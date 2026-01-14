/**
 * Database enum constants
 *
 * API-contract constants are imported from @workspace/contract (single source of truth)
 * Database-specific constants are defined here
 *
 * NOTE: The enum values below are defined in @workspace/contract/src/schemas/common.ts
 * They are re-exported here for backward compatibility and used to create PostgreSQL enum types
 */

/**
 * Re-export contract enums for backward compatibility
 * Source of truth: @workspace/contract/src/schemas/common.ts
 */
export {
  DOMAIN_STATUS_VALUES,
  WORKSPACE_ROLE_VALUES,
  WORKSPACE_INVITE_POLICY_VALUES,
  LINK_PROVIDER_TYPE_VALUES,
  LINK_TYPE_VALUES,
  UPLOAD_STATUS_VALUES,
  FILE_TYPE_VALUES,
  type DomainStatus,
  type WorkspaceRole,
  type WorkspaceInvitePolicy,
  type LinkProviderType,
  type LinkType,
  type UploadStatus,
  type FileType,
} from '@workspace/contract';

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
 * Resource types for entitlements
 */
export const RESOURCE_TYPE_VALUES = [
  'seats',
  'links',
  'recordings',
  'recording_links',
  'logs',
  'screenshots',
] as const;
export type ResourceType = (typeof RESOURCE_TYPE_VALUES)[number];
