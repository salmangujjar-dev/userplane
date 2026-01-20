/**
 * Type-safe idempotency key generator for email operations
 * Keys are unique identifiers to prevent duplicate email sends
 * Format: <email-type>/<unique-identifiers>
 */

type EmailVerificationKeyParams = {
  to: string | string[];
  timestamp: number;
};

type MagicLinkKeyParams = {
  to: string | string[];
  timestamp: number;
};

type AccessRequestKeyParams = {
  workspaceName: string;
  requesterEmail: string;
  to: string | string[];
};

type BillingEmailUpdatedKeyParams = {
  to: string | string[];
  newEmail: string;
};

type BillingEmailVerificationKeyParams = {
  to: string | string[];
  timestamp: number;
};

type SubscriptionActiveKeyParams = {
  to: string | string[];
  planName: string;
};

type SubscriptionExpiredKeyParams = {
  to: string | string[];
  planName: string;
};

type SubscriptionInactiveKeyParams = {
  to: string | string[];
  planName: string;
};

type SubscriptionPlanChangeKeyParams = {
  to: string | string[];
  newPlan: string;
};

type SubscriptionReverseTrialKeyParams = {
  to: string | string[];
};

type DomainInstructionsKeyParams = {
  domainUrl: string;
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
  to: string | string[];
};

type AccountDeletionVerificationKeyParams = {
  to: string | string[];
  timestamp: number;
};

type AccountRestoredKeyParams = {
  to: string | string[];
};

type TosViolationKeyParams = {
  to: string | string[];
};

type PilotSandboxInviteKeyParams = {
  to: string | string[];
  scheduledAt?: string;
};

type RecordingReceivedKeyParams = {
  to: string | string[];
  recordingUrl: string;
};

type WelcomeEmailMemberKeyParams = {
  to: string | string[];
  workspaceName: string;
};

type WelcomeEmailSubscriptionKeyParams = {
  to: string | string[];
};

type WelcomeEmailPilotKeyParams = {
  to: string | string[];
};

type WelcomeEmailRequesterKeyParams = {
  to: string | string[];
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
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `email-verification/${recipients}/${params.timestamp}`;
}

/**
 * Generate idempotency key for magic link
 */
export function magicLinkKey(params: MagicLinkKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `magic-link/${recipients}/${params.timestamp}`;
}

/**
 * Generate idempotency key for access request
 */
export function accessRequestKey(params: AccessRequestKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `access-request/${params.workspaceName}/${params.requesterEmail}/${recipients}`;
}

/**
 * Generate idempotency key for billing email updated
 */
export function billingEmailUpdatedKey(params: BillingEmailUpdatedKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `billing-email-updated/${recipients}/${params.newEmail}`;
}

/**
 * Generate idempotency key for billing email verification
 */
export function billingEmailVerificationKey(params: BillingEmailVerificationKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `billing-email-verification/${recipients}/${params.timestamp}`;
}

/**
 * Generate idempotency key for subscription active
 */
export function subscriptionActiveKey(params: SubscriptionActiveKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `subscription-active/${recipients}/${params.planName}`;
}

/**
 * Generate idempotency key for subscription expired
 */
export function subscriptionExpiredKey(params: SubscriptionExpiredKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `subscription-expired/${recipients}/${params.planName}`;
}

/**
 * Generate idempotency key for subscription inactive
 */
export function subscriptionInactiveKey(params: SubscriptionInactiveKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `subscription-inactive/${recipients}/${params.planName}`;
}

/**
 * Generate idempotency key for subscription plan change
 */
export function subscriptionPlanChangeKey(params: SubscriptionPlanChangeKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `subscription-plan-change/${recipients}/${params.newPlan}`;
}

/**
 * Generate idempotency key for subscription reverse trial
 */
export function subscriptionReverseTrialKey(params: SubscriptionReverseTrialKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `subscription-reverse-trial/${recipients}`;
}

/**
 * Generate idempotency key for domain developer instructions
 */
export function domainInstructionsKey(params: DomainInstructionsKeyParams): string {
  return `domain-instructions/${params.domainUrl}/${formatRecipients(params.recipients)}`;
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
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `account-deletion/${recipients}`;
}

/**
 * Generate idempotency key for account deletion verification
 */
export function accountDeletionVerificationKey(
  params: AccountDeletionVerificationKeyParams
): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `account-deletion-verification/${recipients}/${params.timestamp}`;
}

/**
 * Generate idempotency key for account restored
 */
export function accountRestoredKey(params: AccountRestoredKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `account-restored/${recipients}`;
}

/**
 * Generate idempotency key for TOS violation
 */
export function tosViolationKey(params: TosViolationKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `tos-violation/${recipients}`;
}

/**
 * Generate idempotency key for pilot sandbox invite
 */
export function pilotSandboxInviteKey(params: PilotSandboxInviteKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `pilot-sandbox-invite/${recipients}${params.scheduledAt ? `/${params.scheduledAt}` : ''}`;
}

/**
 * Generate idempotency key for recording received
 */
export function recordingReceivedKey(params: RecordingReceivedKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `recording-received/${recipients}/${params.recordingUrl}`;
}

/**
 * Generate idempotency key for welcome email member
 */
export function welcomeEmailMemberKey(params: WelcomeEmailMemberKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `welcome-email-member/${recipients}/${params.workspaceName}`;
}

/**
 * Generate idempotency key for welcome email subscription
 */
export function welcomeEmailSubscriptionKey(params: WelcomeEmailSubscriptionKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `welcome-email-subscription/${recipients}`;
}

/**
 * Generate idempotency key for welcome email pilot
 */
export function welcomeEmailPilotKey(params: WelcomeEmailPilotKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `welcome-email-pilot/${recipients}`;
}

/**
 * Generate idempotency key for welcome email requester
 */
export function welcomeEmailRequesterKey(params: WelcomeEmailRequesterKeyParams): string {
  const recipients = Array.isArray(params.to) ? formatRecipients(params.to) : params.to;
  return `welcome-email-requester/${recipients}/${params.workspaceName}`;
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
