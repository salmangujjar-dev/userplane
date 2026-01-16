/**
 * Typed email rendering utilities
 * Server-safe functions to render all Userplane email templates
 */

import React from 'react';
import { renderEmail, renderEmailText } from './render';

// Auth emails
import {
  EmailVerificationEmail,
  MagicLinkEmail,
  WorkspaceInviteEmail,
  AccessRequestEmail,
} from './emails/auth';
import type {
  EmailVerificationEmailProps,
  MagicLinkEmailProps,
  WorkspaceInviteEmailProps,
  AccessRequestEmailProps,
} from './emails/auth';

// Pilot emails
import { SandboxInviteEmail, SandboxExpiringEmail, ReverseTrialOfferEmail } from './emails/pilot';
import type {
  SandboxInviteEmailProps,
  SandboxExpiringEmailProps,
  ReverseTrialOfferEmailProps,
} from './emails/pilot';

// Trial emails
import { WelcomeMeetFounderEmail, TrialReverseTrialOfferEmail } from './emails/trial';
import type {
  WelcomeMeetFounderEmailProps,
  TrialReverseTrialOfferEmailProps,
} from './emails/trial';

// Activation emails
import {
  RequestFirstRecordingEmail,
  DomainVerificationRequiredEmail,
  HelpdeskIntegrationPromptEmail,
  AtRiskNotEngagedEmail,
} from './emails/activation';
import type {
  RequestFirstRecordingEmailProps,
  DomainVerificationRequiredEmailProps,
  HelpdeskIntegrationPromptEmailProps,
  AtRiskNotEngagedEmailProps,
} from './emails/activation';

// Workspace emails
import {
  DeletionScheduledEmail,
  RecoveryScheduledEmail,
  DeletionConfirmationEmail,
  RecoveryConfirmationEmail,
  AccessRequestedEmail,
  AccessGrantedEmail,
} from './emails/workspace';
import type {
  DeletionScheduledEmailProps,
  RecoveryScheduledEmailProps,
  DeletionConfirmationEmailProps,
  RecoveryConfirmationEmailProps,
  AccessRequestedEmailProps,
  AccessGrantedEmailProps,
} from './emails/workspace';

// Invite emails
import { TeammateInvitedEmail } from './emails/invite';
import type { TeammateInvitedEmailProps } from './emails/invite';

// Recording emails
import { RecordingReceivedEmail } from './emails/recording';
import type { RecordingReceivedEmailProps } from './emails/recording';

// Domain emails
import { DomainDeveloperInstructionsEmail } from './emails/domain';
import type { DomainDeveloperInstructionsEmailProps } from './emails/domain';

// Billing emails
import {
  SubscriptionActiveEmail,
  SubscriptionInactiveEmail,
  SubscriptionPlanChangeEmail,
  SubscriptionExpiredEmail,
  SubscriptionReverseTrialEmail,
} from './emails/billing';
import type {
  SubscriptionActiveEmailProps,
  SubscriptionInactiveEmailProps,
  SubscriptionPlanChangeEmailProps,
  SubscriptionExpiredEmailProps,
  SubscriptionReverseTrialEmailProps,
} from './emails/billing';

// Entitlement emails
import {
  SeatsSoftLimitEmail,
  SeatsHardLimitEmail,
  SeatsRequestedUpgradeEmail,
  RecordingsSoftLimitEmail,
  RecordingsHardLimitEmail,
  RecordingsRequestedUpgradeEmail,
  ScreenshotsSoftLimitEmail,
  ScreenshotsHardLimitEmail,
  ScreenshotsRequestedUpgradeEmail,
} from './emails/entitlement';
import type {
  SeatsSoftLimitEmailProps,
  SeatsHardLimitEmailProps,
  SeatsRequestedUpgradeEmailProps,
  RecordingsSoftLimitEmailProps,
  RecordingsHardLimitEmailProps,
  RecordingsRequestedUpgradeEmailProps,
  ScreenshotsSoftLimitEmailProps,
  ScreenshotsHardLimitEmailProps,
  ScreenshotsRequestedUpgradeEmailProps,
} from './emails/entitlement';

// Offboarding emails
import { AccountDeletionEmail, TosViolationEmail } from './emails/offboarding';
import type { AccountDeletionEmailProps, TosViolationEmailProps } from './emails/offboarding';

/**
 * Render result with both HTML and plain text
 */
export interface RenderResult {
  html: string;
  text: string;
}

// ============================================================================
// AUTH EMAILS
// ============================================================================

