/**
 * Internal API types
 * Repository filters, sort options, JWT payloads, and other internal implementation details
 * These are NOT exposed via API contracts
 */

import type { z } from 'zod';
import type { Link } from '@workspace/db';
import type { RecordingStatusGroup } from '../schema/recording.schema';
import type { WorkspaceRole, DomainStatus, UploadFileType } from '@workspace/contract';
import type { PlanId as WorkspacePlan } from '@workspace/pricing';
import {
  LinkItemSchema,
  RecordingItemSchema,
  RecordingDetailSchema,
  RecordingResourceSchema,
  VideoSourceSchema,
  SessionPreferencesSchema,
  SessionTokenPayloadSchema,
  UploadTokenPayloadSchema,
  InviteTokenPayloadSchema,
  DomainVerificationTokenPayloadSchema,
  AccessRequestTokenPayloadSchema,
  PresignedUrlInfoSchema,
} from '@workspace/contract';

// Re-export types from contract for convenience
export type { WorkspaceRole, DomainStatus, UploadFileType } from '@workspace/contract';
export type { PlanId as WorkspacePlan } from '@workspace/pricing';

/**
 * Types inferred from contract schemas
 */
export type LinkItem = z.infer<typeof LinkItemSchema>;
export type RecordingItem = z.infer<typeof RecordingItemSchema>;
export type RecordingDetail = z.infer<typeof RecordingDetailSchema>;
export type ResourceResponse = z.infer<typeof RecordingResourceSchema>;
export type VideoSource = z.infer<typeof VideoSourceSchema>;
export type SessionPreferences = z.infer<typeof SessionPreferencesSchema>;
export type SessionTokenPayload = z.infer<typeof SessionTokenPayloadSchema>;
export type UploadTokenPayload = z.infer<typeof UploadTokenPayloadSchema>;
export type InviteTokenPayload = z.infer<typeof InviteTokenPayloadSchema>;
export type DomainVerificationTokenPayload = z.infer<typeof DomainVerificationTokenPayloadSchema>;
export type AccessRequestTokenPayload = z.infer<typeof AccessRequestTokenPayloadSchema>;
export type PresignedUrlInfo = z.infer<typeof PresignedUrlInfoSchema>;

/**
 * Link type inferred from database schema
 */
export type LinkType = Link['linkType'];

/**
 * Link provider type inferred from database schema
 */
export type LinkProviderType = NonNullable<Link['linkProviderType']>;

/**
 * Sortable fields for links
 */
export type LinkSortField = 'created_at' | 'link_title';

/**
 * Sort direction for queries
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sorting options for links
 */
export interface LinkSortOptions {
  field: LinkSortField;
  direction: SortDirection;
}

/**
 * Filters for listing links
 */
export interface LinkFilters {
  createdBy?: string[];
  projectId?: string[];
  domainId?: string[];
  linkProviderType?: LinkProviderType[];
  linkType?: LinkType;
}

/**
 * Sortable fields for recordings
 */
export type RecordingSortField = 'created_at' | 'recording_duration';

/**
 * Sorting options for recordings
 */
export interface RecordingSortOptions {
  field: RecordingSortField;
  direction: SortDirection;
}

/**
 * Filters for listing recordings
 */
export interface RecordingFilters {
  createdBy?: string[];
  projectId?: string[];
  linkId?: string[];
  statusGroup?: RecordingStatusGroup; // Internal use only - not exposed at API
}

/**
 * Repository input types
 */

/**
 * Workspace creation input for repository
 */
export interface CreateWorkspaceInput {
  workspaceId: string;
  workspaceName: string;
  recordingSlug: string;
  workspacePlan: WorkspacePlan;
  workspaceInviteToken: string;
  workspaceBillingEmail?: string;
  recordingCompanyName?: string;
  recordingHeader?: string;
  recordingFootnote?: string | null;
  recordingPrimaryColor?: string;
  recordingMaxDurationMs?: number;
}

/**
 * Workspace member creation input for repository
 */
export interface CreateWorkspaceMemberInput {
  workspaceMemberId: string;
  userId: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
}

/**
 * Project creation input for repository
 */
export interface CreateProjectInput {
  projectId: string;
  workspaceId: string;
  projectTitle: string | null;
  isDefault: boolean;
}

/**
 * Domain creation input for repository
 */
export interface CreateDomainInput {
  domainId: string;
  workspaceId: string;
  url: string;
  domainStatus: DomainStatus;
}

/**
 * Workspace invitation email parameters
 */
export interface WorkspaceInviteEmailParams {
  to: string;
  workspaceName: string;
  inviteUrl: string;
  inviterName: string;
  inviterEmail: string;
}

/**
 * Access request email parameters
 */
export interface AccessRequestEmailParams {
  to: string;
  workspaceName: string;
  requesterName: string;
  requesterEmail: string;
  reviewUrl: string;
}

/**
 * Internal invite action result for service orchestration
 */
export interface InviteActionResult {
  status: 'valid' | 'accepted' | 'invalid' | 'expired' | 'already_member';
  workspaceId?: string;
  workspaceName?: string;
  inviterName?: string;
  inviterEmail?: string;
  message?: string;
}

/**
 * Service method parameters
 */

/**
 * Parameters for creating a workspace
 */
export interface CreateWorkspaceParams {
  workspaceName: string;
  recordingSlug?: string;
  workspacePlan: WorkspacePlan;
  userId: string;
  workspaceBillingEmail?: string;
}
