/**
 * Type-safe idempotency key generator for email operations
 * Keys are unique identifiers to prevent duplicate email sends
 * Format: <email-type>/<unique-identifiers>
 *
 * Resend idempotency key constraints:
 * - Maximum 256 characters
 * - Keys are kept for 24 hours
 * - Must be unique per API request
 *
 * IMPORTANT: Idempotency keys should be STABLE across retries.
 * Do NOT use Date.now() directly - use unique operation identifiers instead.
 * This allows safe retries: if a network error occurs and you retry with
 * the same key, Resend returns the original response without re-sending.
 *
 * For emails with unique URLs/tokens: hash the URL (contains unique token)
 * For event-based emails: use the event identifier (recordingId, workspaceId, etc.)
 */

import { createHash } from 'crypto';

/**
 * Maximum length for idempotency keys (Resend constraint)
 */
const MAX_KEY_LENGTH = 256;

/**
 * Hash a string value using SHA-256 and return first 16 chars
 * Used for long values like URLs or multiple recipients
 */
function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

/**
 * Format recipients, hashing if the result would be too long
 * Threshold of 64 chars covers most single-email cases while keeping keys readable
 */
function formatRecipients(recipients: string | string[]): string {
  const recipientList = Array.isArray(recipients) ? recipients : [recipients];
  const joined = recipientList.join(',');

  // Hash if too long (64 chars threshold for recipient portion)
  if (joined.length > 64) {
    return hashValue(joined);
  }
  return joined;
}

/**
 * Ensure key doesn't exceed max length
 * If it does, hash the variable portion while keeping the prefix readable
 */
function ensureKeyLength(key: string): string {
  if (key.length <= MAX_KEY_LENGTH) {
    return key;
  }

  // Split by first slash to get prefix
  const firstSlash = key.indexOf('/');
  if (firstSlash === -1) {
    // No prefix, just hash the whole thing
    return hashValue(key);
  }

  const prefix = key.slice(0, firstSlash);
  const rest = key.slice(firstSlash + 1);

  // Prefix + slash + hash = prefix.length + 1 + 16
  return `${prefix}/${hashValue(rest)}`;
}

// Type definitions for each email type's key parameters
// NOTE: Use stable identifiers (URLs with tokens, event IDs) instead of timestamps

type EmailVerificationKeyParams = {
  to: string | string[];
  /** The verification URL contains a unique token - this makes the key stable for retries */
  verificationUrl: string;
};

type MagicLinkKeyParams = {
  to: string | string[];
  /** The magic link URL contains a unique token - this makes the key stable for retries */
  magicLinkUrl: string;
};

type AccessRequestKeyParams = {
  workspaceName: string;
  requesterEmail: string;
  to: string | string[];
  /** Unique request ID or timestamp bucket for the access request */
  requestId: string;
};

type BillingEmailUpdatedKeyParams = {
  to: string | string[];
  newEmail: string;
  /** Previous email for uniqueness - one notification per email change */
  previousEmail: string;
};

type BillingEmailVerificationKeyParams = {
  to: string | string[];
  /** The verification URL contains a unique token */
  verificationUrl: string;
};

type SubscriptionActiveKeyParams = {
  to: string | string[];
  planName: string;
  /** Subscription or event ID to prevent duplicate activation emails */
  subscriptionId: string;
};

type SubscriptionExpiredKeyParams = {
  to: string | string[];
  planName: string;
  /** Subscription or event ID */
  subscriptionId: string;
};

type SubscriptionInactiveKeyParams = {
  to: string | string[];
  planName: string;
  /** Subscription or event ID */
  subscriptionId: string;
};

type SubscriptionPlanChangeKeyParams = {
  to: string | string[];
  newPlan: string;
  previousPlan: string;
  /** Subscription or event ID */
  subscriptionId: string;
};

type SubscriptionReverseTrialKeyParams = {
  to: string | string[];
  /** Subscription or workspace ID */
  subscriptionId: string;
};

type DomainInstructionsKeyParams = {
  domainUrl: string;
  recipients: string[];
  /** Verification token for the domain - unique per verification attempt */
  verificationToken: string;
};

type TeammateInvitedKeyParams = {
  workspaceName: string;
  recipients: string[];
  /** Invite URL or token - unique per invitation */
  inviteUrl: string;
};

