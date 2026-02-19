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
  SendBatchEmailResponse,
  SendEmailOptions,
  SendEmailParams,
  SendEmailResponse,
} from './types';

// Email render utilities
export type {
  AccessRequestEmailProps,
  // Offboarding
  AccountDeletionEmailProps,
  AccountDeletionVerificationEmailProps,
  AccountRestoredEmailProps,
  // Workspace
  DeletionScheduledEmailProps,
  // Domain
  DomainDeveloperInstructionsEmailProps,
  // Auth
  EmailVerificationEmailProps,
  MagicLinkEmailProps,
  // Project
  ProjectDeletionScheduledEmailProps,
  ProjectRecoveryConfirmationEmailProps,
  ProjectRecoveryPartiallyEmailProps,
  // Recording
  RecordingReceivedEmailProps,
  RecoveryConfirmationEmailProps,
  RecoveryPartiallyEmailProps,
  RenderResult,
  // Pilot
  SandboxInviteEmailProps,
  // Invite
  TeammateInvitedEmailProps,
  TosViolationEmailProps,
  // Trial
  WelcomeEmailCustomSubscriptionProps,
  WelcomeEmailMemberProps,
  // Onboarding
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
  WorkspaceInviteEmailProps,
} from './emails.js';
export {
  renderAccessRequest,
  // Offboarding
  renderAccountDeletion,
  renderAccountDeletionVerification,
  renderAccountRestored,
  // Workspace
  renderDeletionScheduled,
  // Domain
  renderDomainDeveloperInstructions,
  // Auth
  renderEmailVerification,
  renderMagicLink,
  // Project
  renderProjectDeletionScheduled,
  renderProjectRecoveryConfirmation,
  renderProjectRecoveryPartially,
  // Recording
  renderRecordingReceived,
  renderRecoveryConfirmation,
  renderRecoveryPartially,
  // Pilot
  renderSandboxInvite,
  // Invite
  renderTeammateInvited,
  renderTosViolation,
  // Trial
  renderWelcomeEmailCustomSubscription,
  renderWelcomeEmailMember,
  // Onboarding
  renderWelcomeEmailPilot,
  renderWelcomeEmailRequester,
  renderWelcomeEmailSubscription,
  renderWorkspaceInvite,
} from './emails.js';

// Email templates (direct exports for advanced usage)
export * from './emails';

// Shared components and styles
export * from './shared';
