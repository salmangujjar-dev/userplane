/**
 * @workspace/email
 * Unified email package with clients and React Email templates
 * Supports localhost (file-based) and Resend
 */

// Email clients
export { LocalhostEmailClient } from './clients/localhost.client';
export { ResendEmailClient } from './clients/resend.client';
export { createEmailClient } from './factory';
export type {
  EmailClient,
  EmailClientConfig,
  EmailProvider,
  SendEmailOptions,
  SendEmailParams,
  SendEmailResponse,
} from './types';

// Email render utilities
export type {
  AccessGrantedEmailProps,
  AccessRequestedEmailProps,
  AccessRequestEmailProps,
  // Offboarding
  AccountDeletionEmailProps,
  AtRiskNotEngagedEmailProps,
  DeletionConfirmationEmailProps,
  DeletionRequestedEmailProps,
  // Workspace
  DeletionScheduledEmailProps,
  // Domain
  DomainDeveloperInstructionsEmailProps,
  DomainVerificationRequiredEmailProps,
  // Auth
  EmailVerificationEmailProps,
  HelpdeskIntegrationPromptEmailProps,
  LinksRequestedUpgradeEmailProps,
  // Usage - Links
  LinksSoftLimitEmailProps,
  MagicLinkEmailProps,
  // Project
  ProjectDeletionConfirmationEmailProps,
  ProjectDeletionRequestedEmailProps,
  ProjectDeletionScheduledEmailProps,
  ProjectRecoveryConfirmationEmailProps,
  ProjectRecoveryPartiallyEmailProps,
  ProjectRecoveryScheduledEmailProps,
  // Recording
  RecordingReceivedEmailProps,
  RecordingsHardLimitEmailProps,
  RecordingsRequestedUpgradeEmailProps,
  // Usage - Recordings
  RecordingsSoftLimitEmailProps,
  RecoveryConfirmationEmailProps,
  RecoveryPartiallyEmailProps,
  RecoveryScheduledEmailProps,
  RenderResult,
  // Activation
  RequestFirstRecordingEmailProps,
  ReverseTrialOfferEmailProps,
  SandboxExpiringEmailProps,
  // Pilot
  SandboxInviteEmailProps,
  ScreenshotsHardLimitEmailProps,
  ScreenshotsRequestedUpgradeEmailProps,
  // Usage - Screenshots
  ScreenshotsSoftLimitEmailProps,
  SeatsHardLimitEmailProps,
  SeatsRequestedUpgradeEmailProps,
  // Usage - Seats
  SeatsSoftLimitEmailProps,
  // Billing
  SubscriptionActiveEmailProps,
  SubscriptionExpiredEmailProps,
  SubscriptionInactiveEmailProps,
  SubscriptionPlanChangeEmailProps,
  SubscriptionReverseTrialEmailProps,
  // Invite
  TeammateInvitedEmailProps,
  TosViolationEmailProps,
  TrialReverseTrialOfferEmailProps,
  // Trial
  WelcomeMeetFounderEmailProps,
  WorkspaceInviteEmailProps,
} from './emails.js';
export {
  renderAccessGranted,
  renderAccessRequest,
  renderAccessRequested,
  // Offboarding
  renderAccountDeletion,
  renderAtRiskNotEngaged,
  renderDeletionConfirmation,
  renderDeletionRequested,
  // Workspace
  renderDeletionScheduled,
  // Domain
  renderDomainDeveloperInstructions,
  renderDomainVerificationRequired,
  // Auth
  renderEmailVerification,
  renderHelpdeskIntegrationPrompt,
  renderLinksRequestedUpgrade,
  // Usage - Links
  renderLinksSoftLimit,
  renderMagicLink,
  renderPilotReverseTrialOffer,
  // Project
  renderProjectDeletionConfirmation,
  renderProjectDeletionRequested,
  renderProjectDeletionScheduled,
  renderProjectRecoveryConfirmation,
  renderProjectRecoveryPartially,
  renderProjectRecoveryScheduled,
  // Recording
  renderRecordingReceived,
  renderRecordingsHardLimit,
  renderRecordingsRequestedUpgrade,
  // Usage - Recordings
  renderRecordingsSoftLimit,
  renderRecoveryConfirmation,
  renderRecoveryPartially,
  renderRecoveryScheduled,
  // Activation
  renderRequestFirstRecording,
  renderSandboxExpiring,
  // Pilot
  renderSandboxInvite,
  renderScreenshotsHardLimit,
  renderScreenshotsRequestedUpgrade,
  // Usage - Screenshots
  renderScreenshotsSoftLimit,
  renderSeatsHardLimit,
  renderSeatsRequestedUpgrade,
  // Usage - Seats
  renderSeatsSoftLimit,
  // Billing
  renderSubscriptionActive,
  renderSubscriptionExpired,
  renderSubscriptionInactive,
  renderSubscriptionPlanChange,
  renderSubscriptionReverseTrial,
  // Invite
  renderTeammateInvited,
  renderTosViolation,
  renderTrialReverseTrialOffer,
  // Trial
  renderWelcomeMeetFounder,
  renderWorkspaceInvite,
} from './emails.js';

// Email templates (direct exports for advanced usage)
export * from './emails';

// Shared components and styles
export * from './shared';