type AccountDeletionKeyParams = {
  to: string | string[];
  /** User ID - one deletion email per user */
  userId: string;
};

type AccountDeletionVerificationKeyParams = {
  to: string | string[];
  /** The deletion token from the verification URL */
  deletionToken: string;
};

type AccountRestoredKeyParams = {
  to: string | string[];
  /** User ID - one restoration email per user per restore event */
  userId: string;
};

type TosViolationKeyParams = {
  to: string | string[];
  /** User ID - one violation email per user per incident */
  userId: string;
};

type PilotSandboxInviteKeyParams = {
  to: string | string[];
  /** Sandbox URL contains unique identifier */
  sandboxUrl: string;
  scheduledAt?: string;
};

type WorkspaceInviteKeyParams = {
  to: string | string[];
  /** Invite URL contains unique identifier */
  inviteUrl: string;
  scheduledAt?: string;
};

type RecordingReceivedKeyParams = {
  to: string | string[];
  /** Recording ID - unique per recording, no timestamp needed */
  recordingId: string;
};

type WelcomeEmailMemberKeyParams = {
  to: string | string[];
  workspaceName: string;
  /** Workspace ID - one welcome email per workspace membership */
  workspaceId: string;
};

type WelcomeEmailSubscriptionKeyParams = {
  to: string | string[];
  /** Workspace ID - one welcome email per workspace creation */
  workspaceId: string;
};

type WelcomeEmailPilotKeyParams = {
  to: string | string[];
  /** Workspace ID - one welcome email per workspace creation */
  workspaceId: string;
};

type WelcomeEmailRequesterKeyParams = {
  to: string | string[];
  workspaceName: string;
  /** Workspace ID - one welcome email per approved access */
  workspaceId: string;
};

type WorkspaceDeletionScheduledKeyParams = {
  workspaceName: string;
  recipients: string[];
  /** Workspace ID - one deletion email per workspace deletion event */
  workspaceId: string;
};

type WorkspaceRecoveryConfirmationKeyParams = {
  workspaceName: string;
  recipients: string[];
  /** Workspace ID - one recovery email per workspace recovery event */
  workspaceId: string;
};

type WorkspaceRecoveryPartiallyKeyParams = {
  workspaceName: string;
  recipients: string[];
  /** Workspace ID */
  workspaceId: string;
};

type ProjectDeletionScheduledKeyParams = {
  projectName: string;
  recipients: string[];
  /** Project ID - one deletion email per project deletion event */
  projectId: string;
};

type ProjectRecoveryConfirmationKeyParams = {
  projectName: string;
  recipients: string[];
  /** Project ID */
  projectId: string;
};

type ProjectRecoveryPartiallyKeyParams = {
  projectName: string;
  recipients: string[];
  /** Project ID */
  projectId: string;
};

/**
 * Generate idempotency key for email verification
 * Uses verificationUrl hash - stable across retries of the same verification
 */
export function emailVerificationKey(params: EmailVerificationKeyParams): string {
  const recipients = formatRecipients(params.to);
  const urlHash = hashValue(params.verificationUrl);
  return ensureKeyLength(`email-verification/${recipients}/${urlHash}`);
}

/**
 * Generate idempotency key for magic link
 * Uses magicLinkUrl hash - stable across retries of the same magic link
 */
export function magicLinkKey(params: MagicLinkKeyParams): string {
  const recipients = formatRecipients(params.to);
  const urlHash = hashValue(params.magicLinkUrl);
  return ensureKeyLength(`magic-link/${recipients}/${urlHash}`);
}

/**
 * Generate idempotency key for access request
 * Uses requestId for uniqueness per access request
 */
export function accessRequestKey(params: AccessRequestKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(
    `access-request/${params.workspaceName}/${params.requesterEmail}/${recipients}/${params.requestId}`
  );
}

/**
 * Generate idempotency key for billing email updated
 * Uses both old and new email - one notification per change
 */
export function billingEmailUpdatedKey(params: BillingEmailUpdatedKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(
    `billing-email-updated/${recipients}/${params.previousEmail}/${params.newEmail}`
  );
}

/**
 * Generate idempotency key for billing email verification
 * Uses verificationUrl hash - stable across retries
 */
