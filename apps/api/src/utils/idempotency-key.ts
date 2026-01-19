/**
 * Type-safe idempotency key generator for email operations
 * Keys are unique identifiers to prevent duplicate email sends
 * Format: <email-type>/<unique-identifiers>
 */

type EmailVerificationKeyParams = {
  to: string;
  timestamp: number;
};

type MagicLinkKeyParams = {
  to: string;
  timestamp: number;
};

type AccessRequestKeyParams = {
  workspaceName: string;
  requesterEmail: string;
  to: string;
};

type BillingEmailUpdatedKeyParams = {
  to: string;
  newEmail: string;
};

type BillingEmailVerificationKeyParams = {
  to: string;
  timestamp: number;
};

type SubscriptionActiveKeyParams = {
  to: string;
  planName: string;
};

type SubscriptionExpiredKeyParams = {
  to: string;
  planName: string;
};

type SubscriptionInactiveKeyParams = {
  to: string;
  planName: string;
};

type SubscriptionPlanChangeKeyParams = {
  to: string;
  newPlan: string;
};

type SubscriptionReverseTrialKeyParams = {
  to: string;
};

type DomainInstructionsKeyParams = {
  domainName: string;
  recipients: string[];
};

type TeammateInvitedKeyParams = {
  workspaceName: string;
  recipients: string[];
};

type TeammateJoinedKeyParams = {
  workspaceName: string;
  recipients: string[];
  memberEmail: string;
};

type AccountDeletionKeyParams = {
  to: string;
};

type AccountDeletionVerificationKeyParams = {
  to: string;
  timestamp: number;
};

type AccountRestoredKeyParams = {
  to: string;
};

type TosViolationKeyParams = {
  to: string;
};

type PilotSandboxInviteKeyParams = {
  to: string;
  scheduledAt?: string;
};

type RecordingReceivedKeyParams = {
  to: string;
  recordingUrl: string;
};

type WelcomeEmailMemberKeyParams = {
  to: string;
  workspaceName: string;
};

type WelcomeEmailSubscriptionKeyParams = {
  to: string;
};

type WelcomeEmailPilotKeyParams = {
  to: string;
};

type WelcomeEmailRequesterKeyParams = {
  to: string;
  workspaceName: string;
};

type WorkspaceDeletionScheduledKeyParams = {
  workspaceName: string;
  recipients: string[];
};

type WorkspaceRecoveryConfirmationKeyParams = {
  workspaceName: string;
  recipients: string[];
};

type WorkspaceRecoveryPartiallyKeyParams = {
  workspaceName: string;
  recipients: string[];
};

type ProjectDeletionScheduledKeyParams = {
  projectName: string;
  recipients: string[];
};

type ProjectRecoveryConfirmationKeyParams = {
  projectName: string;
  recipients: string[];
};

type ProjectRecoveryPartiallyKeyParams = {
  projectName: string;
  recipients: string[];
};

/**
 * Helper to join recipients array, handling both single and multiple recipients
 */
function formatRecipients(recipients: string[]): string {
  return recipients.join(',');
}

/**
 * Generate idempotency key for email verification
 */
export function emailVerificationKey(params: EmailVerificationKeyParams): string {
  return `email-verification/${params.to}/${params.timestamp}`;
}

/**
 * Generate idempotency key for magic link
 */
export function magicLinkKey(params: MagicLinkKeyParams): string {
  return `magic-link/${params.to}/${params.timestamp}`;
}

/**
 * Generate idempotency key for access request
 */
export function accessRequestKey(params: AccessRequestKeyParams): string {
  return `access-request/${params.workspaceName}/${params.requesterEmail}/${params.to}`;
}

/**
 * Generate idempotency key for billing email updated
 */
export function billingEmailUpdatedKey(params: BillingEmailUpdatedKeyParams): string {
  return `billing-email-updated/${params.to}/${params.newEmail}`;
}

/**
 * Generate idempotency key for billing email verification
 */
export function billingEmailVerificationKey(params: BillingEmailVerificationKeyParams): string {
  return `billing-email-verification/${params.to}/${params.timestamp}`;
}

/**
 * Generate idempotency key for subscription active
 */
export function subscriptionActiveKey(params: SubscriptionActiveKeyParams): string {
  return `subscription-active/${params.to}/${params.planName}`;
}

/**
 * Generate idempotency key for subscription expired
 */
export function subscriptionExpiredKey(params: SubscriptionExpiredKeyParams): string {
  return `subscription-expired/${params.to}/${params.planName}`;
}

/**
 * Generate idempotency key for subscription inactive
 */
export function subscriptionInactiveKey(params: SubscriptionInactiveKeyParams): string {
  return `subscription-inactive/${params.to}/${params.planName}`;
}

/**
 * Generate idempotency key for subscription plan change
 */
export function subscriptionPlanChangeKey(params: SubscriptionPlanChangeKeyParams): string {
  return `subscription-plan-change/${params.to}/${params.newPlan}`;
}

