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
   * @private Use sendSafeEmailVerification instead
   */
  private async sendEmailVerification(params: EmailVerificationEmailParams): Promise<void> {
    const idempotencyKey = emailVerificationKey({
      to: params.to,
      timestamp: Date.now(),
    });

    const { html, text } = await renderEmailVerification({
      userName: params.userName,
      verificationUrl: params.verificationUrl,
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: params.to,
        subject: emailVerificationSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        provider: emailClient.getProvider(),
      },
      'Email verification sent'
    );
  }

  /**
   * Safe version: Send email verification email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeEmailVerification(params: EmailVerificationEmailParams): Promise<void> {
    await this.executeSafely('sendEmailVerification', params, () =>
      this.sendEmailVerification(params)
    );
  }

  /**
   * Send magic link email for passwordless sign in
   * @private Use sendSafeMagicLink instead
   */
  private async sendMagicLink(params: MagicLinkEmailParams): Promise<void> {
    const idempotencyKey = magicLinkKey({
      to: params.to,
      timestamp: Date.now(),
    });

    const { html, text } = await renderMagicLink({
      magicLinkUrl: params.magicLinkUrl,
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: params.to,
        subject: magicLinkSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        provider: emailClient.getProvider(),
      },
      'Magic link sent'
    );
  }

  /**
   * Safe version: Send magic link email for passwordless sign in
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeMagicLink(params: MagicLinkEmailParams): Promise<void> {
    await this.executeSafely('sendMagicLink', params, () => this.sendMagicLink(params));
  }

  /**
   * Send workspace access request email to owner
   * Uses React Email template
   * Email is sent from configured invite inbox with requester details in content
   * @private Use sendSafeAccessRequest instead
   */
  private async sendAccessRequest(params: AccessRequestEmailParams): Promise<void> {
    const idempotencyKey = accessRequestKey({
      workspaceName: params.workspaceName,
      requesterEmail: params.requesterEmail,
      to: params.to,
    });

    const { html, text } = await renderAccessRequest({
      workspaceName: params.workspaceName,
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      reviewUrl: params.reviewUrl,
    });

    await emailClient.send(
      {
        from: inviteFrom(params.workspaceName),
        to: params.to,
        subject: accessRequestSubject({
          requesterName: params.requesterName,
          workspaceName: params.workspaceName,
        }),
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspace: params.workspaceName,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        provider: emailClient.getProvider(),
      },
      'Workspace access request sent'
    );
  }

  /**
   * Safe version: Send workspace access request email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccessRequest(params: AccessRequestEmailParams): Promise<void> {
    await this.executeSafely('sendAccessRequest', params, () => this.sendAccessRequest(params));
  }

  // ============================================================================
  // BILLING EMAILS
  // ============================================================================

  /**
   * Send billing email updated notification
   * Sent when workspace billing email address is changed
   * @private Use sendSafeBillingEmailUpdated instead
   */
  private async sendBillingEmailUpdated(params: BillingEmailUpdatedEmailParams): Promise<void> {
    const idempotencyKey = billingEmailUpdatedKey({
      to: params.to,
      newEmail: params.newEmail,
    });

    const { html, text } = await renderBillingEmailUpdated({
      previousEmail: params.previousEmail,
      newEmail: params.newEmail,
      billingUrl: params.billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: billingEmailUpdatedSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        previousEmail: params.previousEmail,
        newEmail: params.newEmail,
        provider: emailClient.getProvider(),
      },
      'Billing email updated notification sent'
    );
  }

  /**
   * Safe version: Send billing email updated notification
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeBillingEmailUpdated(params: BillingEmailUpdatedEmailParams): Promise<void> {
    await this.executeSafely('sendBillingEmailUpdated', params, () =>
      this.sendBillingEmailUpdated(params)
    );
  }

  /**
   * Send billing email verification request
   * Sent when workspace billing email change is requested
   * @private Use sendSafeBillingEmailVerification instead
   */
  private async sendBillingEmailVerification(
    params: BillingEmailVerificationEmailParams
  ): Promise<void> {
    const idempotencyKey = billingEmailVerificationKey({
      to: params.to,
      timestamp: Date.now(),
    });

    const { html, text } = await renderBillingEmailVerification({
      workspaceName: params.workspaceName,
      verificationUrl: params.verificationUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: billingEmailVerificationSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspaceName: params.workspaceName,
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
    params: BillingEmailVerificationEmailParams
  ): Promise<void> {
    await this.executeSafely('sendBillingEmailVerification', params, () =>
      this.sendBillingEmailVerification(params)
    );
  }

  /**
   * Send subscription active email
   * @private Use sendSafeSubscriptionActive instead
   */
  private async sendSubscriptionActive(params: SubscriptionActiveEmailParams): Promise<void> {
    const idempotencyKey = subscriptionActiveKey({
      to: params.to,
      planName: params.planName,
    });

    const { html, text } = await renderSubscriptionActive({
      planName: params.planName,
      dashboardUrl: params.dashboardUrl,
      billingUrl: params.billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: subscriptionActiveSubject(params.planName),
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        planName: params.planName,
        provider: emailClient.getProvider(),
      },
      'Subscription active email sent'
    );
  }

  /**
   * Safe version: Send subscription active email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionActive(params: SubscriptionActiveEmailParams): Promise<void> {
    await this.executeSafely('sendSubscriptionActive', params, () =>
      this.sendSubscriptionActive(params)
    );
  }

  /**
   * Send subscription expired email
   * @private Use sendSafeSubscriptionExpired instead
   */
  private async sendSubscriptionExpired(params: SubscriptionExpiredEmailParams): Promise<void> {
    const idempotencyKey = subscriptionExpiredKey({
      to: params.to,
      planName: params.planName,
    });

    const { html, text } = await renderSubscriptionExpired({
      planName: params.planName,
      renewUrl: params.renewUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: subscriptionExpiredSubject(params.planName),
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        planName: params.planName,
        provider: emailClient.getProvider(),
      },
      'Subscription expired email sent'
    );
  }

  /**
   * Safe version: Send subscription expired email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionExpired(params: SubscriptionExpiredEmailParams): Promise<void> {
    await this.executeSafely('sendSubscriptionExpired', params, () =>
      this.sendSubscriptionExpired(params)
    );
  }

  /**
   * Send subscription inactive email
   * @private Use sendSafeSubscriptionInactive instead
   */
  private async sendSubscriptionInactive(params: SubscriptionInactiveEmailParams): Promise<void> {
    const idempotencyKey = subscriptionInactiveKey({
      to: params.to,
      planName: params.planName,
    });

    const { html, text } = await renderSubscriptionInactive({
      planName: params.planName,
      reactivateUrl: params.reactivateUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: subscriptionInactiveSubject(params.planName),
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        planName: params.planName,
        provider: emailClient.getProvider(),
      },
      'Subscription inactive email sent'
    );
  }

  /**
   * Safe version: Send subscription inactive email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionInactive(params: SubscriptionInactiveEmailParams): Promise<void> {
    await this.executeSafely('sendSubscriptionInactive', params, () =>
      this.sendSubscriptionInactive(params)
    );
  }

  /**
   * Send subscription plan change email
   * @private Use sendSafeSubscriptionPlanChange instead
   */
  private async sendSubscriptionPlanChange(
    params: SubscriptionPlanChangeEmailParams
  ): Promise<void> {
    const idempotencyKey = subscriptionPlanChangeKey({
      to: params.to,
      newPlan: params.newPlan,
    });

    const { html, text } = await renderSubscriptionPlanChange({
      previousPlan: params.previousPlan,
      newPlan: params.newPlan,
      effectiveDate: params.effectiveDate,
      billingUrl: params.billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: subscriptionPlanChangeSubject(params.newPlan),
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        previousPlan: params.previousPlan,
        newPlan: params.newPlan,
        provider: emailClient.getProvider(),
      },
      'Subscription plan change email sent'
    );
  }

  /**
   * Safe version: Send subscription plan change email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeSubscriptionPlanChange(params: SubscriptionPlanChangeEmailParams): Promise<void> {
    await this.executeSafely('sendSubscriptionPlanChange', params, () =>
      this.sendSubscriptionPlanChange(params)
    );
  }

  /**
   * Send subscription reverse trial email
   * @private Use sendSafeSubscriptionReverseTrial instead
   */
  private async sendSubscriptionReverseTrial(
    params: SubscriptionReverseTrialEmailParams
  ): Promise<void> {
    const idempotencyKey = subscriptionReverseTrialKey({
      to: params.to,
    });

    const { html, text } = await renderSubscriptionReverseTrial({
      planName: params.planName,
      trialDays: params.trialDays,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: subscriptionReverseTrialSubject(params.planName),
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        planName: params.planName,
        trialDays: params.trialDays,
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
    params: SubscriptionReverseTrialEmailParams
  ): Promise<void> {
    await this.executeSafely('sendSubscriptionReverseTrial', params, () =>
      this.sendSubscriptionReverseTrial(params)
    );
  }

  // ============================================================================
  // DOMAIN EMAILS
  // ============================================================================

  /**
   * Send domain developer instructions email
   * Uses React Email template and idempotency key to prevent duplicate sends
   * Email is sent from configured invite inbox
   * @private Use sendSafeDomainDeveloperInstructions instead
   */
  private async sendDomainDeveloperInstructions(
    params: DomainDeveloperInstructionsEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = domainInstructionsKey({
      domainName: params.domainName,
      recipients,
    });

    const { html, text } = await renderDomainDeveloperInstructions({
      domainName: params.domainName,
      settingsUrl: params.settingsUrl,
      docsUrl: params.docsUrl,
    });

    await emailClient.send(
      {
        from: domainFrom(),
        to: params.to,
        subject: domainDeveloperInstructionsSubject(params.domainName),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        domainName: params.domainName,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Domain developer instructions sent via batch'
        : 'Domain developer instructions sent'
    );
  }

  /**
   * Safe version: Send domain developer instructions email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeDomainDeveloperInstructions(
    params: DomainDeveloperInstructionsEmailParams
  ): Promise<void> {
    await this.executeSafely('sendDomainDeveloperInstructions', params, () =>
      this.sendDomainDeveloperInstructions(params)
    );
  }

  // ============================================================================
  // INVITE EMAILS
  // ============================================================================

  /**
   * Send teammate invited email
   * @private Use sendSafeTeammateInvited instead
   */
  private async sendTeammateInvited(params: TeammateInvitedEmailParams): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = teammateInvitedKey({
      workspaceName: params.workspaceName,
      recipients,
    });

    const { html, text } = await renderTeammateInvited({
      inviterName: params.inviterName,
      inviterEmail: params.inviterEmail,
      workspaceName: params.workspaceName,
      inviteUrl: params.inviteUrl,
    });

    await emailClient.send(
      {
        from: inviteFrom(params.workspaceName),
        to: params.to,
        subject: teammateInvitedSubject({
          inviterName: params.inviterName,
          inviterEmail: params.inviterEmail,
          workspaceName: params.workspaceName,
        }),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspaceName: params.workspaceName,
        inviterName: params.inviterName,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Teammate invited emails sent via batch'
        : 'Teammate invited email sent'
    );
  }

  /**
   * Safe version: Send teammate invited email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeTeammateInvited(params: TeammateInvitedEmailParams): Promise<void> {
    await this.executeSafely('sendTeammateInvited', params, () => this.sendTeammateInvited(params));
  }

  /**
   * Send teammate joined email
   * Sent to workspace owners when someone joins
   * @private Use sendSafeTeammateJoined instead
   */
  private async sendTeammateJoined(params: TeammateJoinedEmailParams): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = teammateJoinedKey({
      workspaceName: params.workspaceName,
      recipients,
      memberEmail: params.memberEmail,
    });

    const { html, text } = await renderTeammateJoined({
      memberName: params.memberName,
      memberEmail: params.memberEmail,
      workspaceName: params.workspaceName,
      workspaceUrl: params.workspaceUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: teammateJoinedSubject({
          memberName: params.memberName,
          memberEmail: params.memberEmail,
          workspaceName: params.workspaceName,
        }),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspaceName: params.workspaceName,
        memberName: params.memberName,
        memberEmail: params.memberEmail,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Teammate joined emails sent via batch'
        : 'Teammate joined email sent'
    );
  }

  /**
   * Safe version: Send teammate joined email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeTeammateJoined(params: TeammateJoinedEmailParams): Promise<void> {
    await this.executeSafely('sendTeammateJoined', params, () => this.sendTeammateJoined(params));
  }

  // ============================================================================
  // OFFBOARDING EMAILS
  // ============================================================================

  /**
   * Send account deletion email
   * @private Use sendSafeAccountDeletion instead
   */
  private async sendAccountDeletion(params: AccountDeletionEmailParams): Promise<void> {
    const idempotencyKey = accountDeletionKey({
      to: params.to,
    });

    const { html, text } = await renderAccountDeletion({
      userName: params.userName,
      feedbackUrl: params.feedbackUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: accountDeletionSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
        provider: emailClient.getProvider(),
      },
      'Account deletion email sent'
    );
  }

  /**
   * Safe version: Send account deletion email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccountDeletion(params: AccountDeletionEmailParams): Promise<void> {
    await this.executeSafely('sendAccountDeletion', params, () => this.sendAccountDeletion(params));
  }

  /**
   * Send account deletion verification email
   * Sent when a user requests to delete their account
   * @private Use sendSafeAccountDeletionVerification instead
   */
  private async sendAccountDeletionVerification(
    params: AccountDeletionVerificationEmailParams
  ): Promise<void> {
    const idempotencyKey = accountDeletionVerificationKey({
      to: params.to,
      timestamp: Date.now(),
    });

    const { html, text } = await renderAccountDeletionVerification({
      userName: params.userName,
      verificationUrl: params.verificationUrl,
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: params.to,
        subject: accountDeletionVerificationSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
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
    params: AccountDeletionVerificationEmailParams
  ): Promise<void> {
    await this.executeSafely('sendAccountDeletionVerification', params, () =>
      this.sendAccountDeletionVerification(params)
    );
  }

  /**
   * Send account restored email
   * @private Use sendSafeAccountRestored instead
   */
  private async sendAccountRestored(params: AccountRestoredEmailParams): Promise<void> {
    const idempotencyKey = accountRestoredKey({
      to: params.to,
    });

    const { html, text } = await renderAccountRestored({
      userName: params.userName,
      loginUrl: params.loginUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: accountRestoredSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
        provider: emailClient.getProvider(),
      },
      'Account restored email sent'
    );
  }

  /**
   * Safe version: Send account restored email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccountRestored(params: AccountRestoredEmailParams): Promise<void> {
    await this.executeSafely('sendAccountRestored', params, () => this.sendAccountRestored(params));
  }

  /**
   * Send TOS violation email
   * @private Use sendSafeTosViolation instead
   */
  private async sendTosViolation(params: TosViolationEmailParams): Promise<void> {
    const idempotencyKey = tosViolationKey({
      to: params.to,
    });

    const { html, text } = await renderTosViolation({
      userName: params.userName,
      appealUrl: params.appealUrl,
      tosUrl: params.tosUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: tosViolationSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
        provider: emailClient.getProvider(),
      },
      'TOS violation email sent'
    );
  }

  /**
   * Safe version: Send TOS violation email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeTosViolation(params: TosViolationEmailParams): Promise<void> {
    await this.executeSafely('sendTosViolation', params, () => this.sendTosViolation(params));
  }

  // ============================================================================
  // PILOT EMAILS
  // ============================================================================

  /**
   * Send pilot sandbox invite email
   * Supports optional scheduling via scheduledAt field in params
   * @private Use sendSafePilotSandboxInvite instead
   */
  private async sendPilotSandboxInvite(params: PilotSandboxInviteEmailParams): Promise<void> {
    const idempotencyKey = pilotSandboxInviteKey({
      to: params.to,
      scheduledAt: params.scheduledAt,
    });

    const { html, text } = await renderSandboxInvite({
      sandboxUrl: params.sandboxUrl,
      expiresInDays: params.expiresInDays,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: sandboxInviteSubject,
        html,
        text,
      },
      {
        idempotencyKey,
        ...(params.scheduledAt && { scheduledAt: params.scheduledAt }),
      }
    );

    logger.info(
      {
        to: params.to,
        expiresInDays: params.expiresInDays,
        scheduled: !!params.scheduledAt,
        scheduledAt: params.scheduledAt,
        provider: emailClient.getProvider(),
      },
      params.scheduledAt
        ? 'Pilot sandbox invite email scheduled'
        : 'Pilot sandbox invite email sent'
    );
  }

  /**
   * Safe version: Send pilot sandbox invite email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafePilotSandboxInvite(params: PilotSandboxInviteEmailParams): Promise<void> {
    await this.executeSafely('sendPilotSandboxInvite', params, () =>
      this.sendPilotSandboxInvite(params)
    );
  }

  // ============================================================================
  // RECORDING EMAILS
  // ============================================================================

  /**
   * Send recording received email
   * @private Use sendSafeRecordingReceived instead
   */
  private async sendRecordingReceived(params: RecordingReceivedEmailParams): Promise<void> {
    const idempotencyKey = recordingReceivedKey({
      to: params.to,
      recordingUrl: params.recordingUrl,
    });

    const { html, text } = await renderRecordingReceived({
      recordingUrl: params.recordingUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: recordingReceivedSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        provider: emailClient.getProvider(),
      },
      'Recording received email sent'
    );
  }

  /**
   * Safe version: Send recording received email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeRecordingReceived(params: RecordingReceivedEmailParams): Promise<void> {
    await this.executeSafely('sendRecordingReceived', params, () =>
      this.sendRecordingReceived(params)
    );
  }

  // ============================================================================
  // ONBOARDING EMAILS
  // ============================================================================

  /**
   * Send welcome email for members joining a workspace
   * Sent to users when they join a workspace as a member
   * @private Use sendSafeWelcomeEmailMember instead
   */
  private async sendWelcomeEmailMember(params: WelcomeEmailMemberParams): Promise<void> {
    const idempotencyKey = welcomeEmailMemberKey({
      to: params.to,
      workspaceName: params.workspaceName,
    });

    const { html, text } = await renderWelcomeEmailMember({
      userName: params.userName,
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: welcomeEmailMemberSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
        workspaceName: params.workspaceName,
        provider: emailClient.getProvider(),
      },
      'Welcome email member sent'
    );
  }

  /**
   * Safe version: Send welcome email for members
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailMember(params: WelcomeEmailMemberParams): Promise<void> {
    await this.executeSafely('sendWelcomeEmailMember', params, () =>
      this.sendWelcomeEmailMember(params)
    );
  }

  /**
   * Send welcome email for subscription users
   * Sent to users who create a workspace without an invite token (organic signup)
   * @private Use sendSafeWelcomeEmailSubscription instead
   */
  private async sendWelcomeEmailSubscription(
    params: WelcomeEmailSubscriptionParams
  ): Promise<void> {
    const idempotencyKey = welcomeEmailSubscriptionKey({
      to: params.to,
    });

    const { html, text } = await renderWelcomeEmailSubscription({
      userName: params.userName,
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: welcomeEmailSubscriptionSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
        workspaceName: params.workspaceName,
        provider: emailClient.getProvider(),
      },
      'Welcome email subscription sent'
    );
  }

  /**
   * Safe version: Send welcome email for subscription users
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailSubscription(params: WelcomeEmailSubscriptionParams): Promise<void> {
    await this.executeSafely('sendWelcomeEmailSubscription', params, () =>
      this.sendWelcomeEmailSubscription(params)
    );
  }

  /**
   * Send welcome email for pilot users
   * Sent to users who create a workspace with an invite token (invited/pilot users)
   * @private Use sendSafeWelcomeEmailPilot instead
   */
  private async sendWelcomeEmailPilot(params: WelcomeEmailPilotParams): Promise<void> {
    const idempotencyKey = welcomeEmailPilotKey({
      to: params.to,
    });

    const { html, text } = await renderWelcomeEmailPilot({
      userName: params.userName,
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
      calendarUrl: params.calendarUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: welcomeEmailPilotSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
        workspaceName: params.workspaceName,
        provider: emailClient.getProvider(),
      },
      'Welcome email pilot sent'
    );
  }

  /**
   * Safe version: Send welcome email for pilot users
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailPilot(params: WelcomeEmailPilotParams): Promise<void> {
    await this.executeSafely('sendWelcomeEmailPilot', params, () =>
      this.sendWelcomeEmailPilot(params)
    );
  }

  /**
   * Send welcome email for requesters whose access was approved
   * Sent to users when their access request is approved
   * @private Use sendSafeWelcomeEmailRequester instead
   */
  private async sendWelcomeEmailRequester(params: WelcomeEmailRequesterParams): Promise<void> {
    const idempotencyKey = welcomeEmailRequesterKey({
      to: params.to,
      workspaceName: params.workspaceName,
    });

    const { html, text } = await renderWelcomeEmailRequester({
      userName: params.userName,
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: welcomeEmailRequesterSubject,
        html,
        text,
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        userName: params.userName,
        workspaceName: params.workspaceName,
        provider: emailClient.getProvider(),
      },
      'Welcome email requester sent'
    );
  }

  /**
   * Safe version: Send welcome email for requesters
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWelcomeEmailRequester(params: WelcomeEmailRequesterParams): Promise<void> {
    await this.executeSafely('sendWelcomeEmailRequester', params, () =>
      this.sendWelcomeEmailRequester(params)
    );
  }

  // ============================================================================
  // WORKSPACE EMAILS
  // ============================================================================

  /**
   * Send workspace deletion scheduled email
   * @private Use sendSafeWorkspaceDeletionScheduled instead
   */
  private async sendWorkspaceDeletionScheduled(
    params: WorkspaceDeletionScheduledEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = workspaceDeletionScheduledKey({
      workspaceName: params.workspaceName,
      recipients,
    });

    const { html, text } = await renderDeletionScheduled({
      workspaceName: params.workspaceName,
      deletionDate: params.deletionDate,
      cancelUrl: params.cancelUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: workspaceDeletionScheduledSubject({
          workspaceName: params.workspaceName,
          deletionDate: params.deletionDate,
        }),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
        ...(params.scheduledAt && { scheduledAt: params.scheduledAt }),
      }
    );

    logger.info(
      {
        to: params.to,
        workspaceName: params.workspaceName,
        deletionDate: params.deletionDate,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Workspace deletion scheduled emails sent via batch'
        : 'Workspace deletion scheduled email sent'
    );
  }

  /**
   * Safe version: Send workspace deletion scheduled email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWorkspaceDeletionScheduled(
    params: WorkspaceDeletionScheduledEmailParams
  ): Promise<void> {
    await this.executeSafely('sendWorkspaceDeletionScheduled', params, () =>
      this.sendWorkspaceDeletionScheduled(params)
    );
  }

  /**
   * Send workspace recovery confirmation email
   * @private Use sendSafeWorkspaceRecoveryConfirmation instead
   */
  private async sendWorkspaceRecoveryConfirmation(
    params: WorkspaceRecoveryConfirmationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = workspaceRecoveryConfirmationKey({
      workspaceName: params.workspaceName,
      recipients,
    });

    const { html, text } = await renderRecoveryConfirmation({
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: workspaceRecoveryConfirmationSubject(params.workspaceName),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
        ...(params.scheduledAt && { scheduledAt: params.scheduledAt }),
      }
    );

    logger.info(
      {
        to: params.to,
        workspaceName: params.workspaceName,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Workspace recovery confirmation emails sent via batch'
        : 'Workspace recovery confirmation email sent'
    );
  }

  /**
   * Safe version: Send workspace recovery confirmation email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWorkspaceRecoveryConfirmation(
    params: WorkspaceRecoveryConfirmationEmailParams
  ): Promise<void> {
    await this.executeSafely('sendWorkspaceRecoveryConfirmation', params, () =>
      this.sendWorkspaceRecoveryConfirmation(params)
    );
  }

  /**
   * Send workspace recovery partially email
   * @private Use sendSafeWorkspaceRecoveryPartially instead
   */
  private async sendWorkspaceRecoveryPartially(
    params: WorkspaceRecoveryPartiallyEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = workspaceRecoveryPartiallyKey({
      workspaceName: params.workspaceName,
      recipients,
    });

    const { html, text } = await renderRecoveryPartially({
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: workspaceRecoveryPartiallySubject(params.workspaceName),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
        ...(params.scheduledAt && { scheduledAt: params.scheduledAt }),
      }
    );

    logger.info(
      {
        to: params.to,
        workspaceName: params.workspaceName,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Workspace recovery partially emails sent via batch'
        : 'Workspace recovery partially email sent'
    );
  }

  /**
   * Safe version: Send workspace recovery partially email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWorkspaceRecoveryPartially(
    params: WorkspaceRecoveryPartiallyEmailParams
  ): Promise<void> {
    await this.executeSafely('sendWorkspaceRecoveryPartially', params, () =>
      this.sendWorkspaceRecoveryPartially(params)
    );
  }

  // ============================================================================
  // PROJECT EMAILS
  // ============================================================================

  /**
   * Send project deletion scheduled email
   * @private Use sendSafeProjectDeletionScheduled instead
   */
  private async sendProjectDeletionScheduled(
    params: ProjectDeletionScheduledEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = projectDeletionScheduledKey({
      projectName: params.projectName,
      recipients,
    });

    const { html, text } = await renderProjectDeletionScheduled({
      projectName: params.projectName,
      deletionDate: params.deletionDate,
      cancelUrl: params.cancelUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: projectDeletionScheduledSubject({
          projectName: params.projectName,
          deletionDate: params.deletionDate,
        }),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
        ...(params.scheduledAt && { scheduledAt: params.scheduledAt }),
      }
    );

    logger.info(
      {
        to: params.to,
        projectName: params.projectName,
        deletionDate: params.deletionDate,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Project deletion scheduled emails sent via batch'
        : 'Project deletion scheduled email sent'
    );
  }

  /**
   * Safe version: Send project deletion scheduled email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeProjectDeletionScheduled(
    params: ProjectDeletionScheduledEmailParams
  ): Promise<void> {
    await this.executeSafely('sendProjectDeletionScheduled', params, () =>
      this.sendProjectDeletionScheduled(params)
    );
  }

  /**
   * Send project recovery confirmation email
   * @private Use sendSafeProjectRecoveryConfirmation instead
   */
  private async sendProjectRecoveryConfirmation(
    params: ProjectRecoveryConfirmationEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = projectRecoveryConfirmationKey({
      projectName: params.projectName,
      recipients,
    });

    const { html, text } = await renderProjectRecoveryConfirmation({
      projectName: params.projectName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: projectRecoveryConfirmationSubject(params.projectName),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
        ...(params.scheduledAt && { scheduledAt: params.scheduledAt }),
      }
    );

    logger.info(
      {
        to: params.to,
        projectName: params.projectName,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Project recovery confirmation emails sent via batch'
        : 'Project recovery confirmation email sent'
    );
  }

  /**
   * Safe version: Send project recovery confirmation email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeProjectRecoveryConfirmation(
    params: ProjectRecoveryConfirmationEmailParams
  ): Promise<void> {
    await this.executeSafely('sendProjectRecoveryConfirmation', params, () =>
      this.sendProjectRecoveryConfirmation(params)
    );
  }

  /**
   * Send project recovery partially email
   * @private Use sendSafeProjectRecoveryPartially instead
   */
  private async sendProjectRecoveryPartially(
    params: ProjectRecoveryPartiallyEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    const idempotencyKey = projectRecoveryPartiallyKey({
      projectName: params.projectName,
      recipients,
    });

    const { html, text } = await renderProjectRecoveryPartially({
      projectName: params.projectName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: projectRecoveryPartiallySubject(params.projectName),
        html,
        text,
        batch: params.batch,
      },
      {
        idempotencyKey,
        ...(params.scheduledAt && { scheduledAt: params.scheduledAt }),
      }
    );

    logger.info(
      {
        to: params.to,
        projectName: params.projectName,
        provider: emailClient.getProvider(),
        batch: params.batch && recipients.length > 1,
      },
      params.batch && recipients.length > 1
        ? 'Project recovery partially emails sent via batch'
        : 'Project recovery partially email sent'
    );
  }

  /**
   * Safe version: Send project recovery partially email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeProjectRecoveryPartially(
    params: ProjectRecoveryPartiallyEmailParams
  ): Promise<void> {
    await this.executeSafely('sendProjectRecoveryPartially', params, () =>
      this.sendProjectRecoveryPartially(params)
    );
  }
}

export const emailService = new EmailService();