export function billingEmailVerificationKey(params: BillingEmailVerificationKeyParams): string {
  const recipients = formatRecipients(params.to);
  const urlHash = hashValue(params.verificationUrl);
  return ensureKeyLength(`billing-email-verification/${recipients}/${urlHash}`);
}

/**
 * Generate idempotency key for subscription active
 * Uses subscriptionId - one activation email per subscription event
 */
export function subscriptionActiveKey(params: SubscriptionActiveKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(
    `subscription-active/${recipients}/${params.planName}/${params.subscriptionId}`
  );
}

/**
 * Generate idempotency key for subscription expired
 * Uses subscriptionId - one expiry email per subscription event
 */
export function subscriptionExpiredKey(params: SubscriptionExpiredKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(
    `subscription-expired/${recipients}/${params.planName}/${params.subscriptionId}`
  );
}

/**
 * Generate idempotency key for subscription inactive
 * Uses subscriptionId - one inactive email per subscription event
 */
export function subscriptionInactiveKey(params: SubscriptionInactiveKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(
    `subscription-inactive/${recipients}/${params.planName}/${params.subscriptionId}`
  );
}

/**
 * Generate idempotency key for subscription plan change
 * Uses subscriptionId and both plans - one email per plan change
 */
export function subscriptionPlanChangeKey(params: SubscriptionPlanChangeKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(
    `subscription-plan-change/${recipients}/${params.previousPlan}/${params.newPlan}/${params.subscriptionId}`
  );
}

/**
 * Generate idempotency key for subscription reverse trial
 * Uses subscriptionId - one trial email per subscription
 */
export function subscriptionReverseTrialKey(params: SubscriptionReverseTrialKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`subscription-reverse-trial/${recipients}/${params.subscriptionId}`);
}

/**
 * Generate idempotency key for domain developer instructions
 * Uses verificationToken - stable across retries for same verification
 */
export function domainInstructionsKey(params: DomainInstructionsKeyParams): string {
  const recipients = formatRecipients(params.recipients);
  const domainHash = hashValue(params.domainUrl);
  const tokenHash = hashValue(params.verificationToken);
  return ensureKeyLength(`domain-instructions/${domainHash}/${recipients}/${tokenHash}`);
}

/**
 * Generate idempotency key for teammate invited
 * Uses inviteUrl hash - unique per invitation
 */
export function teammateInvitedKey(params: TeammateInvitedKeyParams): string {
  const recipients = formatRecipients(params.recipients);
  const inviteHash = hashValue(params.inviteUrl);
  return ensureKeyLength(`teammate-invited/${params.workspaceName}/${recipients}/${inviteHash}`);
}

/**
 * Generate idempotency key for account deletion
 * Uses userId - one deletion email per user
 */
export function accountDeletionKey(params: AccountDeletionKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`account-deletion/${recipients}/${params.userId}`);
}

/**
 * Generate idempotency key for account deletion verification
 * Uses deletionToken - stable across retries for same deletion request
 */
export function accountDeletionVerificationKey(
  params: AccountDeletionVerificationKeyParams
): string {
  const recipients = formatRecipients(params.to);
  const tokenHash = hashValue(params.deletionToken);
  return ensureKeyLength(`account-deletion-verification/${recipients}/${tokenHash}`);
}

/**
 * Generate idempotency key for account restored
 * Uses userId - one restoration email per user per restore event
 */
export function accountRestoredKey(params: AccountRestoredKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`account-restored/${recipients}/${params.userId}`);
}

/**
 * Generate idempotency key for TOS violation
 * Uses userId - one violation email per user per incident
 */
export function tosViolationKey(params: TosViolationKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`tos-violation/${recipients}/${params.userId}`);
}

/**
 * Generate idempotency key for pilot sandbox invite
 * Uses sandboxUrl hash - unique per sandbox
 */
export function pilotSandboxInviteKey(params: PilotSandboxInviteKeyParams): string {
  const recipients = formatRecipients(params.to);
  const sandboxHash = hashValue(params.sandboxUrl);
  const scheduleHash = params.scheduledAt ? `/${hashValue(params.scheduledAt)}` : '';
  return ensureKeyLength(`pilot-sandbox-invite/${recipients}/${sandboxHash}${scheduleHash}`);
}

/**
 * Generate idempotency key for workspace invite
 * Uses inviteUrl hash - unique per invite
 */