/**
 * Generate idempotency key for subscription reverse trial
 */
export function subscriptionReverseTrialKey(params: SubscriptionReverseTrialKeyParams): string {
  return `subscription-reverse-trial/${params.to}`;
}

/**
 * Generate idempotency key for domain developer instructions
 */
export function domainInstructionsKey(params: DomainInstructionsKeyParams): string {
  return `domain-instructions/${params.domainName}/${formatRecipients(params.recipients)}`;
}

/**
 * Generate idempotency key for teammate invited
 */
export function teammateInvitedKey(params: TeammateInvitedKeyParams): string {
  return `teammate-invited/${params.workspaceName}/${formatRecipients(params.recipients)}`;
}

/**
 * Generate idempotency key for teammate joined
 */
export function teammateJoinedKey(params: TeammateJoinedKeyParams): string {
  return `teammate-joined/${params.workspaceName}/${formatRecipients(params.recipients)}/${params.memberEmail}`;
}

/**
 * Generate idempotency key for account deletion
 */
export function accountDeletionKey(params: AccountDeletionKeyParams): string {
  return `account-deletion/${params.to}`;
}

/**
 * Generate idempotency key for account deletion verification
 */
export function accountDeletionVerificationKey(
  params: AccountDeletionVerificationKeyParams
): string {
  return `account-deletion-verification/${params.to}/${params.timestamp}`;
}

/**
 * Generate idempotency key for account restored
 */
export function accountRestoredKey(params: AccountRestoredKeyParams): string {
  return `account-restored/${params.to}`;
}

/**
 * Generate idempotency key for TOS violation
 */
export function tosViolationKey(params: TosViolationKeyParams): string {
  return `tos-violation/${params.to}`;
}

/**
 * Generate idempotency key for pilot sandbox invite
 */
export function pilotSandboxInviteKey(params: PilotSandboxInviteKeyParams): string {
  return `pilot-sandbox-invite/${params.to}${params.scheduledAt ? `/${params.scheduledAt}` : ''}`;
}

/**
 * Generate idempotency key for recording received
 */
export function recordingReceivedKey(params: RecordingReceivedKeyParams): string {
  return `recording-received/${params.to}/${params.recordingUrl}`;
}

/**
 * Generate idempotency key for welcome email member
 */
export function welcomeEmailMemberKey(params: WelcomeEmailMemberKeyParams): string {
  return `welcome-email-member/${params.to}/${params.workspaceName}`;
}

/**
 * Generate idempotency key for welcome email subscription
 */
export function welcomeEmailSubscriptionKey(params: WelcomeEmailSubscriptionKeyParams): string {
  return `welcome-email-subscription/${params.to}`;
}

/**
 * Generate idempotency key for welcome email pilot
 */
export function welcomeEmailPilotKey(params: WelcomeEmailPilotKeyParams): string {
  return `welcome-email-pilot/${params.to}`;
}

/**
 * Generate idempotency key for welcome email requester
 */
export function welcomeEmailRequesterKey(params: WelcomeEmailRequesterKeyParams): string {
  return `welcome-email-requester/${params.to}/${params.workspaceName}`;
}

/**
 * Generate idempotency key for workspace deletion scheduled
 */
export function workspaceDeletionScheduledKey(params: WorkspaceDeletionScheduledKeyParams): string {
  return `workspace-deletion-scheduled/${params.workspaceName}/${formatRecipients(params.recipients)}`;
}

/**
 * Generate idempotency key for workspace recovery confirmation
 */
export function workspaceRecoveryConfirmationKey(
  params: WorkspaceRecoveryConfirmationKeyParams
): string {
  return `workspace-recovery-confirmation/${params.workspaceName}/${formatRecipients(params.recipients)}`;
}

/**
 * Generate idempotency key for workspace recovery partially
 */
export function workspaceRecoveryPartiallyKey(params: WorkspaceRecoveryPartiallyKeyParams): string {
  return `workspace-recovery-partially/${params.workspaceName}/${formatRecipients(params.recipients)}`;
}

/**
 * Generate idempotency key for project deletion scheduled
 */
export function projectDeletionScheduledKey(params: ProjectDeletionScheduledKeyParams): string {
  return `project-deletion-scheduled/${params.projectName}/${formatRecipients(params.recipients)}`;
}

/**
 * Generate idempotency key for project recovery confirmation
 */
export function projectRecoveryConfirmationKey(
  params: ProjectRecoveryConfirmationKeyParams
): string {
  return `project-recovery-confirmation/${params.projectName}/${formatRecipients(params.recipients)}`;
}

/**
 * Generate idempotency key for project recovery partially
 */
export function projectRecoveryPartiallyKey(params: ProjectRecoveryPartiallyKeyParams): string {
  return `project-recovery-partially/${params.projectName}/${formatRecipients(params.recipients)}`;
}
