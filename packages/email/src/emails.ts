/**
 * Typed email rendering utilities
 * Server-safe functions to render all Userplane email templates
 */

import React from 'react';

// Activation emails removed - no longer used
import type { EmailVerificationEmailProps, MagicLinkEmailProps } from './emails/auth';
// Auth emails
import { EmailVerificationEmail, MagicLinkEmail } from './emails/auth';
import type { DomainDeveloperInstructionsEmailProps } from './emails/domain';
// Domain emails
import { DomainDeveloperInstructionsEmail } from './emails/domain';
import type { TeammateInvitedEmailProps, WorkspaceInviteEmailProps } from './emails/invite';
import type { SandboxInviteEmailProps } from './emails/invite';
// Invite emails
import { TeammateInvitedEmail, WorkspaceInviteEmail } from './emails/invite';
// Pilot emails (legacy)
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
  WelcomeEmailCustomSubscriptionProps,
  WelcomeEmailMemberProps,
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
} from './emails/onboarding';
// Onboarding emails
import {
  WelcomeEmailCustomSubscriptionEmail,
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
import type {
  RecordingReceivedEmailProps,
  ShareRecordingExternalEmailProps,
  ShareRecordingMemberEmailProps,
} from './emails/recording';
// Recording emails
import {
  RecordingReceivedEmail,
  ShareRecordingExternalEmail,
  ShareRecordingMemberEmail,
} from './emails/recording';
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

export async function renderWelcomeEmailCustomSubscription(
  props: WelcomeEmailCustomSubscriptionProps
): Promise<RenderResult> {
  const element = React.createElement(WelcomeEmailCustomSubscriptionEmail, props);
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
// BILLING EMAILS
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

export async function renderWorkspaceInvite(
  props: WorkspaceInviteEmailProps
): Promise<RenderResult> {
  const element = React.createElement(WorkspaceInviteEmail, props);
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

export async function renderShareRecordingMember(
  props: ShareRecordingMemberEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ShareRecordingMemberEmail, props);
  const [html, text] = await Promise.all([renderEmail(element), renderEmailText(element)]);
  return { html, text };
}

export async function renderShareRecordingExternal(
  props: ShareRecordingExternalEmailProps
): Promise<RenderResult> {
  const element = React.createElement(ShareRecordingExternalEmail, props);
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
  ShareRecordingExternalEmailProps,
  ShareRecordingMemberEmailProps,
  // Invite
  TeammateInvitedEmailProps,
  TosViolationEmailProps,
  // Onboarding
  WelcomeEmailCustomSubscriptionProps,
  WelcomeEmailMemberProps,
  WelcomeEmailPilotProps,
  WelcomeEmailRequesterProps,
  WelcomeEmailSubscriptionProps,
  WorkspaceInviteEmailProps,
};
