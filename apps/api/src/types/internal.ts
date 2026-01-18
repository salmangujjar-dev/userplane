/**
 * Internal API types
 * Repository filters, sort options, JWT payloads, and other internal implementation details
 * These are NOT exposed via API contracts
 */

import type { DomainStatus, WorkspaceRole } from '@workspace/contract';
import {
  AccessRequestTokenPayloadSchema,
  DomainVerificationTokenPayloadSchema,
  InviteTokenPayloadSchema,
  LinkItemSchema,
  PresignedUrlInfoSchema,
  RecordingDetailSchema,
  RecordingItemSchema,
  RecordingResourceSchema,
  SessionPreferencesSchema,
  SessionTokenPayloadSchema,
  UploadTokenPayloadSchema,
  VideoSourceSchema,
  WorkspaceCreateInviteTokenPayloadSchema,
} from '@workspace/contract';
import type { Link } from '@workspace/db';
import type { PlanId as WorkspacePlan } from '@workspace/pricing';
import type { z } from 'zod';

import type { RecordingStatusGroup } from '../schema/recording.schema';

// Re-export types from contract for convenience
export type { DomainStatus, UploadFileType, WorkspaceRole } from '@workspace/contract';
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
export type WorkspaceCreateInviteTokenPayload = z.infer<
  typeof WorkspaceCreateInviteTokenPayloadSchema
>;
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
  workspaceBillingEmail: string;
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
 * Domain developer instructions email parameters
 */
export interface DomainDeveloperInstructionsEmailParams {
  to: string;
  domainName: string;
  settingsUrl: string;
  docsUrl: string;
}

/**
 * Magic link email parameters
 */
export interface MagicLinkEmailParams {
  to: string;
  magicLinkUrl: string;
}

/**
 * Subscription active email parameters
 */
export interface SubscriptionActiveEmailParams {
  to: string;
  planName: string;
  dashboardUrl: string;
  billingUrl: string;
}

/**
 * Subscription expired email parameters
 */
export interface SubscriptionExpiredEmailParams {
  to: string;
  planName: string;
  renewUrl: string;
}

/**
 * Subscription inactive email parameters
 */
export interface SubscriptionInactiveEmailParams {
  to: string;
  planName: string;
  reactivateUrl: string;
}

/**
 * Subscription plan change email parameters
 */
export interface SubscriptionPlanChangeEmailParams {
  to: string;
  previousPlan: string;
  newPlan: string;
  effectiveDate: string;
  billingUrl: string;
}

/**
 * Subscription reverse trial email parameters
 */
export interface SubscriptionReverseTrialEmailParams {
  to: string;
  planName: string;
  trialDays: number;
  dashboardUrl: string;
}

/**
 * Recordings soft limit reached email parameters
 */
export interface RecordingsSoftLimitEmailParams {
  to: string;
  workspaceName: string;
  usedMinutes: number;
  totalMinutes: number;
  upgradeUrl: string;
}

/**
 * Recordings hard limit reached email parameters
 */
export interface RecordingsHardLimitEmailParams {
  to: string;
  workspaceName: string;
  totalMinutes: number;
  upgradeUrl: string;
}

/**
 * Recordings requested upgrade email parameters
 */
export interface RecordingsRequestedUpgradeEmailParams {
  to: string;
  workspaceName: string;
  requesterName: string;
  billingUrl: string;
}

/**
 * Seats soft limit reached email parameters
 */
export interface SeatsSoftLimitEmailParams {
  to: string;
  workspaceName: string;
  usedSeats: number;
  totalSeats: number;
  upgradeUrl: string;
}

/**
 * Seats hard limit reached email parameters
 */
export interface SeatsHardLimitEmailParams {
  to: string;
  workspaceName: string;
  totalSeats: number;
  upgradeUrl: string;
}

/**
 * Seats requested upgrade email parameters
 */
export interface SeatsRequestedUpgradeEmailParams {
  to: string;
  workspaceName: string;
  requesterName: string;
  billingUrl: string;
}

/**
 * Links soft limit reached email parameters
 */
export interface LinksSoftLimitEmailParams {
  to: string;
  workspaceName: string;
  usedLinks: number;
  totalLinks: number;
  upgradeUrl: string;
}

/**
 * Links requested upgrade email parameters
 */
export interface LinksRequestedUpgradeEmailParams {
  to: string;
  workspaceName: string;
  requesterName: string;
  billingUrl: string;
}

/**
 * Screenshots soft limit reached email parameters
 */