export function workspaceInviteKey(params: WorkspaceInviteKeyParams): string {
  const recipients = formatRecipients(params.to);
  const inviteHash = hashValue(params.inviteUrl);
  const scheduleHash = params.scheduledAt ? `/${hashValue(params.scheduledAt)}` : '';
  return ensureKeyLength(`workspace-invite/${recipients}/${inviteHash}${scheduleHash}`);
}

/**
 * Generate idempotency key for recording received
 * Uses recordingId only - no timestamp needed, one email per recording
 */
export function recordingReceivedKey(params: RecordingReceivedKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`recording-received/${recipients}/${params.recordingId}`);
}

/**
 * Generate idempotency key for welcome email member
 * Uses workspaceId - one welcome email per workspace membership
 */
export function welcomeEmailMemberKey(params: WelcomeEmailMemberKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`welcome-email-member/${recipients}/${params.workspaceId}`);
}

/**
 * Generate idempotency key for welcome email subscription
 * Uses workspaceId - one welcome email per workspace creation
 */
export function welcomeEmailSubscriptionKey(params: WelcomeEmailSubscriptionKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`welcome-email-subscription/${recipients}/${params.workspaceId}`);
}

/**
 * Generate idempotency key for welcome email pilot
 * Uses workspaceId - one welcome email per workspace creation
 */
export function welcomeEmailPilotKey(params: WelcomeEmailPilotKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`welcome-email-pilot/${recipients}/${params.workspaceId}`);
}

/**
 * Generate idempotency key for welcome email requester
 * Uses workspaceId - one welcome email per approved access
 */
export function welcomeEmailRequesterKey(params: WelcomeEmailRequesterKeyParams): string {
  const recipients = formatRecipients(params.to);
  return ensureKeyLength(`welcome-email-requester/${recipients}/${params.workspaceId}`);
}

/**
 * Generate idempotency key for workspace deletion scheduled
 * Uses workspaceId - one deletion email per workspace deletion event
 */
export function workspaceDeletionScheduledKey(params: WorkspaceDeletionScheduledKeyParams): string {
  const recipients = formatRecipients(params.recipients);
  return ensureKeyLength(
    `workspace-deletion-scheduled/${params.workspaceName}/${recipients}/${params.workspaceId}`
  );
}

/**
 * Generate idempotency key for workspace recovery confirmation
 * Uses workspaceId - one recovery email per workspace recovery event
 */
export function workspaceRecoveryConfirmationKey(
  params: WorkspaceRecoveryConfirmationKeyParams
): string {
  const recipients = formatRecipients(params.recipients);
  return ensureKeyLength(
    `workspace-recovery-confirmation/${params.workspaceName}/${recipients}/${params.workspaceId}`
  );
}

/**
 * Generate idempotency key for workspace recovery partially
 * Uses workspaceId
 */
export function workspaceRecoveryPartiallyKey(params: WorkspaceRecoveryPartiallyKeyParams): string {
  const recipients = formatRecipients(params.recipients);
  return ensureKeyLength(
    `workspace-recovery-partially/${params.workspaceName}/${recipients}/${params.workspaceId}`
  );
}

/**
 * Generate idempotency key for project deletion scheduled
 * Uses projectId - one deletion email per project deletion event
 */
export function projectDeletionScheduledKey(params: ProjectDeletionScheduledKeyParams): string {
  const recipients = formatRecipients(params.recipients);
  return ensureKeyLength(
    `project-deletion-scheduled/${params.projectName}/${recipients}/${params.projectId}`
  );
}

/**
 * Generate idempotency key for project recovery confirmation
 * Uses projectId
 */
export function projectRecoveryConfirmationKey(
  params: ProjectRecoveryConfirmationKeyParams
): string {
  const recipients = formatRecipients(params.recipients);
  return ensureKeyLength(
    `project-recovery-confirmation/${params.projectName}/${recipients}/${params.projectId}`
  );
}

/**
 * Generate idempotency key for project recovery partially
 * Uses projectId
 */
export function projectRecoveryPartiallyKey(params: ProjectRecoveryPartiallyKeyParams): string {
  const recipients = formatRecipients(params.recipients);
  return ensureKeyLength(
    `project-recovery-partially/${params.projectName}/${recipients}/${params.projectId}`
  );
}
