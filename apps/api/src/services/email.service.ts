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
  renderTeammateInvited,
  renderTosViolation,
  renderWelcomeEmailMember,
  renderWelcomeEmailPilot,
  renderWelcomeEmailRequester,
  renderWelcomeEmailSubscription,
  renderWorkspaceInvite,
} from '@workspace/email';
import type { MediaClient } from '@workspace/storage/media';

import { emailClient } from '@/api/clients/email';
import { getMediaClient } from '@/api/clients/media';
import { createLogger } from '@/api/lib/logger';
import {
  accessRequestSubject,
  accountDeletionSubject,
  accountDeletionVerificationSubject,
  accountRestoredSubject,
  domainDeveloperInstructionsSubject,
  emailVerificationSubject,
  magicLinkSubject,
  projectDeletionScheduledSubject,
  projectRecoveryConfirmationSubject,
  projectRecoveryPartiallySubject,
  recordingReceivedSubject,
  sandboxInviteSubject,
  teammateInvitedSubject,
  tosViolationSubject,
  welcomeEmailMemberSubject,
  welcomeEmailPilotSubject,
  welcomeEmailRequesterSubject,
  welcomeEmailSubscriptionSubject,
  workspaceDeletionScheduledSubject,
  workspaceInviteSubject,
  workspaceRecoveryConfirmationSubject,
  workspaceRecoveryPartiallySubject,
} from '@/api/subjects';
import type {
  AccessRequestEmailParams,
  AccountDeletionVerificationEmailParams,
  DomainDeveloperInstructionsEmailParams,
  EmailVerificationEmailParams,
  MagicLinkEmailParams,
  PilotSandboxInviteEmailParams,
  ProjectDeletionScheduledEmailParams,
  ProjectRecoveryConfirmationEmailParams,
  ProjectRecoveryPartiallyEmailParams,
  ReceipientEmailParams,
  RecordingReceivedEmailParams,
  TeammateInvitedEmailParams,
  WelcomeEmailMemberParams,
  WelcomeEmailPilotParams,
  WelcomeEmailRequesterParams,
  WelcomeEmailSubscriptionParams,
  WorkspaceDeletionScheduledEmailParams,
  WorkspaceInviteEmailParams,
  WorkspaceRecoveryConfirmationEmailParams,
  WorkspaceRecoveryPartiallyEmailParams,
} from '@/api/types';
import { authFrom, domainFrom, inviteFrom, notificationFrom } from '@/api/utils/email-from';
import { antiThreadingHeaders } from '@/api/utils/email-headers';
import { emailUrls } from '@/api/utils/email-urls';
import {
  accessRequestKey,
  accountDeletionKey,
  accountDeletionVerificationKey,
  accountRestoredKey,
  domainInstructionsKey,
  emailVerificationKey,
  magicLinkKey,
  pilotSandboxInviteKey,
  projectDeletionScheduledKey,
  projectRecoveryConfirmationKey,
  projectRecoveryPartiallyKey,
  recordingReceivedKey,
  teammateInvitedKey,
  tosViolationKey,
  welcomeEmailMemberKey,
  welcomeEmailPilotKey,
  welcomeEmailRequesterKey,
  welcomeEmailSubscriptionKey,
  workspaceDeletionScheduledKey,
  workspaceInviteKey,
  workspaceRecoveryConfirmationKey,
  workspaceRecoveryPartiallyKey,
} from '@/api/utils/idempotency-key';

const logger = createLogger('email-service');

type ErrorHandler = (error: unknown, context: { method: string; params: unknown }) => void;

export class EmailService {
  private readonly errorHandler: ErrorHandler;
  private readonly mediaClient: MediaClient;

  constructor(errorHandler?: ErrorHandler, mediaClient?: MediaClient) {
    this.errorHandler =
      errorHandler ||
      ((error, context) => {
        logger.warn(
          {
            method: context.method,
            error: error instanceof Error ? error.message : String(error),
          },
          'Email service error'
        );
      });
    this.mediaClient = mediaClient ?? getMediaClient();
  }

