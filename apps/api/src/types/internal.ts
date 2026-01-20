/**
 * Internal API types
 * Repository filters, sort options, JWT payloads, and other internal implementation details
 * These are NOT exposed via API contracts
 */

import type { DomainStatus, WorkspaceRole } from '@workspace/contract';
import {
  AccessRequestTokenPayloadSchema,
  BillingEmailVerificationTokenPayloadSchema,
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
import type {
  AccessRequestEmailProps,
  AccountDeletionEmailProps,
  AccountDeletionVerificationEmailProps,
  AccountRestoredEmailProps,
  BillingEmailUpdatedEmailProps,
  BillingEmailVerificationEmailProps,
  DeletionScheduledEmailProps,
  DomainDeveloperInstructionsEmailProps,
  EmailVerificationEmailProps,
  MagicLinkEmailProps,
  ProjectDeletionScheduledEmailProps,
  ProjectRecoveryConfirmationEmailProps,
  ProjectRecoveryPartiallyEmailProps,
  RecordingReceivedEmailProps,
  RecoveryConfirmationEmailProps,
  RecoveryPartiallyEmailProps,
  SandboxInviteEmailProps,
  SubscriptionActiveEmailProps,
  SubscriptionExpiredEmailProps,
  SubscriptionInactiveEmailProps,
  SubscriptionPlanChangeEmailProps,
  SubscriptionReverseTrialEmailProps,
  TeammateInvitedEmailProps,
  TeammateJoinedEmailProps,
  TosViolationEmailProps,
  WelcomeEmailMemberProps,
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
} from '@workspace/email';
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
export type BillingEmailVerificationTokenPayload = z.infer<
  typeof BillingEmailVerificationTokenPayloadSchema
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
  projectTitle: string;
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
 * Email parameters extend the email props from @workspace/email and add recipient
 * This ensures single source of truth - email template parameters stay in sync
 * Additional fields may be added for logging or routing purposes
 */

/**
 * Base email parameters that all emails require
 */
export interface BaseEmailParams {
  to: string;
}

/**
 * Email parameters for batch sending
 */
export interface BatchEmailParams {
  batch: boolean;
}

/**
 * Email parameters for scheduled sending
 */
export interface ScheduledEmailParams {
  scheduledAt: string;
}

/**
 * Email parameters for reply-to address
 */
export interface ReplyToEmailParams {
  replyTo: string;
}

/**
 * Access request email parameters
 */
export type AccessRequestEmailParams = AccessRequestEmailProps & BaseEmailParams;

/**
 * Domain developer instructions email parameters
 */
export type DomainDeveloperInstructionsEmailParams = DomainDeveloperInstructionsEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams> &
  Partial<ReplyToEmailParams>;

/**
 * Email verification email parameters
 */
export type EmailVerificationEmailParams = EmailVerificationEmailProps & BaseEmailParams;

/**
 * Magic link email parameters
 */
export type MagicLinkEmailParams = MagicLinkEmailProps & BaseEmailParams;

/**
 * Subscription active email parameters
 */
export type SubscriptionActiveEmailParams = SubscriptionActiveEmailProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Billing email updated email parameters
 */
export type BillingEmailUpdatedEmailParams = BillingEmailUpdatedEmailProps & BaseEmailParams;

/**
 * Billing email verification email parameters
 */
export type BillingEmailVerificationEmailParams = BillingEmailVerificationEmailProps &
  BaseEmailParams;

/**
 * Subscription expired email parameters
 */
export type SubscriptionExpiredEmailParams = SubscriptionExpiredEmailProps & BaseEmailParams;

/**
 * Subscription inactive email parameters
 */
export type SubscriptionInactiveEmailParams = SubscriptionInactiveEmailProps & BaseEmailParams;

/**
 * Subscription plan change email parameters
 */
export type SubscriptionPlanChangeEmailParams = SubscriptionPlanChangeEmailProps & BaseEmailParams;

/**
 * Subscription reverse trial email parameters
 */
export type SubscriptionReverseTrialEmailParams = SubscriptionReverseTrialEmailProps &
  BaseEmailParams;

/**
 * Teammate invited email parameters
 */
export type TeammateInvitedEmailParams = TeammateInvitedEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams>;

/**
 * Teammate joined email parameters
 */
export type TeammateJoinedEmailParams = TeammateJoinedEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams>;

/**
 * Account deletion email parameters
 */
export type AccountDeletionEmailParams = AccountDeletionEmailProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Account deletion verification email parameters
 */
export type AccountDeletionVerificationEmailParams = AccountDeletionVerificationEmailProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Account restored email parameters
 */
export type AccountRestoredEmailParams = AccountRestoredEmailProps & BaseEmailParams;

/**
 * TOS violation email parameters
 */
export type TosViolationEmailParams = TosViolationEmailProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Pilot sandbox invite email parameters
 */
export type PilotSandboxInviteEmailParams = SandboxInviteEmailProps &
  BaseEmailParams &
  Partial<ScheduledEmailParams> &
  Partial<ReplyToEmailParams>;

/**
 * Recording received email parameters
 */
export type RecordingReceivedEmailParams = RecordingReceivedEmailProps & BaseEmailParams;

/**
 * Welcome email member parameters
 */
export type WelcomeEmailMemberParams = WelcomeEmailMemberProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Welcome email subscription parameters
 */
export type WelcomeEmailSubscriptionParams = WelcomeEmailSubscriptionProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Welcome email pilot parameters
 */
export type WelcomeEmailPilotParams = WelcomeEmailPilotProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Welcome email requester parameters
 */
export type WelcomeEmailRequesterParams = WelcomeEmailRequesterProps &
  BaseEmailParams &
  Partial<ReplyToEmailParams>;

/**
 * Workspace deletion scheduled email parameters
 */
export type WorkspaceDeletionScheduledEmailParams = DeletionScheduledEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams> &
  Partial<ScheduledEmailParams> &
  Partial<ReplyToEmailParams>;

/**
 * Workspace recovery confirmation email parameters
 */
export type WorkspaceRecoveryConfirmationEmailParams = RecoveryConfirmationEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams> &
  Partial<ScheduledEmailParams>;

/**
 * Workspace recovery partially email parameters
 */
export type WorkspaceRecoveryPartiallyEmailParams = RecoveryPartiallyEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams> &
  Partial<ScheduledEmailParams>;

/**
 * Project deletion scheduled email parameters
 */
export type ProjectDeletionScheduledEmailParams = ProjectDeletionScheduledEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams> &
  Partial<ScheduledEmailParams> &
  Partial<ReplyToEmailParams>;

/**
 * Project recovery confirmation email parameters
 */
export type ProjectRecoveryConfirmationEmailParams = ProjectRecoveryConfirmationEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams> &
  Partial<ScheduledEmailParams>;

/**
 * Project recovery partially email parameters
 */
export type ProjectRecoveryPartiallyEmailParams = ProjectRecoveryPartiallyEmailProps &
  BaseEmailParams &
  Partial<BatchEmailParams> &
  Partial<ScheduledEmailParams>;

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
