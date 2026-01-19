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
 * We use Required<> to make all optional template props required for our service layer
 * Additional fields may be added for logging or routing purposes
 */

/**
 * Access request email parameters
 */
export type AccessRequestEmailParams = Required<AccessRequestEmailProps> & { to: string };

/**
 * Domain developer instructions email parameters
 */
export type DomainDeveloperInstructionsEmailParams =
  Required<DomainDeveloperInstructionsEmailProps> & {
    to: string;
  };

/**
 * Email verification email parameters
 */
export type EmailVerificationEmailParams = EmailVerificationEmailProps & { to: string };

/**
 * Magic link email parameters
 */
export type MagicLinkEmailParams = Required<MagicLinkEmailProps> & { to: string };

/**
 * Subscription active email parameters
 */
export type SubscriptionActiveEmailParams = Required<SubscriptionActiveEmailProps> & { to: string };

/**
 * Billing email updated email parameters
 */
export type BillingEmailUpdatedEmailParams = Required<BillingEmailUpdatedEmailProps> & {
  to: string;
};

/**
 * Billing email verification email parameters
 */
export type BillingEmailVerificationEmailParams = Required<BillingEmailVerificationEmailProps> & {
  to: string;
};

/**
 * Subscription expired email parameters
 */
export type SubscriptionExpiredEmailParams = Required<SubscriptionExpiredEmailProps> & {
  to: string;
};

/**
 * Subscription inactive email parameters
 */
export type SubscriptionInactiveEmailParams = Required<SubscriptionInactiveEmailProps> & {
  to: string;
};

/**
 * Subscription plan change email parameters
 */
export type SubscriptionPlanChangeEmailParams = Required<SubscriptionPlanChangeEmailProps> & {
  to: string;
};

/**
 * Subscription reverse trial email parameters
 */
export type SubscriptionReverseTrialEmailParams = Required<SubscriptionReverseTrialEmailProps> & {
  to: string;
};

/**
 * Teammate invited email parameters
 */
export type TeammateInvitedEmailParams = Required<TeammateInvitedEmailProps> & { to: string };

/**
 * Teammate joined email parameters
 */
export type TeammateJoinedEmailParams = Required<TeammateJoinedEmailProps> & { to: string };

/**
 * Account deletion email parameters
 */
export type AccountDeletionEmailParams = Required<AccountDeletionEmailProps> & { to: string };

/**
 * Account deletion verification email parameters
 */
export type AccountDeletionVerificationEmailParams =
  Required<AccountDeletionVerificationEmailProps> & { to: string };

/**
 * Account restored email parameters
 */
export type AccountRestoredEmailParams = Required<AccountRestoredEmailProps> & { to: string };

/**
 * TOS violation email parameters
 */
export type TosViolationEmailParams = TosViolationEmailProps & { to: string };

/**
 * Pilot sandbox invite email parameters
 * Includes optional scheduledAt for Resend email scheduling
 */
export type PilotSandboxInviteEmailParams = Required<SandboxInviteEmailProps> & {
  to: string;
  scheduledAt?: string;
};

/**
 * Recording received email parameters
 */
export type RecordingReceivedEmailParams = Required<RecordingReceivedEmailProps> & {
  to: string;
};

/**
 * Welcome email member parameters
 */
export type WelcomeEmailMemberParams = Required<WelcomeEmailMemberProps> & {
  to: string;
};

/**
 * Welcome email subscription parameters
 */
export type WelcomeEmailSubscriptionParams = Required<WelcomeEmailSubscriptionProps> & {
  to: string;
};

/**
 * Welcome email pilot parameters
 */
export type WelcomeEmailPilotParams = Required<WelcomeEmailPilotProps> & {
  to: string;
};

/**
 * Welcome email requester parameters
 */
export type WelcomeEmailRequesterParams = Required<WelcomeEmailRequesterProps> & {
  to: string;
};

/**
 * Workspace deletion scheduled email parameters
 */
export type WorkspaceDeletionScheduledEmailParams = Required<DeletionScheduledEmailProps> & {
  to: string;
  scheduledAt?: string;
};

/**
 * Workspace recovery confirmation email parameters
 */
export type WorkspaceRecoveryConfirmationEmailParams = Required<RecoveryConfirmationEmailProps> & {
  to: string;
  scheduledAt?: string;
};

/**
 * Workspace recovery partially email parameters
 */
export type WorkspaceRecoveryPartiallyEmailParams = Required<RecoveryPartiallyEmailProps> & {
  to: string;
  scheduledAt?: string;
};

/**
 * Project deletion scheduled email parameters
 */
export type ProjectDeletionScheduledEmailParams = Required<ProjectDeletionScheduledEmailProps> & {
  to: string;
  scheduledAt?: string;
};

/**
 * Project recovery confirmation email parameters
 */
export type ProjectRecoveryConfirmationEmailParams =
  Required<ProjectRecoveryConfirmationEmailProps> & {
    to: string;
    scheduledAt?: string;
  };

/**
 * Project recovery partially email parameters
 */
export type ProjectRecoveryPartiallyEmailParams = Required<ProjectRecoveryPartiallyEmailProps> & {
  to: string;
  scheduledAt?: string;
};

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