export async function renderEmailVerification(
  props: EmailVerificationEmailProps
): Promise<RenderResult> {
  const element = React.createElement(EmailVerificationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderMagicLink(props: MagicLinkEmailProps): Promise<RenderResult> {
  const element = React.createElement(MagicLinkEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderWorkspaceInvite(
  props: WorkspaceInviteEmailProps
): Promise<RenderResult> {
  const element = React.createElement(WorkspaceInviteEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderAccessRequest(props: AccessRequestEmailProps): Promise<RenderResult> {
  const element = React.createElement(AccessRequestEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// PILOT EMAILS
// ============================================================================

export async function renderSandboxInvite(props: SandboxInviteEmailProps): Promise<RenderResult> {
  const element = React.createElement(SandboxInviteEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderSandboxExpiring(
  props: SandboxExpiringEmailProps
): Promise<RenderResult> {
  const element = React.createElement(SandboxExpiringEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderPilotReverseTrialOffer(
  props: ReverseTrialOfferEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ReverseTrialOfferEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// TRIAL EMAILS
// ============================================================================

export async function renderWelcomeMeetFounder(
  props: WelcomeMeetFounderEmailProps
): Promise<RenderResult> {
  const element = React.createElement(WelcomeMeetFounderEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderTrialReverseTrialOffer(
  props: TrialReverseTrialOfferEmailProps
): Promise<RenderResult> {
  const element = React.createElement(TrialReverseTrialOfferEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// ACTIVATION EMAILS
// ============================================================================

export async function renderRequestFirstRecording(
  props: RequestFirstRecordingEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RequestFirstRecordingEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderDomainVerificationRequired(
  props: DomainVerificationRequiredEmailProps
): Promise<RenderResult> {
  const element = React.createElement(DomainVerificationRequiredEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderHelpdeskIntegrationPrompt(
  props: HelpdeskIntegrationPromptEmailProps
): Promise<RenderResult> {
  const element = React.createElement(HelpdeskIntegrationPromptEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderAtRiskNotEngaged(
  props: AtRiskNotEngagedEmailProps
): Promise<RenderResult> {
  const element = React.createElement(AtRiskNotEngagedEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// WORKSPACE EMAILS
// ============================================================================

export async function renderDeletionScheduled(
  props: DeletionScheduledEmailProps
): Promise<RenderResult> {
  const element = React.createElement(DeletionScheduledEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderRecoveryScheduled(
  props: RecoveryScheduledEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RecoveryScheduledEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderDeletionConfirmation(
  props: DeletionConfirmationEmailProps
): Promise<RenderResult> {
  const element = React.createElement(DeletionConfirmationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderRecoveryConfirmation(
  props: RecoveryConfirmationEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RecoveryConfirmationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderAccessRequested(
  props: AccessRequestedEmailProps
): Promise<RenderResult> {
  const element = React.createElement(AccessRequestedEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderAccessGranted(props: AccessGrantedEmailProps): Promise<RenderResult> {
  const element = React.createElement(AccessGrantedEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// INVITE EMAILS
// ============================================================================

export async function renderTeammateInvited(
  props: TeammateInvitedEmailProps
): Promise<RenderResult> {
  const element = React.createElement(TeammateInvitedEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// RECORDING EMAILS
// ============================================================================

export async function renderRecordingReceived(
  props: RecordingReceivedEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RecordingReceivedEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// DOMAIN EMAILS
// ============================================================================

export async function renderDomainDeveloperInstructions(
  props: DomainDeveloperInstructionsEmailProps
): Promise<RenderResult> {
  const element = React.createElement(DomainDeveloperInstructionsEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// BILLING EMAILS
// ============================================================================

export async function renderSubscriptionActive(
  props: SubscriptionActiveEmailProps
): Promise<RenderResult> {
  const element = React.createElement(SubscriptionActiveEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderSubscriptionInactive(
  props: SubscriptionInactiveEmailProps
): Promise<RenderResult> {
  const element = React.createElement(SubscriptionInactiveEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderSubscriptionPlanChange(
  props: SubscriptionPlanChangeEmailProps
): Promise<RenderResult> {
  const element = React.createElement(SubscriptionPlanChangeEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderSubscriptionExpired(
  props: SubscriptionExpiredEmailProps
): Promise<RenderResult> {
  const element = React.createElement(SubscriptionExpiredEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderSubscriptionReverseTrial(
  props: SubscriptionReverseTrialEmailProps
): Promise<RenderResult> {
  const element = React.createElement(SubscriptionReverseTrialEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// ENTITLEMENT - SEATS EMAILS
// ============================================================================

export async function renderSeatsSoftLimit(props: SeatsSoftLimitEmailProps): Promise<RenderResult> {
  const element = React.createElement(SeatsSoftLimitEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderSeatsHardLimit(props: SeatsHardLimitEmailProps): Promise<RenderResult> {
  const element = React.createElement(SeatsHardLimitEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderSeatsRequestedUpgrade(
  props: SeatsRequestedUpgradeEmailProps
): Promise<RenderResult> {
  const element = React.createElement(SeatsRequestedUpgradeEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// ENTITLEMENT - RECORDINGS EMAILS
// ============================================================================

export async function renderRecordingsSoftLimit(
  props: RecordingsSoftLimitEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RecordingsSoftLimitEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderRecordingsHardLimit(
  props: RecordingsHardLimitEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RecordingsHardLimitEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderRecordingsRequestedUpgrade(
  props: RecordingsRequestedUpgradeEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RecordingsRequestedUpgradeEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// ENTITLEMENT - SCREENSHOTS EMAILS
// ============================================================================

export async function renderScreenshotsSoftLimit(
  props: ScreenshotsSoftLimitEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ScreenshotsSoftLimitEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderScreenshotsHardLimit(
  props: ScreenshotsHardLimitEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ScreenshotsHardLimitEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderScreenshotsRequestedUpgrade(
  props: ScreenshotsRequestedUpgradeEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ScreenshotsRequestedUpgradeEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// OFFBOARDING EMAILS
// ============================================================================

export async function renderAccountDeletion(
  props: AccountDeletionEmailProps
): Promise<RenderResult> {
  const element = React.createElement(AccountDeletionEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderTosViolation(props: TosViolationEmailProps): Promise<RenderResult> {
  const element = React.createElement(TosViolationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// RE-EXPORT TYPES
// ============================================================================

export type {
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
  DomainDeveloperInstructionsEmailProps,
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
};
