/**
 * @workspace/email
 * Unified email package with clients and React Email templates
 * Supports localhost (file-based) and Resend
 */

// Email clients
export { createEmailClient } from './factory';
export { LocalhostEmailClient } from './clients/localhost.client';
export { ResendEmailClient } from './clients/resend.client';

export type {
  EmailClient,
  EmailProvider,
  SendEmailParams,
  SendEmailOptions,
  SendEmailResponse,
  EmailClientConfig,
} from './types';

// Email render utilities
export {
  // Auth
  renderEmailVerification,
  renderMagicLink,
  renderWorkspaceInvite,
  renderAccessRequest,
  // Pilot
  renderSandboxInvite,
  renderSandboxExpiring,
  renderPilotReverseTrialOffer,
  // Trial
  renderWelcomeMeetFounder,
  renderTrialReverseTrialOffer,
  // Activation
  renderRequestFirstRecording,
  renderDomainVerificationRequired,
  renderHelpdeskIntegrationPrompt,
  renderAtRiskNotEngaged,
  // Workspace
  renderDeletionScheduled,
  renderRecoveryScheduled,
  renderDeletionConfirmation,
  renderRecoveryConfirmation,
  renderAccessRequested,
  renderAccessGranted,
  // Invite
  renderTeammateInvited,
  // Recording
  renderRecordingReceived,
  // Domain
  renderDomainVerificationInstructions,
  // Billing
  renderSubscriptionActive,
  renderSubscriptionInactive,
  renderSubscriptionPlanChange,
  renderSubscriptionExpired,
  renderSubscriptionReverseTrial,
  // Entitlement - Seats
  renderSeatsSoftLimit,
  renderSeatsHardLimit,
  renderSeatsRequestedUpgrade,
  // Entitlement - Recordings
  renderRecordingsSoftLimit,
  renderRecordingsHardLimit,
  renderRecordingsRequestedUpgrade,
  // Entitlement - Screenshots
  renderScreenshotsSoftLimit,
  renderScreenshotsHardLimit,
  renderScreenshotsRequestedUpgrade,
  // Offboarding
  renderAccountDeletion,
  renderTosViolation,
} from './emails.js';

export type {
  RenderResult,
  // Auth
  EmailVerificationEmailProps,
  MagicLinkEmailProps,
  WorkspaceInviteEmailProps,
  AccessRequestEmailProps,
  // Pilot
  SandboxInviteEmailProps,
  SandboxExpiringEmailProps,
  ReverseTrialOfferEmailProps,
  // Trial
  WelcomeMeetFounderEmailProps,
  TrialReverseTrialOfferEmailProps,
  // Activation
  RequestFirstRecordingEmailProps,
  DomainVerificationRequiredEmailProps,
  HelpdeskIntegrationPromptEmailProps,
  AtRiskNotEngagedEmailProps,
  // Workspace
  DeletionScheduledEmailProps,
  RecoveryScheduledEmailProps,
  DeletionConfirmationEmailProps,
  RecoveryConfirmationEmailProps,
  AccessRequestedEmailProps,
  AccessGrantedEmailProps,
  // Invite
  TeammateInvitedEmailProps,
  // Recording
  RecordingReceivedEmailProps,
  // Domain
  DomainVerificationInstructionsEmailProps,
  // Billing
  SubscriptionActiveEmailProps,
  SubscriptionInactiveEmailProps,
  SubscriptionPlanChangeEmailProps,
  SubscriptionExpiredEmailProps,
  SubscriptionReverseTrialEmailProps,
  // Entitlement - Seats
  SeatsSoftLimitEmailProps,
  SeatsHardLimitEmailProps,
  SeatsRequestedUpgradeEmailProps,
  // Entitlement - Recordings
  RecordingsSoftLimitEmailProps,
  RecordingsHardLimitEmailProps,
  RecordingsRequestedUpgradeEmailProps,
  // Entitlement - Screenshots
  ScreenshotsSoftLimitEmailProps,
  ScreenshotsHardLimitEmailProps,
  ScreenshotsRequestedUpgradeEmailProps,
  // Offboarding
  AccountDeletionEmailProps,
  TosViolationEmailProps,
} from './emails.js';

// Email templates (direct exports for advanced usage)
export * from './emails';

// Shared components and styles
export * from './shared';
