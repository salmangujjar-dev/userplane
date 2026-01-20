/**
 * EmailService - Infrastructure service for sending emails
 * Uses @workspace/email package and React Email templates
 * Emails are sent from configured inboxes with sender context in content
 */

import {
  renderAccessRequest,
  renderAccountDeletion,
  renderAccountDeletionVerification,
  renderAccountRestored,
  renderBillingEmailUpdated,
  renderBillingEmailVerification,
  renderDeletionScheduled,
  renderDomainDeveloperInstructions,
  renderEmailVerification,
  renderMagicLink,
  renderProjectDeletionScheduled,
  renderProjectRecoveryConfirmation,
  renderProjectRecoveryPartially,
  renderRecordingReceived,
  renderRecoveryConfirmation,
  renderRecoveryPartially,
  renderSandboxInvite,
  renderSubscriptionActive,
  renderSubscriptionExpired,
  renderSubscriptionInactive,
  renderSubscriptionPlanChange,
  renderSubscriptionReverseTrial,
  renderTeammateInvited,
  renderTeammateJoined,
  renderTosViolation,
  renderWelcomeEmailMember,
  renderWelcomeEmailPilot,
  renderWelcomeEmailRequester,
  renderWelcomeEmailSubscription,
} from '@workspace/email';
import { createAppLogger } from '@workspace/logger';

import { emailClient } from '@/api/clients/email';
import {
  accessRequestSubject,
  accountDeletionSubject,
  accountDeletionVerificationSubject,
  accountRestoredSubject,
  billingEmailUpdatedSubject,
  billingEmailVerificationSubject,
  domainDeveloperInstructionsSubject,
  emailVerificationSubject,
  magicLinkSubject,
  projectDeletionScheduledSubject,
  projectRecoveryConfirmationSubject,
  projectRecoveryPartiallySubject,
  recordingReceivedSubject,
  sandboxInviteSubject,
  subscriptionActiveSubject,
  subscriptionExpiredSubject,
  subscriptionInactiveSubject,
  subscriptionPlanChangeSubject,
  subscriptionReverseTrialSubject,
  teammateInvitedSubject,
  teammateJoinedSubject,
  tosViolationSubject,
  welcomeEmailMemberSubject,
  welcomeEmailPilotSubject,
  welcomeEmailRequesterSubject,
  welcomeEmailSubscriptionSubject,
  workspaceDeletionScheduledSubject,
  workspaceRecoveryConfirmationSubject,
  workspaceRecoveryPartiallySubject,
} from '@/api/subjects';
import type {
  AccessRequestEmailParams,
  AccountDeletionEmailParams,
  AccountDeletionVerificationEmailParams,
  AccountRestoredEmailParams,
  BillingEmailUpdatedEmailParams,
  BillingEmailVerificationEmailParams,
  DomainDeveloperInstructionsEmailParams,
  EmailVerificationEmailParams,
  MagicLinkEmailParams,
  PilotSandboxInviteEmailParams,
  ProjectDeletionScheduledEmailParams,
  ProjectRecoveryConfirmationEmailParams,
  ProjectRecoveryPartiallyEmailParams,
  ReceipientEmailParams,
  RecordingReceivedEmailParams,
  SubscriptionActiveEmailParams,
  SubscriptionExpiredEmailParams,
  SubscriptionInactiveEmailParams,
  SubscriptionPlanChangeEmailParams,
  SubscriptionReverseTrialEmailParams,
  TeammateInvitedEmailParams,
  TeammateJoinedEmailParams,
  TosViolationEmailParams,
  WelcomeEmailMemberParams,
  WelcomeEmailPilotParams,
  WelcomeEmailRequesterParams,
  WelcomeEmailSubscriptionParams,
  WorkspaceDeletionScheduledEmailParams,
  WorkspaceRecoveryConfirmationEmailParams,
  WorkspaceRecoveryPartiallyEmailParams,
} from '@/api/types';
import {
  authFrom,
  billingFrom,
  domainFrom,
  inviteFrom,
  notificationFrom,
} from '@/api/utils/email-from';
import { emailUrls } from '@/api/utils/email-urls';
import {
  accessRequestKey,
  accountDeletionKey,
  accountDeletionVerificationKey,
  accountRestoredKey,
  billingEmailUpdatedKey,
  billingEmailVerificationKey,
  domainInstructionsKey,
  emailVerificationKey,
  magicLinkKey,
  pilotSandboxInviteKey,
  projectDeletionScheduledKey,
  projectRecoveryConfirmationKey,
  projectRecoveryPartiallyKey,
  recordingReceivedKey,
  subscriptionActiveKey,
  subscriptionExpiredKey,
  subscriptionInactiveKey,
  subscriptionPlanChangeKey,
  subscriptionReverseTrialKey,
  teammateInvitedKey,
  teammateJoinedKey,
  tosViolationKey,
  welcomeEmailMemberKey,
  welcomeEmailPilotKey,
  welcomeEmailRequesterKey,
  welcomeEmailSubscriptionKey,
  workspaceDeletionScheduledKey,
  workspaceRecoveryConfirmationKey,
  workspaceRecoveryPartiallyKey,
} from '@/api/utils/idempotency-key';

