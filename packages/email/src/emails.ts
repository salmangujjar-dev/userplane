/**
 * Typed email rendering utilities
 * Server-safe functions to render all Userplane email templates
 */

import React from 'react';

import type {
  AtRiskNotEngagedEmailProps,
  DomainVerificationRequiredEmailProps,
  HelpdeskIntegrationPromptEmailProps,
  RequestFirstRecordingEmailProps,
} from './emails/activation';
// Activation emails
import {
  AtRiskNotEngagedEmail,
  DomainVerificationRequiredEmail,
  HelpdeskIntegrationPromptEmail,
  RequestFirstRecordingEmail,
} from './emails/activation';
import type {
  AccessRequestEmailProps,
  EmailVerificationEmailProps,
  MagicLinkEmailProps,
  WorkspaceInviteEmailProps,
} from './emails/auth';
// Auth emails
import {
  AccessRequestEmail,
  EmailVerificationEmail,
  MagicLinkEmail,
  WorkspaceInviteEmail,
} from './emails/auth';
import type {
  SubscriptionActiveEmailProps,
  SubscriptionExpiredEmailProps,
  SubscriptionInactiveEmailProps,
  SubscriptionPlanChangeEmailProps,
  SubscriptionReverseTrialEmailProps,
} from './emails/billing';
// Billing emails
import {
  SubscriptionActiveEmail,
  SubscriptionExpiredEmail,
  SubscriptionInactiveEmail,
  SubscriptionPlanChangeEmail,
  SubscriptionReverseTrialEmail,
} from './emails/billing';
import type { DomainDeveloperInstructionsEmailProps } from './emails/domain';
// Domain emails
import { DomainDeveloperInstructionsEmail } from './emails/domain';
import type { TeammateInvitedEmailProps } from './emails/invite';
// Invite emails
import { TeammateInvitedEmail } from './emails/invite';
import type { AccountDeletionEmailProps, TosViolationEmailProps } from './emails/offboarding';
// Offboarding emails
import { AccountDeletionEmail, TosViolationEmail } from './emails/offboarding';
import type {
  ReverseTrialOfferEmailProps,
  SandboxExpiringEmailProps,
  SandboxInviteEmailProps,
} from './emails/pilot';
// Pilot emails
import { ReverseTrialOfferEmail, SandboxExpiringEmail, SandboxInviteEmail } from './emails/pilot';
import type {
  ProjectDeletionConfirmationEmailProps,
  ProjectDeletionRequestedEmailProps,
  ProjectDeletionScheduledEmailProps,
  ProjectRecoveryConfirmationEmailProps,
  ProjectRecoveryPartiallyEmailProps,
  ProjectRecoveryScheduledEmailProps,
} from './emails/project';
// Project emails
import {
  ProjectDeletionConfirmationEmail,
  ProjectDeletionRequestedEmail,
  ProjectDeletionScheduledEmail,
  ProjectRecoveryConfirmationEmail,
  ProjectRecoveryPartiallyEmail,
  ProjectRecoveryScheduledEmail,
} from './emails/project';
import type { RecordingReceivedEmailProps } from './emails/recording';
// Recording emails
import { RecordingReceivedEmail } from './emails/recording';
import type {
  TrialReverseTrialOfferEmailProps,
  WelcomeMeetFounderEmailProps,
} from './emails/trial';
// Trial emails
import { TrialReverseTrialOfferEmail, WelcomeMeetFounderEmail } from './emails/trial';
import type {
  LinksRequestedUpgradeEmailProps,
  LinksSoftLimitEmailProps,
  RecordingsHardLimitEmailProps,
  RecordingsRequestedUpgradeEmailProps,
  RecordingsSoftLimitEmailProps,
  ScreenshotsHardLimitEmailProps,
  ScreenshotsRequestedUpgradeEmailProps,
  ScreenshotsSoftLimitEmailProps,
  SeatsHardLimitEmailProps,
  SeatsRequestedUpgradeEmailProps,
  SeatsSoftLimitEmailProps,
} from './emails/usage';
// Usage emails
import {
  LinksRequestedUpgradeEmail,
  LinksSoftLimitEmail,
  RecordingsHardLimitEmail,
  RecordingsRequestedUpgradeEmail,
  RecordingsSoftLimitEmail,
  ScreenshotsHardLimitEmail,
  ScreenshotsRequestedUpgradeEmail,
  ScreenshotsSoftLimitEmail,
  SeatsHardLimitEmail,
  SeatsRequestedUpgradeEmail,
  SeatsSoftLimitEmail,
} from './emails/usage';
import type {
  AccessGrantedEmailProps,
  AccessRequestedEmailProps,
  DeletionConfirmationEmailProps,
  DeletionRequestedEmailProps,
  DeletionScheduledEmailProps,
  RecoveryConfirmationEmailProps,
  RecoveryPartiallyEmailProps,
  RecoveryScheduledEmailProps,
} from './emails/workspace';
// Workspace emails
import {
  AccessGrantedEmail,
  AccessRequestedEmail,
  DeletionConfirmationEmail,
  DeletionRequestedEmail,
  DeletionScheduledEmail,
  RecoveryConfirmationEmail,
  RecoveryPartiallyEmail,
  RecoveryScheduledEmail,
} from './emails/workspace';
import { renderEmail, renderEmailText } from './render';

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

export async function renderDeletionRequested(
  props: DeletionRequestedEmailProps
): Promise<RenderResult> {
  const element = React.createElement(DeletionRequestedEmail, props);
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

export async function renderRecoveryPartially(
  props: RecoveryPartiallyEmailProps
): Promise<RenderResult> {
  const element = React.createElement(RecoveryPartiallyEmail, props);
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
// PROJECT EMAILS
// ============================================================================

export async function renderProjectDeletionScheduled(
  props: ProjectDeletionScheduledEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ProjectDeletionScheduledEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderProjectDeletionRequested(
  props: ProjectDeletionRequestedEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ProjectDeletionRequestedEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderProjectRecoveryScheduled(
  props: ProjectRecoveryScheduledEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ProjectRecoveryScheduledEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderProjectDeletionConfirmation(
  props: ProjectDeletionConfirmationEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ProjectDeletionConfirmationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderProjectRecoveryConfirmation(
  props: ProjectRecoveryConfirmationEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ProjectRecoveryConfirmationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderProjectRecoveryPartially(
  props: ProjectRecoveryPartiallyEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ProjectRecoveryPartiallyEmail, props);
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
// USAGE - SEATS EMAILS
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
// USAGE - LINKS EMAILS
// ============================================================================

export async function renderLinksSoftLimit(props: LinksSoftLimitEmailProps): Promise<RenderResult> {
  const element = React.createElement(LinksSoftLimitEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderLinksRequestedUpgrade(
  props: LinksRequestedUpgradeEmailProps
): Promise<RenderResult> {
  const element = React.createElement(LinksRequestedUpgradeEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// USAGE - RECORDINGS EMAILS
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
// USAGE - SCREENSHOTS EMAILS
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
};