export interface ScreenshotsSoftLimitEmailParams {
  to: string;
  workspaceName: string;
  usedScreenshots: number;
  totalScreenshots: number;
  upgradeUrl: string;
}

/**
 * Teammate invited email parameters
 */
export interface TeammateInvitedEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
}

/**
 * Account deletion email parameters
 */
export interface AccountDeletionEmailParams {
  to: string;
  userName: string;
  feedbackUrl: string;
}

/**
 * TOS violation email parameters
 */
export interface TosViolationEmailParams {
  to: string;
  userName: string;
  appealUrl: string;
  tosUrl: string;
}

/**
 * Pilot sandbox invite email parameters
 */
export interface PilotSandboxInviteEmailParams {
  to: string;
  sandboxUrl: string;
  expiresInDays: number;
}

/**
 * Recording received email parameters
 */
export interface RecordingReceivedEmailParams {
  to: string;
  recordingTitle: string;
  recordingUrl: string;
  submittedAt: string;
  duration: string;
}

/**
 * Trial reverse trial offer email parameters
 */
export interface TrialReverseTrialOfferEmailParams {
  to: string;
  upgradeUrl: string;
  planName: string;
  trialDays: number;
  remainingDays: number;
}

/**
 * Pilot reverse trial offer email parameters
 */
export interface PilotReverseTrialOfferEmailParams {
  to: string;
  upgradeUrl: string;
  planName: string;
  trialDays: number;
}

/**
 * Workspace access granted email parameters
 */
export interface WorkspaceAccessGrantedEmailParams {
  to: string;
  workspaceName: string;
  dashboardUrl: string;
}

/**
 * Workspace access requested email parameters
 */
export interface WorkspaceAccessRequestedEmailParams {
  to: string;
  workspaceName: string;
  requesterName: string;
  requesterEmail: string;
  reviewUrl: string;
}

/**
 * Workspace deletion scheduled email parameters
 */
export interface WorkspaceDeletionScheduledEmailParams {
  to: string;
  workspaceName: string;
  deletionDate: string;
  cancelUrl: string;
}

/**
 * Workspace deletion confirmation email parameters
 */
export interface WorkspaceDeletionConfirmationEmailParams {
  to: string;
  workspaceName: string;
  feedbackUrl: string;
}

/**
 * Workspace recovery scheduled email parameters
 */
export interface WorkspaceRecoveryScheduledEmailParams {
  to: string;
  workspaceName: string;
  dashboardUrl: string;
}

/**
 * Workspace recovery confirmation email parameters
 */
export interface WorkspaceRecoveryConfirmationEmailParams {
  to: string;
  workspaceName: string;
  dashboardUrl: string;
}

/**
 * Workspace deletion requested email parameters
 */
export interface WorkspaceDeletionRequestedEmailParams {
  to: string;
  workspaceName: string;
  requesterName: string;
  requesterEmail: string;
  deletionDate: string;
  cancelUrl: string;
}

/**
 * Workspace recovery partially email parameters
 */
export interface WorkspaceRecoveryPartiallyEmailParams {
  to: string;
  workspaceName: string;
  dashboardUrl: string;
}

/**
 * Project deletion scheduled email parameters
 */
export interface ProjectDeletionScheduledEmailParams {
  to: string;
  projectName: string;
  deletionDate: string;
  cancelUrl: string;
}

/**
 * Project deletion confirmation email parameters
 */
export interface ProjectDeletionConfirmationEmailParams {
  to: string;
  projectName: string;
}

/**
 * Project recovery scheduled email parameters
 */
export interface ProjectRecoveryScheduledEmailParams {
  to: string;
  projectName: string;
}

/**
 * Project recovery confirmation email parameters
 */
export interface ProjectRecoveryConfirmationEmailParams {
  to: string;
  projectName: string;
  dashboardUrl: string;
}

/**
 * Project deletion requested email parameters
 */
export interface ProjectDeletionRequestedEmailParams {
  to: string;
  projectName: string;
  requesterName: string;
  requesterEmail: string;
  deletionDate: string;
  cancelUrl: string;
}

/**
 * Project recovery partially email parameters
 */
export interface ProjectRecoveryPartiallyEmailParams {
  to: string;
  projectName: string;
  dashboardUrl: string;
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
  workspaceId?: string;
  workspaceName: string;
  recordingSlug?: string;
  workspacePlan: WorkspacePlan;
  userId: string;
  workspaceBillingEmail: string;
}
