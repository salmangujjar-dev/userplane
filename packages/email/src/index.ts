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
  // Workspace
  DeletionScheduledEmailProps,
  // Domain
  DomainDeveloperInstructionsEmailProps,
  DomainVerificationRequiredEmailProps,
  // Auth
  EmailVerificationEmailProps,
  HelpdeskIntegrationPromptEmailProps,
  MagicLinkEmailProps,
  // Recording
  RecordingReceivedEmailProps,
  RecordingsHardLimitEmailProps,
  RecordingsRequestedUpgradeEmailProps,
  // Entitlement - Recordings
  RecordingsSoftLimitEmailProps,
  RecoveryConfirmationEmailProps,
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
  // Entitlement - Screenshots
  ScreenshotsSoftLimitEmailProps,
  SeatsHardLimitEmailProps,
  SeatsRequestedUpgradeEmailProps,
  // Entitlement - Seats
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
  // Workspace
  renderDeletionScheduled,
  // Domain
  renderDomainDeveloperInstructions,
  renderDomainVerificationRequired,
  // Auth
  renderEmailVerification,
  renderHelpdeskIntegrationPrompt,
  renderMagicLink,
  renderPilotReverseTrialOffer,
  // Recording
  renderRecordingReceived,
  renderRecordingsHardLimit,
  renderRecordingsRequestedUpgrade,
  // Entitlement - Recordings
  renderRecordingsSoftLimit,
  renderRecoveryConfirmation,
  renderRecoveryScheduled,
  // Activation
  renderRequestFirstRecording,
  renderSandboxExpiring,
  // Pilot
  renderSandboxInvite,
  renderScreenshotsHardLimit,
  renderScreenshotsRequestedUpgrade,
  // Entitlement - Screenshots
  renderScreenshotsSoftLimit,
  renderSeatsHardLimit,
  renderSeatsRequestedUpgrade,
  // Entitlement - Seats
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
