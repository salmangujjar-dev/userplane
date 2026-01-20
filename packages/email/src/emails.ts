/**
 * Typed email rendering utilities
 * Server-safe functions to render all Userplane email templates
 */

import React from 'react';

// Activation emails removed - no longer used
import type { EmailVerificationEmailProps, MagicLinkEmailProps } from './emails/auth';
// Auth emails
import { EmailVerificationEmail, MagicLinkEmail } from './emails/auth';
import type {
  BillingEmailUpdatedEmailProps,
  BillingEmailVerificationEmailProps,
  SubscriptionActiveEmailProps,
  SubscriptionExpiredEmailProps,
  SubscriptionInactiveEmailProps,
  SubscriptionPlanChangeEmailProps,
  SubscriptionReverseTrialEmailProps,
} from './emails/billing';
// Billing emails
import {
  BillingEmailUpdatedEmail,
  BillingEmailVerificationEmail,
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
import type { SandboxInviteEmailProps } from './emails/invite';
// Invite emails
import { TeammateInvitedEmail } from './emails/invite';
// Pilot emails
import { SandboxInviteEmail } from './emails/invite';
import type {
  AccountDeletionEmailProps,
  AccountDeletionVerificationEmailProps,
  AccountRestoredEmailProps,
  TosViolationEmailProps,
} from './emails/offboarding';
// Offboarding emails
import {
  AccountDeletionEmail,
  AccountDeletionVerificationEmail,
  AccountRestoredEmail,
  TosViolationEmail,
} from './emails/offboarding';
import type {
  WelcomeEmailMemberProps,
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
} from './emails/onboarding';
// Onboarding emails
import {
  WelcomeEmailMemberEmail,
  WelcomeEmailPilotEmail,
  WelcomeEmailRequesterEmail,
  WelcomeEmailSubscriptionEmail,
} from './emails/onboarding';
import type {
  ProjectDeletionScheduledEmailProps,
  ProjectRecoveryConfirmationEmailProps,
  ProjectRecoveryPartiallyEmailProps,
} from './emails/project';
// Project emails
import {
  ProjectDeletionScheduledEmail,
  ProjectRecoveryConfirmationEmail,
  ProjectRecoveryPartiallyEmail,
} from './emails/project';
import type { RecordingReceivedEmailProps } from './emails/recording';
// Recording emails
import { RecordingReceivedEmail } from './emails/recording';
import type {
  AccessRequestEmailProps,
  DeletionScheduledEmailProps,
  RecoveryConfirmationEmailProps,
  RecoveryPartiallyEmailProps,
} from './emails/workspace';
// Workspace emails
import {
  AccessRequestEmail,
  DeletionScheduledEmail,
  RecoveryConfirmationEmail,
  RecoveryPartiallyEmail,
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

// ============================================================================
// PILOT EMAILS
// ============================================================================

export async function renderSandboxInvite(props: SandboxInviteEmailProps): Promise<RenderResult> {
  const element = React.createElement(SandboxInviteEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// ONBOARDING EMAILS
// ============================================================================

export async function renderWelcomeEmailMember(
  props: WelcomeEmailMemberProps
): Promise<RenderResult> {
  const element = React.createElement(WelcomeEmailMemberEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderWelcomeEmailSubscription(
  props: WelcomeEmailSubscriptionProps
): Promise<RenderResult> {
  const element = React.createElement(WelcomeEmailSubscriptionEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderWelcomeEmailPilot(
  props: WelcomeEmailPilotProps
): Promise<RenderResult> {
  const element = React.createElement(WelcomeEmailPilotEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderWelcomeEmailRequester(
  props: WelcomeEmailRequesterProps
): Promise<RenderResult> {
  const element = React.createElement(WelcomeEmailRequesterEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

// ============================================================================
// WORKSPACE EMAILS
// ============================================================================

export async function renderAccessRequest(props: AccessRequestEmailProps): Promise<RenderResult> {
  const element = React.createElement(AccessRequestEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderDeletionScheduled(
  props: DeletionScheduledEmailProps
): Promise<RenderResult> {
  const element = React.createElement(DeletionScheduledEmail, props);
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

export async function renderBillingEmailUpdated(
  props: BillingEmailUpdatedEmailProps
): Promise<RenderResult> {
  const element = React.createElement(BillingEmailUpdatedEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderBillingEmailVerification(
  props: BillingEmailVerificationEmailProps
): Promise<RenderResult> {
  const element = React.createElement(BillingEmailVerificationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

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
// OFFBOARDING EMAILS
// ============================================================================

export async function renderAccountDeletion(
  props: AccountDeletionEmailProps
): Promise<RenderResult> {
  const element = React.createElement(AccountDeletionEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderAccountDeletionVerification(
  props: AccountDeletionVerificationEmailProps
): Promise<RenderResult> {
  const element = React.createElement(AccountDeletionVerificationEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderAccountRestored(
  props: AccountRestoredEmailProps
): Promise<RenderResult> {
  const element = React.createElement(AccountRestoredEmail, props);
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
  AccessRequestEmailProps,
  // Offboarding
  AccountDeletionEmailProps,
  AccountDeletionVerificationEmailProps,
  AccountRestoredEmailProps,
  // Billing
  BillingEmailUpdatedEmailProps,
  BillingEmailVerificationEmailProps,
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
  // Pilot
  SandboxInviteEmailProps,
  SubscriptionActiveEmailProps,
  SubscriptionExpiredEmailProps,
  SubscriptionInactiveEmailProps,
  SubscriptionPlanChangeEmailProps,
  SubscriptionReverseTrialEmailProps,
  // Invite
  TeammateInvitedEmailProps,
  TosViolationEmailProps,
  // Onboarding
  WelcomeEmailMemberProps,
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
};
