/**
 * Database enum constants - single source of truth for all enum values
 * These values are used to create both PostgreSQL enums and Zod schemas
 */

/**
 * Domain verification status
 */
export const DOMAIN_STATUS_VALUES = ['pending', 'verified', 'revoked'] as const;
export type DomainStatus = (typeof DOMAIN_STATUS_VALUES)[number];

/**
 * Workspace member roles
 */
export const WORKSPACE_ROLE_VALUES = ['owner', 'admin', 'member'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLE_VALUES)[number];

/**
 * Link provider integrations
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
 * Link content types
 */
export const LINK_TYPE_VALUES = ['file', 'recording', 'session', 'screenshot'] as const;
export type LinkType = (typeof LINK_TYPE_VALUES)[number];

/**
 * Recording upload status
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
 * File types for recording uploads
 * Maps to recording table columns: video, thumbnail, console_log, network_log
 */
export const FILE_TYPE_VALUES = ['video', 'thumbnail', 'console_log', 'network_log'] as const;
export type FileType = (typeof FILE_TYPE_VALUES)[number];

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
