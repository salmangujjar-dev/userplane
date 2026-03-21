/**
 * Internal API types
 * Repository filters, sort options, JWT payloads, and other internal implementation details
 * These are NOT exposed via API contracts
 */

import type {
  DomainStatus,
  RetentionDays,
  WorkspaceInvitePolicy,
  WorkspaceNotificationPreferences,
  WorkspaceRole,
} from '@userplane/contract';
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
  ShareTokenPayloadSchema,
  UploadTokenPayloadSchema,
  VideoSourceSchema,
  WorkspaceCreateInviteTokenPayloadSchema,
  ZendeskOAuthSourceSchema,
} from '@userplane/contract';
import type { Link } from '@userplane/db';
import type {
  AccessRequestEmailProps,
  AccountDeletionVerificationEmailProps,
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
  ShareRecordingExternalEmailProps,
  ShareRecordingMemberEmailProps,
  TeammateInvitedEmailProps,
  WelcomeEmailCustomSubscriptionProps,
  WelcomeEmailMemberProps,
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
  WorkspaceInviteEmailProps,
} from '@userplane/email';
import type { z } from 'zod';

import type { RecordingStatusGroup } from '../schema/recording.schema';

// Re-export types from contract for convenience
export type { DomainStatus, UploadFileType, WorkspaceRole } from '@userplane/contract';

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
export type ShareTokenPayload = z.infer<typeof ShareTokenPayloadSchema>;
export type PresignedUrlInfo = z.infer<typeof PresignedUrlInfoSchema>;

/**
 * Hono environment type for Zendesk app routes
 * Ensures type-safe c.get()/c.set() in middleware and handlers
 */
export type ZendeskAppEnv = {
  Variables: {
    workspaceId: string;
    integrationId: string;
    subdomain: string;
  };
};

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
  workspaceInvitePolicy: WorkspaceInvitePolicy;
  workspaceInviteDomains: string | null;
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
  notificationDefaults?: WorkspaceNotificationPreferences;
}

/**
 * Project creation input for repository
 */
export interface CreateProjectInput {
  projectId: string;
  workspaceId: string;
  projectTitle: string;
  isDefault: boolean;
  recordingRetentionDays?: RetentionDays;
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
 * Email parameters extend the email props from @userplane/email and add recipient
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
 * Welcome email custom subscription parameters
 * Service accepts checkoutUrl directly for admin-provisioned custom plans
 */
export type WelcomeEmailCustomSubscriptionParams = Omit<
  WelcomeEmailCustomSubscriptionProps,
  'calendarUrl'
> & {
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
 * Share recording member email parameters
 * Service accepts workspaceId and recordingId and builds URL internally
 */
export type ShareRecordingMemberEmailParams = Omit<
  ShareRecordingMemberEmailProps,
  'recordingUrl'
> & {
  workspaceId: string;
  recordingId: string;
};

/**
 * Share recording external email parameters
 * Service accepts workspaceId, recordingId, and inviteUrl
 */
export type ShareRecordingExternalEmailParams = Omit<
  ShareRecordingExternalEmailProps,
  'recordingUrl'
> & {
  workspaceId: string;
  recordingId: string;
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
 * Note: workspacePlan is no longer stored on workspace - derived from subscription
 */
export interface CreateWorkspaceParams {
  workspaceId?: string;
  workspaceName: string;
  recordingSlug?: string;
  userId: string;
  userEmail: string;
}

/**
 * Source of the Intercom OAuth flow.
 * Determines callback routing and post-completion behavior.
 * - inapp: user initiated from /workspace/create (onboarding)
 * - marketplace: user came from Intercom App Store (/install/intercom)
 * - integration: user connecting Intercom to an existing workspace
 */
export type IntercomOAuthSource = 'inapp' | 'marketplace' | 'integration';

/**
 * Intercom OAuth state payload for CSRF protection
 * Signed JWT with 15 minute expiry
 * workspaceId is optional - present for workspace integration flow, absent for onboarding flow
 * source identifies the origin of the flow for callback routing
 */
export interface IntercomOAuthStatePayload {
  iss: string;
  userId: string;
  workspaceId?: string;
  source?: IntercomOAuthSource;
  timestamp: number;
  nonce: string;
  iat: number;
  exp: number;
}

/**
 * Source of the Zendesk OAuth flow.
 * Derives from the contract schema and extends with 'integration' for workspace flow.
 * - inapp: user initiated from /workspace/create (onboarding)
 * - marketplace: user came from Zendesk Marketplace (/install/zendesk)
 * - integration: user connecting Zendesk to an existing workspace
 */
export type ZendeskOAuthSource =
  | z.infer<typeof ZendeskOAuthSourceSchema>
  | 'integration'
  | 'app-oauth';

/**
 * Zendesk OAuth state payload for CSRF protection
 * Signed JWT with 15 minute expiry
 * workspaceId is optional - present for workspace integration flow, absent for onboarding flow
 * subdomain is required for token exchange with Zendesk
 * source identifies the origin of the flow for callback routing
 */
export interface ZendeskOAuthStatePayload {
  iss: string;
  userId: string;
  workspaceId?: string;
  subdomain: string;
  source?: ZendeskOAuthSource;
  /** Pending OAuth authorization ID for app-oauth flow */
  pendingId?: string;
  /** Zendesk app installation ID — used to set jwt_secret secure setting after OAuth */
  installationId?: number;
  codeVerifier: string;
  timestamp: number;
  nonce: string;
  iat: number;
  exp: number;
}
