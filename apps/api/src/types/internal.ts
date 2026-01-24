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
  AccountDeletionVerificationEmailProps,
  BillingEmailUpdatedEmailProps,
  BillingEmailVerificationEmailProps,
  DeletionScheduledEmailProps,
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
  WelcomeEmailMemberProps,
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
  WorkspaceInviteEmailProps,
} from '@workspace/email';
import type { z } from 'zod';

import type { RecordingStatusGroup } from '../schema/recording.schema';

// Re-export types from contract for convenience
export type { DomainStatus, UploadFileType, WorkspaceRole } from '@workspace/contract';

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
 * Note: workspacePlan is no longer stored on workspace - derived from subscription
 */
export interface CreateWorkspaceInput {
  workspaceId: string;
  workspaceName: string;
  recordingSlug: string;
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

export interface ReceipientEmailParams {
  to: string | string[];
  replyTo?: string;
}

/**
 * Email parameters for scheduled sending
 */
export interface ScheduledEmailParams {
  scheduledAt: string;
}

/**
 * Access request email parameters
 */
export type AccessRequestEmailParams = AccessRequestEmailProps;

/**
 * Domain developer instructions email parameters
 * Service accepts workspaceId, domainUrl, verificationToken, and optional userName
 * Builds verificationUrl internally
 */
export interface DomainDeveloperInstructionsEmailParams {
  domainUrl: string;
  workspaceId: string;
  verificationToken: string;
  userName?: string;
}

/**
 * Email verification email parameters
 */
export type EmailVerificationEmailParams = EmailVerificationEmailProps;

/**
 * Magic link email parameters
 */
export type MagicLinkEmailParams = MagicLinkEmailProps;

/**
 * Subscription active email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type SubscriptionActiveEmailParams = Omit<
  SubscriptionActiveEmailProps,
  'dashboardUrl' | 'billingUrl'
> & {
  workspaceId: string;
};

/**
 * Billing email updated email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type BillingEmailUpdatedEmailParams = Omit<BillingEmailUpdatedEmailProps, 'billingUrl'> & {
  workspaceId: string;
};

/**
 * Billing email verification email parameters
 */
export type BillingEmailVerificationEmailParams = BillingEmailVerificationEmailProps;

/**
 * Subscription expired email parameters
 */
export type SubscriptionExpiredEmailParams = SubscriptionExpiredEmailProps;

/**
 * Subscription inactive email parameters
 */
export type SubscriptionInactiveEmailParams = SubscriptionInactiveEmailProps;

/**
 * Subscription plan change email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type SubscriptionPlanChangeEmailParams = Omit<
  SubscriptionPlanChangeEmailProps,
  'billingUrl'
> & {
  workspaceId: string;
};

/**
 * Subscription reverse trial email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type SubscriptionReverseTrialEmailParams = Omit<
  SubscriptionReverseTrialEmailProps,
  'dashboardUrl'
> & {
  workspaceId: string;
};

/**
 * Teammate invited email parameters
 */
export type TeammateInvitedEmailParams = TeammateInvitedEmailProps;

/**
 * Account deletion verification email parameters
 * Service accepts deletionToken and builds URL internally
 */
export type AccountDeletionVerificationEmailParams = Omit<
  AccountDeletionVerificationEmailProps,
  'verificationUrl'
> & {
  deletionToken: string;
};

/**
 * Pilot sandbox invite email parameters (legacy)
 * Service builds calendar URL internally
 */
export type PilotSandboxInviteEmailParams = Omit<SandboxInviteEmailProps, 'calendarUrl'> &
  Partial<ScheduledEmailParams>;

/**
 * Workspace invite email parameters
 * Service builds calendar URL internally
 */
export type WorkspaceInviteEmailParams = Omit<WorkspaceInviteEmailProps, 'calendarUrl'> &
  Partial<ScheduledEmailParams>;

/**
 * Recording received email parameters
 * Service accepts workspaceId and recordingId and builds URL internally
 */
export type RecordingReceivedEmailParams = Omit<RecordingReceivedEmailProps, 'recordingUrl'> & {
  workspaceId: string;
  recordingId: string;
};

/**
 * Welcome email member parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type WelcomeEmailMemberParams = Omit<WelcomeEmailMemberProps, 'dashboardUrl'> & {
  workspaceId: string;
};

/**
 * Welcome email subscription parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type WelcomeEmailSubscriptionParams = Omit<WelcomeEmailSubscriptionProps, 'dashboardUrl'> & {
  workspaceId: string;
};

/**
 * Welcome email pilot parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type WelcomeEmailPilotParams = Omit<
  WelcomeEmailPilotProps,
  'dashboardUrl' | 'calendarUrl'
> & {
  workspaceId: string;
};

/**
 * Welcome email requester parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type WelcomeEmailRequesterParams = Omit<WelcomeEmailRequesterProps, 'dashboardUrl'> & {
  workspaceId: string;
};

/**
 * Workspace deletion scheduled email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type WorkspaceDeletionScheduledEmailParams = Omit<
  DeletionScheduledEmailProps,
  'cancelUrl'
> & {
  workspaceId: string;
} & Partial<ScheduledEmailParams>;

/**
 * Workspace recovery confirmation email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type WorkspaceRecoveryConfirmationEmailParams = Omit<
  RecoveryConfirmationEmailProps,
  'dashboardUrl'
> & {
  workspaceId: string;
} & Partial<ScheduledEmailParams>;

/**
 * Workspace recovery partially email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type WorkspaceRecoveryPartiallyEmailParams = Omit<
  RecoveryPartiallyEmailProps,
  'dashboardUrl'
> & {
  workspaceId: string;
} & Partial<ScheduledEmailParams>;

/**
 * Project deletion scheduled email parameters
 * Service accepts workspaceId and projectId and builds URLs internally
 */
export type ProjectDeletionScheduledEmailParams = Omit<
  ProjectDeletionScheduledEmailProps,
  'cancelUrl'
> & {
  workspaceId: string;
  projectId: string;
} & Partial<ScheduledEmailParams>;

/**
 * Project recovery confirmation email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type ProjectRecoveryConfirmationEmailParams = Omit<
  ProjectRecoveryConfirmationEmailProps,
  'dashboardUrl'
> & {
  workspaceId: string;
} & Partial<ScheduledEmailParams>;

/**
 * Project recovery partially email parameters
 * Service accepts workspaceId and builds URLs internally
 */
export type ProjectRecoveryPartiallyEmailParams = Omit<
  ProjectRecoveryPartiallyEmailProps,
  'dashboardUrl'
> & {
  workspaceId: string;
} & Partial<ScheduledEmailParams>;

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
 * Note: workspacePlan is no longer stored on workspace - derived from subscription
 */
export interface CreateWorkspaceParams {
  workspaceId?: string;
  workspaceName: string;
  recordingSlug?: string;
  userId: string;
  workspaceBillingEmail: string;
}