  /**
   * Get the logo URL for email templates from the CDN.
   * Uses raw CDN URL (skipTransform) because email clients need a direct
   * image URL and may not support WebP/AVIF from Cloudflare format=auto.
   */
  private getLogoUrl(): string {
    return this.mediaClient.getBrandMediaUrl('brand/userplane-icon-64.png', {
      skipTransform: true,
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
      verificationUrl: emailContentParams.verificationUrl,
    });

    const { html, text } = await renderEmailVerification({
      userName: emailContentParams.userName,
      verificationUrl: emailContentParams.verificationUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: receipientParams.to,
        subject: emailVerificationSubject,
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
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
      magicLinkUrl: emailContentParams.magicLinkUrl,
    });

    const { html, text } = await renderMagicLink({
      magicLinkUrl: emailContentParams.magicLinkUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: authFrom(),
        to: receipientParams.to,
        subject: magicLinkSubject,
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
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
      requestId: emailContentParams.reviewUrl, // reviewUrl contains unique token for the request
    });

    const { html, text } = await renderAccessRequest({
      workspaceName: emailContentParams.workspaceName,
      requesterName: emailContentParams.requesterName,
      requesterEmail: emailContentParams.requesterEmail,
      reviewUrl: emailContentParams.reviewUrl,
      expiryDate: emailContentParams.expiryDate,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
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
      verificationToken: emailContentParams.verificationToken,
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
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
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
      inviteUrl: emailContentParams.inviteUrl,
    });

    const { html, text } = await renderTeammateInvited({
      workspaceName: emailContentParams.workspaceName,
      inviteUrl: emailContentParams.inviteUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: inviteFrom(emailContentParams.workspaceName),
        to: receipientParams.to,
        subject: teammateInvitedSubject({
          workspaceName: emailContentParams.workspaceName,
        }),
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        workspaceName: emailContentParams.workspaceName,
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

  // ============================================================================
  // OFFBOARDING EMAILS
  // ============================================================================

  /**
   * Send account deletion email
   * URLs are built internally from static sources
   * @private Use sendSafeAccountDeletion instead
   */
  private async sendAccountDeletion(receipientParams: ReceipientEmailParams): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    // Use recipient email as user identifier since this function only has recipient params
    const userIdentifier = Array.isArray(receipientParams.to)
      ? receipientParams.to.join(',')
      : receipientParams.to;
    const idempotencyKey = accountDeletionKey({
      to: receipientParams.to,
      userId: userIdentifier,
    });

    const feedbackUrl = emailUrls.account.feedback();

    const { html, text } = await renderAccountDeletion({
      feedbackUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        provider: emailClient.getProvider(),
      },
      'Account deletion email sent'
    );
  }

  /**
   * Safe version: Send account deletion email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccountDeletion(receipientParams: ReceipientEmailParams): Promise<void> {
    await this.executeSafely('sendAccountDeletion', { receipientParams }, () =>
      this.sendAccountDeletion(receipientParams)
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
      deletionToken: emailContentParams.deletionToken,
    });

    const verificationUrl = emailUrls.account.deleteConfirmation(emailContentParams.deletionToken);

    const { html, text } = await renderAccountDeletionVerification({
      verificationUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
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
  private async sendAccountRestored(receipientParams: ReceipientEmailParams): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    // Use recipient email as user identifier since this function only has recipient params
    const userIdentifier = Array.isArray(receipientParams.to)
      ? receipientParams.to.join(',')
      : receipientParams.to;
    const idempotencyKey = accountRestoredKey({
      to: receipientParams.to,
      userId: userIdentifier,
    });

    const loginUrl = emailUrls.external.login();

    const { html, text } = await renderAccountRestored({
      loginUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: accountRestoredSubject,
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        provider: emailClient.getProvider(),
      },
      'Account restored email sent'
    );
  }

  /**
   * Safe version: Send account restored email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeAccountRestored(receipientParams: ReceipientEmailParams): Promise<void> {
    await this.executeSafely('sendAccountRestored', { receipientParams }, () =>
      this.sendAccountRestored(receipientParams)
    );
  }

  /**
   * Send TOS violation email
   * URLs are built internally from static sources
   * @private Use sendSafeTosViolation instead
   */
  private async sendTosViolation(receipientParams: ReceipientEmailParams): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;
    const finalParams = this.ensureReplyTo(receipientParams);

    // Use recipient email as user identifier since this function only has recipient params
    const userIdentifier = Array.isArray(receipientParams.to)
      ? receipientParams.to.join(',')
      : receipientParams.to;
    const idempotencyKey = tosViolationKey({
      to: receipientParams.to,
      userId: userIdentifier,
    });

    const appealUrl = emailUrls.external.appeal();
    const tosUrl = emailUrls.external.terms();

    const { html, text } = await renderTosViolation({
      appealUrl,
      tosUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
        provider: emailClient.getProvider(),
      },
      'TOS violation email sent'
    );
  }

  /**
   * Safe version: Send TOS violation email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeTosViolation(receipientParams: ReceipientEmailParams): Promise<void> {
    await this.executeSafely('sendTosViolation', { receipientParams }, () =>
      this.sendTosViolation(receipientParams)
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
      sandboxUrl: emailContentParams.sandboxUrl,
      scheduledAt: emailContentParams.scheduledAt,
    });

    const calendarUrl = emailUrls.support.calendar();

    const { html, text } = await renderSandboxInvite({
      sandboxUrl: emailContentParams.sandboxUrl,
      calendarUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: sandboxInviteSubject,
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
        ...(receipientParams.replyTo && { replyTo: receipientParams.replyTo }),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
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

  /**
   * Send workspace invite email
   * Supports optional scheduling via scheduledAt field in params
   * @private Use sendSafeWorkspaceInvite instead
   */
  private async sendWorkspaceInvite(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceInviteEmailParams
  ): Promise<void> {
    const recipients = Array.isArray(receipientParams.to)
      ? receipientParams.to
      : [receipientParams.to];
    const useBatch = recipients.length > 1;

    const idempotencyKey = workspaceInviteKey({
      to: receipientParams.to,
      inviteUrl: emailContentParams.inviteUrl,
      scheduledAt: emailContentParams.scheduledAt,
    });

    const calendarUrl = emailUrls.support.calendar();
    const { html, text } = await renderWorkspaceInvite({
      inviteUrl: emailContentParams.inviteUrl,
      calendarUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: workspaceInviteSubject,
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
        ...(receipientParams.replyTo && { replyTo: receipientParams.replyTo }),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );
  }

  /**
   * Safe version: Send workspace invite email
   * Errors are handled by the configured error handler instead of throwing
   */
  async sendSafeWorkspaceInvite(
    receipientParams: ReceipientEmailParams,
    emailContentParams: WorkspaceInviteEmailParams
  ): Promise<void> {
    await this.executeSafely('sendWorkspaceInvite', { receipientParams, emailContentParams }, () =>
      this.sendWorkspaceInvite(receipientParams, emailContentParams)
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
      recordingId: emailContentParams.recordingId,
    });

    const { html, text } = await renderRecordingReceived({
      recordingUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: recordingReceivedSubject,
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
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
      workspaceId: emailContentParams.workspaceId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderWelcomeEmailMember({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
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
      workspaceId: emailContentParams.workspaceId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderWelcomeEmailSubscription({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
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
      workspaceId: emailContentParams.workspaceId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);
    const calendarUrl = emailUrls.support.calendar();

    const { html, text } = await renderWelcomeEmailPilot({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
      calendarUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
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
      workspaceId: emailContentParams.workspaceId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderWelcomeEmailRequester({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
      }
    );

    logger.debug(
      {
        to: receipientParams.to,
        batch: useBatch,
        count: recipients.length,
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
      workspaceId: emailContentParams.workspaceId,
    });

    const cancelUrl = emailUrls.workspace.restore(emailContentParams.workspaceId);

    const { html, text } = await renderDeletionScheduled({
      workspaceName: emailContentParams.workspaceName,
      deletionDate: emailContentParams.deletionDate,
      cancelUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.debug(
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
      workspaceId: emailContentParams.workspaceId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderRecoveryConfirmation({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: workspaceRecoveryConfirmationSubject(emailContentParams.workspaceName),
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.debug(
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
      workspaceId: emailContentParams.workspaceId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderRecoveryPartially({
      workspaceName: emailContentParams.workspaceName,
      dashboardUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: workspaceRecoveryPartiallySubject(emailContentParams.workspaceName),
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.debug(
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
      projectId: emailContentParams.projectId,
    });

    const cancelUrl = emailUrls.project.restore(
      emailContentParams.workspaceId,
      emailContentParams.projectId
    );

    const { html, text } = await renderProjectDeletionScheduled({
      projectName: emailContentParams.projectName,
      deletionDate: emailContentParams.deletionDate,
      cancelUrl,
      logoUrl: this.getLogoUrl(),
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
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.debug(
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

    // Use workspaceId + projectName as composite identifier since projectId isn't available
    const projectId = `${emailContentParams.workspaceId}/${emailContentParams.projectName}`;
    const idempotencyKey = projectRecoveryConfirmationKey({
      projectName: emailContentParams.projectName,
      recipients,
      projectId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderProjectRecoveryConfirmation({
      projectName: emailContentParams.projectName,
      dashboardUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: projectRecoveryConfirmationSubject(emailContentParams.projectName),
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.debug(
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

    // Use workspaceId + projectName as composite identifier since projectId isn't available
    const projectId = `${emailContentParams.workspaceId}/${emailContentParams.projectName}`;
    const idempotencyKey = projectRecoveryPartiallyKey({
      projectName: emailContentParams.projectName,
      recipients,
      projectId,
    });

    const dashboardUrl = emailUrls.workspace.dashboard(emailContentParams.workspaceId);

    const { html, text } = await renderProjectRecoveryPartially({
      projectName: emailContentParams.projectName,
      dashboardUrl,
      logoUrl: this.getLogoUrl(),
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: receipientParams.to,
        subject: projectRecoveryPartiallySubject(emailContentParams.projectName),
        html,
        text,
        batch: useBatch,
        headers: antiThreadingHeaders(),
      },
      {
        idempotencyKey,
        ...(emailContentParams.scheduledAt && { scheduledAt: emailContentParams.scheduledAt }),
      }
    );

    logger.debug(
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