const logger = createAppLogger('email-service');

type ErrorHandler = (error: unknown, context: { method: string; params: unknown }) => void;

export class EmailService {
  private readonly errorHandler: ErrorHandler;

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler =
      errorHandler ||
      ((error, context) => {
        console.warn('Email service error:', {
          method: context.method,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }

  /**
   * Ensures replyTo is set, defaults to support email if not provided
   */
  private ensureReplyTo(receipientParams: ReceipientEmailParams): Required<ReceipientEmailParams> {
    return {
      ...receipientParams,
      replyTo: receipientParams.replyTo || emailUrls.support.email(),
    };
  }

  /**
   * Wraps an async email operation with error handling
   * Catches errors and passes them to the configured error handler
   */
  private async executeSafely<T>(
    method: string,
    params: unknown,
    operation: () => Promise<T>
  ): Promise<void> {
    try {
      await operation();
    } catch (error) {
      this.errorHandler(error, { method, params });
    }
  }

  // ============================================================================
  // AUTH EMAILS
  // ============================================================================

  /**
   * Send email verification email
   * Sent when a user needs to verify their email address
   * Supports batch sending for multiple recipients
   * @private Use sendSafeEmailVerification instead
   */
  private async sendEmailVerification(
    receipientParams: ReceipientEmailParams,
    emailContentParams: EmailVerificationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = emailVerificationKey({
      to: receipientParams.to,
      timestamp: Date.now(),
    });

    const { html, text } = await renderEmailVerification({
      userName: emailContentParams.userName,
      verificationUrl: emailContentParams.verificationUrl,
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: receipientParams.to,
        subject: emailVerificationSubject,
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        provider: emailClient.getProvider(),
      },
      'Email verification sent'
    );
  }

  /**
   * Safe version: Send email verification email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeEmailVerification(
    receipientParams: ReceipientEmailParams,
    emailContentParams: EmailVerificationEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendEmailVerification',
      { receipientParams, emailContentParams },
      () => this.sendEmailVerification(receipientParams, emailContentParams)
    );
  }

  /**
   * Send magic link email for passwordless sign in
   * Supports batch sending for multiple recipients
   * @private Use sendSafeMagicLink instead
   */
  private async sendMagicLink(
    receipientParams: ReceipientEmailParams,
    emailContentParams: MagicLinkEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = magicLinkKey({
      to: receipientParams.to,
      timestamp: Date.now(),
    });

    const { html, text } = await renderMagicLink({
      magicLinkUrl: emailContentParams.magicLinkUrl,
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: receipientParams.to,
        subject: magicLinkSubject,
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        provider: emailClient.getProvider(),
      },
      'Magic link sent'
    );
  }

  /**
   * Safe version: Send magic link email for passwordless sign in
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeMagicLink(
    receipientParams: ReceipientEmailParams,
    emailContentParams: MagicLinkEmailParams
  ): Promise<void> {
    await this.executeSafely('sendMagicLink', { receipientParams, emailContentParams }, () =>
      this.sendMagicLink(receipientParams, emailContentParams)
    );
  }

  /**
   * Send workspace access request email to owner
   * Uses React Email template
   * Email is sent from configured invite inbox with requester details in content
   * Supports batch sending for multiple recipients
   * @private Use sendSafeAccessRequest instead
   */
  private async sendAccessRequest(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccessRequestEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = accessRequestKey({
      workspaceName: emailContentParams.workspaceName,
      requesterEmail: emailContentParams.requesterEmail,
      to: receipientParams.to,
    });

    const { html, text } = await renderAccessRequest({
      workspaceName: emailContentParams.workspaceName,
      requesterName: emailContentParams.requesterName,
      requesterEmail: emailContentParams.requesterEmail,
      reviewUrl: emailContentParams.reviewUrl,
    });

    await emailClient.send(
      {
        from: inviteFrom(emailContentParams.workspaceName),
        to: receipientParams.to,
        subject: accessRequestSubject({
          requesterName: emailContentParams.requesterName,
          workspaceName: emailContentParams.workspaceName,
        }),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspace: emailContentParams.workspaceName,
        requesterName: emailContentParams.requesterName,
        requesterEmail: emailContentParams.requesterEmail,
        provider: emailClient.getProvider(),
      },
      'Workspace access request sent'
    );
  }

  /**
   * Safe version: Send workspace access request email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccessRequest(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccessRequestEmailParams
  ): Promise<void> {
    await this.executeSafely('sendAccessRequest', { receipientParams, emailContentParams }, () =>
      this.sendAccessRequest(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // BILLING EMAILS
  // ============================================================================

  /**
   * Send billing email updated notification
   * Sent when workspace billing email address is changed
   * URLs are built internally from workspaceId
   * @private Use sendSafeBillingEmailUpdated instead
   */
  private async sendBillingEmailUpdated(
    receipientParams: ReceipientEmailParams,
    emailContentParams: BillingEmailUpdatedEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = billingEmailUpdatedKey({
      to: receipientParams.to,
      newEmail: emailContentParams.newEmail,
    });

    const billingUrl = emailUrls.settings.billing(emailContentParams.workspaceId);

    const { html, text } = await renderBillingEmailUpdated({
      previousEmail: emailContentParams.previousEmail,
      newEmail: emailContentParams.newEmail,
      billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: receipientParams.to,
        subject: billingEmailUpdatedSubject,
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        previousEmail: emailContentParams.previousEmail,
        newEmail: emailContentParams.newEmail,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Billing email updated notification sent'
    );
  }

  /**
   * Safe version: Send billing email updated notification
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeBillingEmailUpdated(
    receipientParams: ReceipientEmailParams,
    emailContentParams: BillingEmailUpdatedEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendBillingEmailUpdated',
      { receipientParams, emailContentParams },
      () => this.sendBillingEmailUpdated(receipientParams, emailContentParams)
    );
  }

  /**
   * Send billing email verification request
   * Sent when workspace billing email change is requested
   * @private Use sendSafeBillingEmailVerification instead
   */
  private async sendBillingEmailVerification(
    receipientParams: ReceipientEmailParams,
    emailContentParams: BillingEmailVerificationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = billingEmailVerificationKey({
      to: receipientParams.to,
      timestamp: Date.now(),
    });

    const { html, text } = await renderBillingEmailVerification({
      workspaceName: emailContentParams.workspaceName,
      verificationUrl: emailContentParams.verificationUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: receipientParams.to,
        subject: billingEmailVerificationSubject,
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceName: emailContentParams.workspaceName,
        provider: emailClient.getProvider(),
      },
      'Billing email verification sent'
    );
  }

  /**
   * Safe version: Send billing email verification request
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeBillingEmailVerification(
    receipientParams: ReceipientEmailParams,
    emailContentParams: BillingEmailVerificationEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendBillingEmailVerification',
      { receipientParams, emailContentParams },
      () => this.sendBillingEmailVerification(receipientParams, emailContentParams)
    );
  }

  /**
   * Send subscription active email
   * URLs are built internally from workspaceId
   * @private Use sendSafeSubscriptionActive instead
   */
  private async sendSubscriptionActive(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionActiveEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = subscriptionActiveKey({
      to: receipientParams.to,
      planName: emailContentParams.planName,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);
    const billingUrl = emailUrls.settings.billing(emailContentParams.workspaceId);

    const { html, text } = await renderSubscriptionActive({
      planName: emailContentParams.planName,
      dashboardUrl,
      billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: receipientParams.to,
        subject: subscriptionActiveSubject(emailContentParams.planName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        planName: emailContentParams.planName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Subscription active email sent'
    );
  }

  /**
   * Safe version: Send subscription active email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionActive(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionActiveEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendSubscriptionActive',
      { receipientParams, emailContentParams },
      () => this.sendSubscriptionActive(receipientParams, emailContentParams)
    );
  }

  /**
   * Send subscription expired email
   * @private Use sendSafeSubscriptionExpired instead
   */
  private async sendSubscriptionExpired(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionExpiredEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = subscriptionExpiredKey({
      to: receipientParams.to,
      planName: emailContentParams.planName,
    });

    const { html, text } = await renderSubscriptionExpired({
      planName: emailContentParams.planName,
      renewUrl: emailContentParams.renewUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: receipientParams.to,
        subject: subscriptionExpiredSubject(emailContentParams.planName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        planName: emailContentParams.planName,
        provider: emailClient.getProvider(),
      },
      'Subscription expired email sent'
    );
  }

  /**
   * Safe version: Send subscription expired email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionExpired(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionExpiredEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendSubscriptionExpired',
      { receipientParams, emailContentParams },
      () => this.sendSubscriptionExpired(receipientParams, emailContentParams)
    );
  }

  /**
   * Send subscription inactive email
   * @private Use sendSafeSubscriptionInactive instead
   */
  private async sendSubscriptionInactive(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionInactiveEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = subscriptionInactiveKey({
      to: receipientParams.to,
      planName: emailContentParams.planName,
    });

    const { html, text } = await renderSubscriptionInactive({
      planName: emailContentParams.planName,
      reactivateUrl: emailContentParams.reactivateUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: receipientParams.to,
        subject: subscriptionInactiveSubject(emailContentParams.planName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        planName: emailContentParams.planName,
        provider: emailClient.getProvider(),
      },
      'Subscription inactive email sent'
    );
  }

  /**
   * Safe version: Send subscription inactive email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionInactive(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionInactiveEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendSubscriptionInactive',
      { receipientParams, emailContentParams },
      () => this.sendSubscriptionInactive(receipientParams, emailContentParams)
    );
  }

  /**
   * Send subscription plan change email
   * URLs are built internally from workspaceId
   * @private Use sendSafeSubscriptionPlanChange instead
   */
  private async sendSubscriptionPlanChange(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionPlanChangeEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = subscriptionPlanChangeKey({
      to: receipientParams.to,
      newPlan: emailContentParams.newPlan,
    });

    const billingUrl = emailUrls.settings.billing(emailContentParams.workspaceId);

    const { html, text } = await renderSubscriptionPlanChange({
      previousPlan: emailContentParams.previousPlan,
      newPlan: emailContentParams.newPlan,
      effectiveDate: emailContentParams.effectiveDate,
      billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: receipientParams.to,
        subject: subscriptionPlanChangeSubject(emailContentParams.newPlan),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        previousPlan: emailContentParams.previousPlan,
        newPlan: emailContentParams.newPlan,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Subscription plan change email sent'
    );
  }

  /**
   * Safe version: Send subscription plan change email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionPlanChange(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionPlanChangeEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendSubscriptionPlanChange',
      { receipientParams, emailContentParams },
      () => this.sendSubscriptionPlanChange(receipientParams, emailContentParams)
    );
  }

  /**
   * Send subscription reverse trial email
   * URLs are built internally from workspaceId
   * @private Use sendSafeSubscriptionReverseTrial instead
   */
  private async sendSubscriptionReverseTrial(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionReverseTrialEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = subscriptionReverseTrialKey({
      to: receipientParams.to,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderSubscriptionReverseTrial({
      planName: emailContentParams.planName,
      trialDays: emailContentParams.trialDays,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: receipientParams.to,
        subject: subscriptionReverseTrialSubject(emailContentParams.planName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        planName: emailContentParams.planName,
        trialDays: emailContentParams.trialDays,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Subscription reverse trial email sent'
    );
  }

  /**
   * Safe version: Send subscription reverse trial email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionReverseTrial(
    receipientParams: ReceipientEmailParams,
    emailContentParams: SubscriptionReverseTrialEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendSubscriptionReverseTrial',
      { receipientParams, emailContentParams },
      () => this.sendSubscriptionReverseTrial(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // DOMAIN EMAILS
  // ============================================================================

  /**
   * Send domain developer instructions email
   * Uses React Email template and idempotency key to prevent duplicate sends
   * Email is sent from configured invite inbox
   * URLs are built internally from workspaceId, domainUrl, and verificationToken
   * @private Use sendSafeDomainDeveloperInstructions instead
   */
  private async sendDomainDeveloperInstructions(
    receipientParams: ReceipientEmailParams,
    emailContentParams: DomainDeveloperInstructionsEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = domainInstructionsKey({
      domainUrl: emailContentParams.domainUrl,
      recipients,
    });

    const verificationUrl = emailUrls.verification.developer(
      emailContentParams.workspaceId,
      emailContentParams.domainUrl,
      emailContentParams.verificationToken
    );

    const { html, text } = await renderDomainDeveloperInstructions({
      domainUrl: emailContentParams.domainUrl,
      verificationUrl,
      userName: emailContentParams.userName,
    });

    await emailClient.send(
      {
        from: domainFrom(),
        to: finalParams.to,
        subject: domainDeveloperInstructionsSubject(),
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        domainUrl: emailContentParams.domainUrl,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Domain developer instructions sent'
    );
  }

  /**
   * Safe version: Send domain developer instructions email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeDomainDeveloperInstructions(
    receipientParams: ReceipientEmailParams,
    emailContentParams: DomainDeveloperInstructionsEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendDomainDeveloperInstructions',
      { receipientParams, emailContentParams },
      () => this.sendDomainDeveloperInstructions(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // INVITE EMAILS
  // ============================================================================

  /**
   * Send teammate invited email
   * @private Use sendSafeTeammateInvited instead
   */
  private async sendTeammateInvited(
    receipientParams: ReceipientEmailParams,
    emailContentParams: TeammateInvitedEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = teammateInvitedKey({
      workspaceName: emailContentParams.workspaceName,
      recipients,
    });

    const { html, text } = await renderTeammateInvited({
      inviterName: emailContentParams.inviterName,
      inviterEmail: emailContentParams.inviterEmail,
      workspaceName: emailContentParams.workspaceName,
      inviteUrl: emailContentParams.inviteUrl,
    });

    await emailClient.send(
      {
        from: inviteFrom(emailContentParams.workspaceName),
        to: receipientParams.to,
        subject: teammateInvitedSubject({
          inviterName: emailContentParams.inviterName,
          inviterEmail: emailContentParams.inviterEmail,
          workspaceName: emailContentParams.workspaceName,
        }),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceName: emailContentParams.workspaceName,
        inviterName: emailContentParams.inviterName,
        provider: emailClient.getProvider(),
      },
      'Teammate invited email sent'
    );
  }

  /**
   * Safe version: Send teammate invited email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeTeammateInvited(
    receipientParams: ReceipientEmailParams,
    emailContentParams: TeammateInvitedEmailParams
  ): Promise<void> {
    await this.executeSafely('sendTeammateInvited', { receipientParams, emailContentParams }, () =>
      this.sendTeammateInvited(receipientParams, emailContentParams)
    );
  }

  /**
   * Send teammate joined email
   * Sent to workspace owners when someone joins
   * URLs are built internally from workspaceId
   * @private Use sendSafeTeammateJoined instead
   */
  private async sendTeammateJoined(
    receipientParams: ReceipientEmailParams,
    emailContentParams: TeammateJoinedEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = teammateJoinedKey({
      workspaceName: emailContentParams.workspaceName,
      recipients,
      memberEmail: emailContentParams.memberEmail,
    });

    const workspaceUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderTeammateJoined({
      memberName: emailContentParams.memberName,
      memberEmail: emailContentParams.memberEmail,
      workspaceName: emailContentParams.workspaceName,
      workspaceUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: teammateJoinedSubject({
          memberName: emailContentParams.memberName,
          memberEmail: emailContentParams.memberEmail,
          workspaceName: emailContentParams.workspaceName,
        }),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceName: emailContentParams.workspaceName,
        memberName: emailContentParams.memberName,
        memberEmail: emailContentParams.memberEmail,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Teammate joined email sent'
    );
  }

  /**
   * Safe version: Send teammate joined email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeTeammateJoined(
    receipientParams: ReceipientEmailParams,
    emailContentParams: TeammateJoinedEmailParams
  ): Promise<void> {
    await this.executeSafely('sendTeammateJoined', { receipientParams, emailContentParams }, () =>
      this.sendTeammateJoined(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // OFFBOARDING EMAILS
  // ============================================================================

  /**
   * Send account deletion email
   * URLs are built internally from static sources
   * @private Use sendSafeAccountDeletion instead
   */
  private async sendAccountDeletion(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccountDeletionEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = accountDeletionKey({
      to: receipientParams.to,
    });

    const feedbackUrl = emailUrls.account.feedback();

    const { html, text } = await renderAccountDeletion({
      userName: emailContentParams.userName,
      feedbackUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: accountDeletionSubject,
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        provider: emailClient.getProvider(),
      },
      'Account deletion email sent'
    );
  }

  /**
   * Safe version: Send account deletion email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccountDeletion(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccountDeletionEmailParams
  ): Promise<void> {
    await this.executeSafely('sendAccountDeletion', { receipientParams, emailContentParams }, () =>
      this.sendAccountDeletion(receipientParams, emailContentParams)
    );
  }

  /**
   * Send account deletion verification email
   * Sent when a user requests to delete their account
   * URLs are built internally from deletionToken
   * @private Use sendSafeAccountDeletionVerification instead
   */
  private async sendAccountDeletionVerification(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccountDeletionVerificationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = accountDeletionVerificationKey({
      to: receipientParams.to,
      timestamp: Date.now(),
    });

    const verificationUrl = emailUrls.account.deleteConfirmation(emailContentParams.deletionToken);

    const { html, text } = await renderAccountDeletionVerification({
      userName: emailContentParams.userName,
      verificationUrl,
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: finalParams.to,
        subject: accountDeletionVerificationSubject,
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        provider: emailClient.getProvider(),
      },
      'Account deletion verification email sent'
    );
  }

  /**
   * Safe version: Send account deletion verification email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccountDeletionVerification(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccountDeletionVerificationEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendAccountDeletionVerification',
      { receipientParams, emailContentParams },
      () => this.sendAccountDeletionVerification(receipientParams, emailContentParams)
    );
  }

  /**
   * Send account restored email
   * URLs are built internally from static sources
   * @private Use sendSafeAccountRestored instead
   */
  private async sendAccountRestored(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccountRestoredEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = accountRestoredKey({
      to: receipientParams.to,
    });

    const loginUrl = emailUrls.external.login();

    const { html, text } = await renderAccountRestored({
      userName: emailContentParams.userName,
      loginUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: accountRestoredSubject,
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        provider: emailClient.getProvider(),
      },
      'Account restored email sent'
    );
  }

  /**
   * Safe version: Send account restored email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccountRestored(
    receipientParams: ReceipientEmailParams,
    emailContentParams: AccountRestoredEmailParams
  ): Promise<void> {
    await this.executeSafely('sendAccountRestored', { receipientParams, emailContentParams }, () =>
      this.sendAccountRestored(receipientParams, emailContentParams)
    );
  }

  /**
   * Send TOS violation email
   * URLs are built internally from static sources
   * @private Use sendSafeTosViolation instead
   */
  private async sendTosViolation(
    receipientParams: ReceipientEmailParams,
    emailContentParams: TosViolationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = tosViolationKey({
      to: receipientParams.to,
    });

    const appealUrl = emailUrls.external.appeal();
    const tosUrl = emailUrls.external.terms();

    const { html, text } = await renderTosViolation({
      userName: emailContentParams.userName,
      appealUrl,
      tosUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: tosViolationSubject,
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        provider: emailClient.getProvider(),
      },
      'TOS violation email sent'
    );
  }

  /**
   * Safe version: Send TOS violation email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeTosViolation(
    receipientParams: ReceipientEmailParams,
    emailContentParams: TosViolationEmailParams
  ): Promise<void> {
    await this.executeSafely('sendTosViolation', { receipientParams, emailContentParams }, () =>
      this.sendTosViolation(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // PILOT EMAILS
  // ============================================================================

  /**
   * Send pilot sandbox invite email
   * Supports optional scheduling via scheduledAt field in params
   * @private Use sendSafePilotSandboxInvite instead
   */
  private async sendPilotSandboxInvite(
    receipientParams: ReceipientEmailParams,
    emailContentParams: PilotSandboxInviteEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = pilotSandboxInviteKey({
      to: receipientParams.to,
      scheduledAt: emailContentParams.scheduledAt,
    });

    const { html, text } = await renderSandboxInvite({
      sandboxUrl: emailContentParams.sandboxUrl,
      expiresInDays: emailContentParams.expiresInDays,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: sandboxInviteSubject,
        html,
        text,
        batch: useBatch,
        ...(receipientParams.replyTo && { replyTo: receipientParams.replyTo }),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        expiresInDays: emailContentParams.expiresInDays,
        scheduled: !!emailContentParams.scheduledAt,
        scheduledAt: emailContentParams.scheduledAt,
        provider: emailClient.getProvider(),
      },
      emailContentParams.scheduledAt
        ? 'Pilot sandbox invite email scheduled'
        : 'Pilot sandbox invite email sent'
    );
  }

  /**
   * Safe version: Send pilot sandbox invite email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafePilotSandboxInvite(
    receipientParams: ReceipientEmailParams,
    emailContentParams: PilotSandboxInviteEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendPilotSandboxInvite',
      { receipientParams, emailContentParams },
      () => this.sendPilotSandboxInvite(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // RECORDING EMAILS
  // ============================================================================

  /**
   * Send recording received email
   * URLs are built internally from workspaceId and recordingId
   * @private Use sendSafeRecordingReceived instead
   */
  private async sendRecordingReceived(
    receipientParams: ReceipientEmailParams,
    emailContentParams: RecordingReceivedEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const recordingUrl = emailUrls.recording.view(
      emailContentParams.workspaceId,
      emailContentParams.recordingId
    );

    const idempotencyKey = recordingReceivedKey({
      to: receipientParams.to,
      recordingUrl,
    });

    const { html, text } = await renderRecordingReceived({
      recordingUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: recordingReceivedSubject,
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceId: emailContentParams.workspaceId,
        recordingId: emailContentParams.recordingId,
        provider: emailClient.getProvider(),
      },
      'Recording received email sent'
    );
  }

  /**
   * Safe version: Send recording received email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeRecordingReceived(
    receipientParams: ReceipientEmailParams,
    emailContentParams: RecordingReceivedEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendRecordingReceived',
      { receipientParams, emailContentParams },
      () => this.sendRecordingReceived(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // ONBOARDING EMAILS
  // ============================================================================

  /**
   * Send welcome email for members joining a workspace
   * Sent to users when they join a workspace as a member
   * URLs are built internally from workspaceId
   * @private Use sendSafeWelcomeEmailMember instead
   */
  private async sendWelcomeEmailMember(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailMemberParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = welcomeEmailMemberKey({
      to: receipientParams.to,
      workspaceName: emailContentParams.workspaceName,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderWelcomeEmailMember({
      userName: emailContentParams.userName,
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: welcomeEmailMemberSubject,
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        workspaceName: emailContentParams.workspaceName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Welcome email member sent'
    );
  }

  /**
   * Safe version: Send welcome email for members
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailMember(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailMemberParams
  ): Promise<void> {
    await this.executeSafely(
      'sendWelcomeEmailMember',
      { receipientParams, emailContentParams },
      () => this.sendWelcomeEmailMember(receipientParams, emailContentParams)
    );
  }

  /**
   * Send welcome email for subscription users
   * Sent to users who create a workspace without an invite token (organic signup)
   * URLs are built internally from workspaceId
   * @private Use sendSafeWelcomeEmailSubscription instead
   */
  private async sendWelcomeEmailSubscription(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailSubscriptionParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = welcomeEmailSubscriptionKey({
      to: receipientParams.to,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderWelcomeEmailSubscription({
      userName: emailContentParams.userName,
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: welcomeEmailSubscriptionSubject,
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        workspaceName: emailContentParams.workspaceName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Welcome email subscription sent'
    );
  }

  /**
   * Safe version: Send welcome email for subscription users
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailSubscription(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailSubscriptionParams
  ): Promise<void> {
    await this.executeSafely(
      'sendWelcomeEmailSubscription',
      { receipientParams, emailContentParams },
      () => this.sendWelcomeEmailSubscription(receipientParams, emailContentParams)
    );
  }

  /**
   * Send welcome email for pilot users
   * Sent to users who create a workspace with an invite token (invited/pilot users)
   * URLs are built internally from workspaceId and support config
   * @private Use sendSafeWelcomeEmailPilot instead
   */
  private async sendWelcomeEmailPilot(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailPilotParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = welcomeEmailPilotKey({
      to: receipientParams.to,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);
    const calendarUrl = emailUrls.support.calendar();

    const { html, text } = await renderWelcomeEmailPilot({
      userName: emailContentParams.userName,
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
      calendarUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: welcomeEmailPilotSubject,
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        workspaceName: emailContentParams.workspaceName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Welcome email pilot sent'
    );
  }

  /**
   * Safe version: Send welcome email for pilot users
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailPilot(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailPilotParams
  ): Promise<void> {
    await this.executeSafely(
      'sendWelcomeEmailPilot',
      { receipientParams, emailContentParams },
      () => this.sendWelcomeEmailPilot(receipientParams, emailContentParams)
    );
  }

  /**
   * Send welcome email for requesters whose access was approved
   * Sent to users when their access request is approved
   * URLs are built internally from workspaceId
   * @private Use sendSafeWelcomeEmailRequester instead
   */
  private async sendWelcomeEmailRequester(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailRequesterParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = welcomeEmailRequesterKey({
      to: receipientParams.to,
      workspaceName: emailContentParams.workspaceName,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderWelcomeEmailRequester({
      userName: emailContentParams.userName,
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: welcomeEmailRequesterSubject,
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        userName: emailContentParams.userName,
        workspaceName: emailContentParams.workspaceName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Welcome email requester sent'
    );
  }

  /**
   * Safe version: Send welcome email for requesters
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailRequester(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WelcomeEmailRequesterParams
  ): Promise<void> {
    await this.executeSafely(
      'sendWelcomeEmailRequester',
      { receipientParams, emailContentParams },
      () => this.sendWelcomeEmailRequester(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // WORKSPACE EMAILS
  // ============================================================================

  /**
   * Send workspace deletion scheduled email
   * URLs are built internally from workspaceId
   * @private Use sendSafeWorkspaceDeletionScheduled instead
   */
  private async sendWorkspaceDeletionScheduled(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceDeletionScheduledEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = workspaceDeletionScheduledKey({
      workspaceName: emailContentParams.workspaceName,
      recipients,
    });

    const cancelUrl = emailUrls.workspace.restore(emailContentParams.workspaceId);

    const { html, text } = await renderDeletionScheduled({
      workspaceName: emailContentParams.workspaceName,
      deletionDate: emailContentParams.deletionDate,
      cancelUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: workspaceDeletionScheduledSubject({
          workspaceName: emailContentParams.workspaceName,
          deletionDate: emailContentParams.deletionDate,
        }),
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceName: emailContentParams.workspaceName,
        workspaceId: emailContentParams.workspaceId,
        deletionDate: emailContentParams.deletionDate,
        provider: emailClient.getProvider(),
      },
      'Workspace deletion scheduled email sent'
    );
  }

  /**
   * Safe version: Send workspace deletion scheduled email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWorkspaceDeletionScheduled(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceDeletionScheduledEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendWorkspaceDeletionScheduled',
      { receipientParams, emailContentParams },
      () => this.sendWorkspaceDeletionScheduled(receipientParams, emailContentParams)
    );
  }

  /**
   * Send workspace recovery confirmation email
   * URLs are built internally from workspaceId
   * @private Use sendSafeWorkspaceRecoveryConfirmation instead
   */
  private async sendWorkspaceRecoveryConfirmation(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceRecoveryConfirmationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = workspaceRecoveryConfirmationKey({
      workspaceName: emailContentParams.workspaceName,
      recipients,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderRecoveryConfirmation({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: workspaceRecoveryConfirmationSubject(emailContentParams.workspaceName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceName: emailContentParams.workspaceName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Workspace recovery confirmation email sent'
    );
  }

  /**
   * Safe version: Send workspace recovery confirmation email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWorkspaceRecoveryConfirmation(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceRecoveryConfirmationEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendWorkspaceRecoveryConfirmation',
      { receipientParams, emailContentParams },
      () => this.sendWorkspaceRecoveryConfirmation(receipientParams, emailContentParams)
    );
  }

  /**
   * Send workspace recovery partially email
   * URLs are built internally from workspaceId
   * @private Use sendSafeWorkspaceRecoveryPartially instead
   */
  private async sendWorkspaceRecoveryPartially(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceRecoveryPartiallyEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = workspaceRecoveryPartiallyKey({
      workspaceName: emailContentParams.workspaceName,
      recipients,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderRecoveryPartially({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: workspaceRecoveryPartiallySubject(emailContentParams.workspaceName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceName: emailContentParams.workspaceName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Workspace recovery partially email sent'
    );
  }

  /**
   * Safe version: Send workspace recovery partially email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWorkspaceRecoveryPartially(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceRecoveryPartiallyEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendWorkspaceRecoveryPartially',
      { receipientParams, emailContentParams },
      () => this.sendWorkspaceRecoveryPartially(receipientParams, emailContentParams)
    );
  }

  // ============================================================================
  // PROJECT EMAILS
  // ============================================================================

  /**
   * Send project deletion scheduled email
   * URLs are built internally from workspaceId and projectId
   * @private Use sendSafeProjectDeletionScheduled instead
   */
  private async sendProjectDeletionScheduled(
    receipientParams: ReceipientEmailParams,
    emailContentParams: ProjectDeletionScheduledEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    const idempotencyKey = projectDeletionScheduledKey({
      projectName: emailContentParams.projectName,
      recipients,
    });

    const cancelUrl = emailUrls.project.restore(
      emailContentParams.workspaceId,
      emailContentParams.projectId
    );

    const { html, text } = await renderProjectDeletionScheduled({
      projectName: emailContentParams.projectName,
      deletionDate: emailContentParams.deletionDate,
      cancelUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: finalParams.to,
        subject: projectDeletionScheduledSubject({
          projectName: emailContentParams.projectName,
          deletionDate: emailContentParams.deletionDate,
        }),
        html,
        text,
        batch: useBatch,
        replyTo: finalParams.replyTo,
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        projectName: emailContentParams.projectName,
        workspaceId: emailContentParams.workspaceId,
        projectId: emailContentParams.projectId,
        deletionDate: emailContentParams.deletionDate,
        provider: emailClient.getProvider(),
      },
      'Project deletion scheduled email sent'
    );
  }

  /**
   * Safe version: Send project deletion scheduled email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeProjectDeletionScheduled(
    receipientParams: ReceipientEmailParams,
    emailContentParams: ProjectDeletionScheduledEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendProjectDeletionScheduled',
      { receipientParams, emailContentParams },
      () => this.sendProjectDeletionScheduled(receipientParams, emailContentParams)
    );
  }

  /**
   * Send project recovery confirmation email
   * URLs are built internally from workspaceId
   * @private Use sendSafeProjectRecoveryConfirmation instead
   */
  private async sendProjectRecoveryConfirmation(
    receipientParams: ReceipientEmailParams,
    emailContentParams: ProjectRecoveryConfirmationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = projectRecoveryConfirmationKey({
      projectName: emailContentParams.projectName,
      recipients,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderProjectRecoveryConfirmation({
      projectName: emailContentParams.projectName,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: projectRecoveryConfirmationSubject(emailContentParams.projectName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        projectName: emailContentParams.projectName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Project recovery confirmation email sent'
    );
  }

  /**
   * Safe version: Send project recovery confirmation email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeProjectRecoveryConfirmation(
    receipientParams: ReceipientEmailParams,
    emailContentParams: ProjectRecoveryConfirmationEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendProjectRecoveryConfirmation',
      { receipientParams, emailContentParams },
      () => this.sendProjectRecoveryConfirmation(receipientParams, emailContentParams)
    );
  }

  /**
   * Send project recovery partially email
   * URLs are built internally from workspaceId
   * @private Use sendSafeProjectRecoveryPartially instead
   */
  private async sendProjectRecoveryPartially(
    receipientParams: ReceipientEmailParams,
    emailContentParams: ProjectRecoveryPartiallyEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = projectRecoveryPartiallyKey({
      projectName: emailContentParams.projectName,
      recipients,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderProjectRecoveryPartially({
      projectName: emailContentParams.projectName,
      dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: projectRecoveryPartiallySubject(emailContentParams.projectName),
        html,
        text,
        batch: useBatch,
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.info(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        projectName: emailContentParams.projectName,
        workspaceId: emailContentParams.workspaceId,
        provider: emailClient.getProvider(),
      },
      'Project recovery partially email sent'
    );
  }

  /**
   * Safe version: Send project recovery partially email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeProjectRecoveryPartially(
    receipientParams: ReceipientEmailParams,
    emailContentParams: ProjectRecoveryPartiallyEmailParams
  ): Promise<void> {
    await this.executeSafely(
      'sendProjectRecoveryPartially',
      { receipientParams, emailContentParams },
      () => this.sendProjectRecoveryPartially(receipientParams, emailContentParams)
    );
  }
}

export const emailService = new EmailService();
