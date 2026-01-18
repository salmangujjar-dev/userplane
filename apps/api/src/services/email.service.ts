/**
 * EmailService - Infrastructure service for sending emails
 * Uses @workspace/email package and React Email templates
 * Emails are sent from configured inboxes with sender context in content
 */

import {
  renderAccessGranted,
  renderAccessRequest,
  renderAccessRequested,
  renderAccountDeletion,
  renderAccountDeletionVerification,
  renderAccountRestored,
  renderDeletionConfirmation,
  renderDeletionRequested,
  renderDeletionScheduled,
  renderDomainDeveloperInstructions,
  renderEmailVerification,
  renderLinksRequestedUpgrade,
  renderLinksSoftLimit,
  renderMagicLink,
  renderPilotReverseTrialOffer,
  renderProjectDeletionConfirmation,
  renderProjectDeletionRequested,
  renderProjectDeletionScheduled,
  renderProjectRecoveryConfirmation,
  renderProjectRecoveryPartially,
  renderProjectRecoveryScheduled,
  renderRecordingReceived,
  renderRecordingsHardLimit,
  renderRecordingsRequestedUpgrade,
  renderRecordingsSoftLimit,
  renderRecoveryConfirmation,
  renderRecoveryPartially,
  renderRecoveryScheduled,
  renderSandboxInvite,
  renderScreenshotsSoftLimit,
  renderSeatsHardLimit,
  renderSeatsRequestedUpgrade,
  renderSeatsSoftLimit,
  renderSubscriptionActive,
  renderSubscriptionExpired,
  renderSubscriptionInactive,
  renderSubscriptionPlanChange,
  renderSubscriptionReverseTrial,
  renderTeammateInvited,
  renderTeammateJoined,
  renderTosViolation,
  renderTrialReverseTrialOffer,
} from '@workspace/email';
import { createAppLogger } from '@workspace/logger';

import { emailClient } from '@/api/clients/email';
import {
  accessRequestSubject,
  accountDeletionSubject,
  accountDeletionVerificationSubject,
  accountRestoredSubject,
  domainDeveloperInstructionsSubject,
  emailVerificationSubject,
  linksRequestedUpgradeSubject,
  linksSoftLimitSubject,
  magicLinkSubject,
  pilotReverseTrialOfferSubject,
  pilotSandboxInviteSubject,
  projectDeletionConfirmationSubject,
  projectDeletionRequestedSubject,
  projectDeletionScheduledSubject,
  projectRecoveryConfirmationSubject,
  projectRecoveryPartiallySubject,
  projectRecoveryScheduledSubject,
  recordingReceivedSubject,
  recordingsHardLimitSubject,
  recordingsRequestedUpgradeSubject,
  recordingsSoftLimitSubject,
  screenshotsSoftLimitSubject,
  seatsHardLimitSubject,
  seatsRequestedUpgradeSubject,
  seatsSoftLimitSubject,
  subscriptionActiveSubject,
  subscriptionExpiredSubject,
  subscriptionInactiveSubject,
  subscriptionPlanChangeSubject,
  subscriptionReverseTrialSubject,
  teammateInvitedSubject,
  teammateJoinedSubject,
  tosViolationSubject,
  trialReverseTrialOfferSubject,
  workspaceAccessGrantedSubject,
  workspaceAccessRequestedSubject,
  workspaceDeletionConfirmationSubject,
  workspaceDeletionRequestedSubject,
  workspaceDeletionScheduledSubject,
  workspaceRecoveryConfirmationSubject,
  workspaceRecoveryPartiallySubject,
  workspaceRecoveryScheduledSubject,
} from '@/api/subjects';
import type {
  AccessRequestEmailParams,
  AccountDeletionEmailParams,
  AccountDeletionVerificationEmailParams,
  AccountRestoredEmailParams,
  DomainDeveloperInstructionsEmailParams,
  EmailVerificationEmailParams,
  LinksRequestedUpgradeEmailParams,
  LinksSoftLimitEmailParams,
  MagicLinkEmailParams,
  PilotReverseTrialOfferEmailParams,
  PilotSandboxInviteEmailParams,
  ProjectDeletionConfirmationEmailParams,
  ProjectDeletionRequestedEmailParams,
  ProjectDeletionScheduledEmailParams,
  ProjectRecoveryConfirmationEmailParams,
  ProjectRecoveryPartiallyEmailParams,
  ProjectRecoveryScheduledEmailParams,
  RecordingReceivedEmailParams,
  RecordingsHardLimitEmailParams,
  RecordingsRequestedUpgradeEmailParams,
  RecordingsSoftLimitEmailParams,
  ScreenshotsSoftLimitEmailParams,
  SeatsHardLimitEmailParams,
  SeatsRequestedUpgradeEmailParams,
  SeatsSoftLimitEmailParams,
  SubscriptionActiveEmailParams,
  SubscriptionExpiredEmailParams,
  SubscriptionInactiveEmailParams,
  SubscriptionPlanChangeEmailParams,
  SubscriptionReverseTrialEmailParams,
  TeammateInvitedEmailParams,
  TeammateJoinedEmailParams,
  TosViolationEmailParams,
  TrialReverseTrialOfferEmailParams,
  WorkspaceAccessGrantedEmailParams,
  WorkspaceAccessRequestedEmailParams,
  WorkspaceDeletionConfirmationEmailParams,
  WorkspaceDeletionRequestedEmailParams,
  WorkspaceDeletionScheduledEmailParams,
  WorkspaceRecoveryConfirmationEmailParams,
  WorkspaceRecoveryPartiallyEmailParams,
  WorkspaceRecoveryScheduledEmailParams,
} from '@/api/types';
import {
  authFrom,
  billingFrom,
  domainFrom,
  inviteFrom,
  notificationFrom,
} from '@/api/utils/email-from';

const logger = createAppLogger('email-service');

export class EmailService {
  // ============================================================================
  // AUTH EMAILS
  // ============================================================================

  /**
   * Send email verification email
   * Sent when a user needs to verify their email address
   */
  async sendEmailVerification(params: EmailVerificationEmailParams): Promise<void> {
    const idempotencyKey = `email-verification/${params.to}/${Date.now()}`;

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
   * Send magic link email for passwordless sign in
   */
  async sendMagicLink(params: MagicLinkEmailParams): Promise<void> {
    const idempotencyKey = `magic-link/${params.to}/${Date.now()}`;

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
   * Send workspace access request email to owner
   * Uses React Email template
   * Email is sent from configured invite inbox with requester details in content
   */
  async sendAccessRequest(params: AccessRequestEmailParams): Promise<void> {
    const idempotencyKey = `access-request/${params.workspaceName}/${params.requesterEmail}/${params.to}`;

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

  // ============================================================================
  // BILLING EMAILS
  // ============================================================================

  /**
   * Send subscription active email
   */
  async sendSubscriptionActive(params: SubscriptionActiveEmailParams): Promise<void> {
    const idempotencyKey = `subscription-active/${params.to}/${params.planName}`;

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
   * Send subscription expired email
   */
  async sendSubscriptionExpired(params: SubscriptionExpiredEmailParams): Promise<void> {
    const idempotencyKey = `subscription-expired/${params.to}/${params.planName}`;

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
   * Send subscription inactive email
   */
  async sendSubscriptionInactive(params: SubscriptionInactiveEmailParams): Promise<void> {
    const idempotencyKey = `subscription-inactive/${params.to}/${params.planName}`;

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
   * Send subscription plan change email
   */
  async sendSubscriptionPlanChange(params: SubscriptionPlanChangeEmailParams): Promise<void> {
    const idempotencyKey = `subscription-plan-change/${params.to}/${params.newPlan}`;

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
   * Send subscription reverse trial email
   */
  async sendSubscriptionReverseTrial(params: SubscriptionReverseTrialEmailParams): Promise<void> {
    const idempotencyKey = `subscription-reverse-trial/${params.to}`;

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

  // ============================================================================
  // DOMAIN EMAILS
  // ============================================================================

  /**
   * Send domain developer instructions email
   * Uses React Email template and idempotency key to prevent duplicate sends
   * Email is sent from configured invite inbox
   */
  async sendDomainDeveloperInstructions(
    params: DomainDeveloperInstructionsEmailParams
  ): Promise<void> {
    const idempotencyKey = `domain-instructions/${params.domainName}/${params.to}`;

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
      },
      'Domain developer instructions sent'
    );
  }

  // ============================================================================
  // USAGE - RECORDINGS EMAILS
  // ============================================================================

  /**
   * Send recordings soft limit reached email
   */
  async sendRecordingsSoftLimit(params: RecordingsSoftLimitEmailParams): Promise<void> {
    const idempotencyKey = `recordings-soft-limit/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderRecordingsSoftLimit({
      workspaceName: params.workspaceName,
      usedMinutes: params.usedMinutes,
      totalMinutes: params.totalMinutes,
      upgradeUrl: params.upgradeUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: recordingsSoftLimitSubject(params.workspaceName),
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
        usedMinutes: params.usedMinutes,
        totalMinutes: params.totalMinutes,
        provider: emailClient.getProvider(),
      },
      'Recordings soft limit email sent'
    );
  }

  /**
   * Send recordings hard limit reached email
   */
  async sendRecordingsHardLimit(params: RecordingsHardLimitEmailParams): Promise<void> {
    const idempotencyKey = `recordings-hard-limit/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderRecordingsHardLimit({
      workspaceName: params.workspaceName,
      totalMinutes: params.totalMinutes,
      upgradeUrl: params.upgradeUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: recordingsHardLimitSubject(params.workspaceName),
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
        totalMinutes: params.totalMinutes,
        provider: emailClient.getProvider(),
      },
      'Recordings hard limit email sent'
    );
  }

  /**
   * Send recordings requested upgrade email
   */
  async sendRecordingsRequestedUpgrade(
    params: RecordingsRequestedUpgradeEmailParams
  ): Promise<void> {
    const idempotencyKey = `recordings-requested-upgrade/${params.workspaceName}/${params.requesterName}`;

    const { html, text } = await renderRecordingsRequestedUpgrade({
      workspaceName: params.workspaceName,
      requesterName: params.requesterName,
      billingUrl: params.billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: recordingsRequestedUpgradeSubject({
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
        workspaceName: params.workspaceName,
        requesterName: params.requesterName,
        provider: emailClient.getProvider(),
      },
      'Recordings requested upgrade email sent'
    );
  }

  // ============================================================================
  // USAGE - SEATS EMAILS
  // ============================================================================

  /**
   * Send seats soft limit reached email
   */
  async sendSeatsSoftLimit(params: SeatsSoftLimitEmailParams): Promise<void> {
    const idempotencyKey = `seats-soft-limit/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderSeatsSoftLimit({
      workspaceName: params.workspaceName,
      usedSeats: params.usedSeats,
      totalSeats: params.totalSeats,
      upgradeUrl: params.upgradeUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: seatsSoftLimitSubject(params.workspaceName),
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
        usedSeats: params.usedSeats,
        totalSeats: params.totalSeats,
        provider: emailClient.getProvider(),
      },
      'Seats soft limit email sent'
    );
  }

  /**
   * Send seats hard limit reached email
   */
  async sendSeatsHardLimit(params: SeatsHardLimitEmailParams): Promise<void> {
    const idempotencyKey = `seats-hard-limit/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderSeatsHardLimit({
      workspaceName: params.workspaceName,
      totalSeats: params.totalSeats,
      upgradeUrl: params.upgradeUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: seatsHardLimitSubject(params.workspaceName),
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
        totalSeats: params.totalSeats,
        provider: emailClient.getProvider(),
      },
      'Seats hard limit email sent'
    );
  }

  /**
   * Send seats requested upgrade email
   */
  async sendSeatsRequestedUpgrade(params: SeatsRequestedUpgradeEmailParams): Promise<void> {
    const idempotencyKey = `seats-requested-upgrade/${params.workspaceName}/${params.requesterName}`;

    const { html, text } = await renderSeatsRequestedUpgrade({
      workspaceName: params.workspaceName,
      requesterName: params.requesterName,
      billingUrl: params.billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: seatsRequestedUpgradeSubject({
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
        workspaceName: params.workspaceName,
        requesterName: params.requesterName,
        provider: emailClient.getProvider(),
      },
      'Seats requested upgrade email sent'
    );
  }

  // ============================================================================
  // USAGE - LINKS EMAILS
  // ============================================================================

  /**
   * Send links soft limit reached email
   */
  async sendLinksSoftLimit(params: LinksSoftLimitEmailParams): Promise<void> {
    const idempotencyKey = `links-soft-limit/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderLinksSoftLimit({
      workspaceName: params.workspaceName,
      usedLinks: params.usedLinks,
      totalLinks: params.totalLinks,
      upgradeUrl: params.upgradeUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: linksSoftLimitSubject(params.workspaceName),
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
        usedLinks: params.usedLinks,
        totalLinks: params.totalLinks,
        provider: emailClient.getProvider(),
      },
      'Links soft limit email sent'
    );
  }

  /**
   * Send links requested upgrade email
   */
  async sendLinksRequestedUpgrade(params: LinksRequestedUpgradeEmailParams): Promise<void> {
    const idempotencyKey = `links-requested-upgrade/${params.workspaceName}/${params.requesterName}`;

    const { html, text } = await renderLinksRequestedUpgrade({
      workspaceName: params.workspaceName,
      requesterName: params.requesterName,
      billingUrl: params.billingUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: linksRequestedUpgradeSubject({
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
        workspaceName: params.workspaceName,
        requesterName: params.requesterName,
        provider: emailClient.getProvider(),
      },
      'Links requested upgrade email sent'
    );
  }

  // ============================================================================
  // USAGE - SCREENSHOTS EMAILS
  // ============================================================================

  /**
   * Send screenshots soft limit reached email
   */
  async sendScreenshotsSoftLimit(params: ScreenshotsSoftLimitEmailParams): Promise<void> {
    const idempotencyKey = `screenshots-soft-limit/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderScreenshotsSoftLimit({
      workspaceName: params.workspaceName,
      usedScreenshots: params.usedScreenshots,
      totalScreenshots: params.totalScreenshots,
      upgradeUrl: params.upgradeUrl,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: screenshotsSoftLimitSubject(params.workspaceName),
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
        usedScreenshots: params.usedScreenshots,
        totalScreenshots: params.totalScreenshots,
        provider: emailClient.getProvider(),
      },
      'Screenshots soft limit email sent'
    );
  }

  // ============================================================================
  // INVITE EMAILS
  // ============================================================================

  /**
   * Send teammate invited email
   */
  async sendTeammateInvited(params: TeammateInvitedEmailParams): Promise<void> {
    const idempotencyKey = `teammate-invited/${params.workspaceName}/${params.to}`;

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
      },
      'Teammate invited email sent'
    );
  }

  /**
   * Send teammate joined email
   * Sent to workspace owners when someone joins
   */
  async sendTeammateJoined(params: TeammateJoinedEmailParams): Promise<void> {
    const idempotencyKey = `teammate-joined/${params.workspaceName}/${params.to}/${params.memberEmail}`;

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
      },
      'Teammate joined email sent'
    );
  }

  // ============================================================================
  // OFFBOARDING EMAILS
  // ============================================================================

  /**
   * Send account deletion email
   */
  async sendAccountDeletion(params: AccountDeletionEmailParams): Promise<void> {
    const idempotencyKey = `account-deletion/${params.to}`;

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
   * Send account deletion verification email
   * Sent when a user requests to delete their account
   */
  async sendAccountDeletionVerification(
    params: AccountDeletionVerificationEmailParams
  ): Promise<void> {
    const idempotencyKey = `account-deletion-verification/${params.to}/${Date.now()}`;

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
   * Send account restored email
   */
  async sendAccountRestored(params: AccountRestoredEmailParams): Promise<void> {
    const idempotencyKey = `account-restored/${params.to}`;

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
   * Send TOS violation email
   */
  async sendTosViolation(params: TosViolationEmailParams): Promise<void> {
    const idempotencyKey = `tos-violation/${params.to}`;

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

  // ============================================================================
  // PILOT EMAILS
  // ============================================================================

  /**
   * Send pilot sandbox invite email
   * Supports optional scheduling via scheduledAt field in params
   */
  async sendPilotSandboxInvite(params: PilotSandboxInviteEmailParams): Promise<void> {
    const idempotencyKey = `pilot-sandbox-invite/${params.to}${params.scheduledAt ? `/${params.scheduledAt}` : ''}`;

    const { html, text } = await renderSandboxInvite({
      sandboxUrl: params.sandboxUrl,
      expiresInDays: params.expiresInDays,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: pilotSandboxInviteSubject,
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
   * Send pilot reverse trial offer email
   */
  async sendPilotReverseTrialOffer(params: PilotReverseTrialOfferEmailParams): Promise<void> {
    const idempotencyKey = `pilot-reverse-trial-offer/${params.to}`;

    const { html, text } = await renderPilotReverseTrialOffer({
      upgradeUrl: params.upgradeUrl,
      planName: params.planName,
      trialDays: params.trialDays,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: pilotReverseTrialOfferSubject,
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
      'Pilot reverse trial offer email sent'
    );
  }

  // ============================================================================
  // RECORDING EMAILS
  // ============================================================================

  /**
   * Send recording received email
   */
  async sendRecordingReceived(params: RecordingReceivedEmailParams): Promise<void> {
    const idempotencyKey = `recording-received/${params.to}/${params.recordingUrl}`;

    const { html, text } = await renderRecordingReceived({
      recordingTitle: params.recordingTitle,
      recordingUrl: params.recordingUrl,
      submittedAt: params.submittedAt,
      duration: params.duration,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: recordingReceivedSubject(params.recordingTitle),
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
        recordingTitle: params.recordingTitle,
        provider: emailClient.getProvider(),
      },
      'Recording received email sent'
    );
  }

  // ============================================================================
  // TRIAL EMAILS
  // ============================================================================

  /**
   * Send trial reverse trial offer email
   */
  async sendTrialReverseTrialOffer(params: TrialReverseTrialOfferEmailParams): Promise<void> {
    const idempotencyKey = `trial-reverse-trial-offer/${params.to}`;

    const { html, text } = await renderTrialReverseTrialOffer({
      upgradeUrl: params.upgradeUrl,
      planName: params.planName,
      trialDays: params.trialDays,
      remainingDays: params.remainingDays,
    });

    await emailClient.send(
      {
        from: billingFrom(),
        to: params.to,
        subject: trialReverseTrialOfferSubject(params.remainingDays),
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
        remainingDays: params.remainingDays,
        provider: emailClient.getProvider(),
      },
      'Trial reverse trial offer email sent'
    );
  }

  // ============================================================================
  // WORKSPACE EMAILS
  // ============================================================================

  /**
   * Send workspace access granted email
   */
  async sendWorkspaceAccessGranted(params: WorkspaceAccessGrantedEmailParams): Promise<void> {
    const idempotencyKey = `workspace-access-granted/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderAccessGranted({
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: inviteFrom(params.workspaceName),
        to: params.to,
        subject: workspaceAccessGrantedSubject(params.workspaceName),
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
      'Workspace access granted email sent'
    );
  }

  /**
   * Send workspace access requested email
   */
  async sendWorkspaceAccessRequested(params: WorkspaceAccessRequestedEmailParams): Promise<void> {
    const idempotencyKey = `workspace-access-requested/${params.workspaceName}/${params.requesterEmail}`;

    const { html, text } = await renderAccessRequested({
      workspaceName: params.workspaceName,
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      reviewUrl: params.reviewUrl,
    });

    await emailClient.send(
      {
        from: inviteFrom(params.workspaceName),
        to: params.to,
        subject: workspaceAccessRequestedSubject({
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
        workspaceName: params.workspaceName,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        provider: emailClient.getProvider(),
      },
      'Workspace access requested email sent'
    );
  }

  /**
   * Send workspace deletion scheduled email
   */
  async sendWorkspaceDeletionScheduled(
    params: WorkspaceDeletionScheduledEmailParams
  ): Promise<void> {
    const idempotencyKey = `workspace-deletion-scheduled/${params.workspaceName}/${params.to}`;

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
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        workspaceName: params.workspaceName,
        deletionDate: params.deletionDate,
        provider: emailClient.getProvider(),
      },
      'Workspace deletion scheduled email sent'
    );
  }

  /**
   * Send workspace deletion requested email
   */
  async sendWorkspaceDeletionRequested(
    params: WorkspaceDeletionRequestedEmailParams
  ): Promise<void> {
    const idempotencyKey = `workspace-deletion-requested/${params.workspaceName}/${params.requesterEmail}/${params.to}`;

    const { html, text } = await renderDeletionRequested({
      workspaceName: params.workspaceName,
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      deletionDate: params.deletionDate,
      cancelUrl: params.cancelUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: workspaceDeletionRequestedSubject({
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
        workspaceName: params.workspaceName,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        deletionDate: params.deletionDate,
        provider: emailClient.getProvider(),
      },
      'Workspace deletion requested email sent'
    );
  }

  /**
   * Send workspace deletion confirmation email
   */
  async sendWorkspaceDeletionConfirmation(
    params: WorkspaceDeletionConfirmationEmailParams
  ): Promise<void> {
    const idempotencyKey = `workspace-deletion-confirmation/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderDeletionConfirmation({
      workspaceName: params.workspaceName,
      feedbackUrl: params.feedbackUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: workspaceDeletionConfirmationSubject(params.workspaceName),
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
      'Workspace deletion confirmation email sent'
    );
  }

  /**
   * Send workspace recovery scheduled email
   */
  async sendWorkspaceRecoveryScheduled(
    params: WorkspaceRecoveryScheduledEmailParams
  ): Promise<void> {
    const idempotencyKey = `workspace-recovery-scheduled/${params.workspaceName}/${params.to}`;

    const { html, text } = await renderRecoveryScheduled({
      workspaceName: params.workspaceName,
      dashboardUrl: params.dashboardUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: workspaceRecoveryScheduledSubject(params.workspaceName),
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
      'Workspace recovery scheduled email sent'
    );
  }

  /**
   * Send workspace recovery confirmation email
   */
  async sendWorkspaceRecoveryConfirmation(
    params: WorkspaceRecoveryConfirmationEmailParams
  ): Promise<void> {
    const idempotencyKey = `workspace-recovery-confirmation/${params.workspaceName}/${params.to}`;

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
      'Workspace recovery confirmation email sent'
    );
  }

  /**
   * Send workspace recovery partially email
   */
  async sendWorkspaceRecoveryPartially(
    params: WorkspaceRecoveryPartiallyEmailParams
  ): Promise<void> {
    const idempotencyKey = `workspace-recovery-partially/${params.workspaceName}/${params.to}`;

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
      'Workspace recovery partially email sent'
    );
  }

  // ============================================================================
  // PROJECT EMAILS
  // ============================================================================

  /**
   * Send project deletion scheduled email
   */
  async sendProjectDeletionScheduled(params: ProjectDeletionScheduledEmailParams): Promise<void> {
    const idempotencyKey = `project-deletion-scheduled/${params.projectName}/${params.to}`;

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
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        projectName: params.projectName,
        deletionDate: params.deletionDate,
        provider: emailClient.getProvider(),
      },
      'Project deletion scheduled email sent'
    );
  }

  /**
   * Send project deletion requested email
   */
  async sendProjectDeletionRequested(params: ProjectDeletionRequestedEmailParams): Promise<void> {
    const idempotencyKey = `project-deletion-requested/${params.projectName}/${params.requesterEmail}/${params.to}`;

    const { html, text } = await renderProjectDeletionRequested({
      projectName: params.projectName,
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      deletionDate: params.deletionDate,
      cancelUrl: params.cancelUrl,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: projectDeletionRequestedSubject({
          requesterName: params.requesterName,
          projectName: params.projectName,
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
        projectName: params.projectName,
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        deletionDate: params.deletionDate,
        provider: emailClient.getProvider(),
      },
      'Project deletion requested email sent'
    );
  }

  /**
   * Send project deletion confirmation email
   */
  async sendProjectDeletionConfirmation(
    params: ProjectDeletionConfirmationEmailParams
  ): Promise<void> {
    const idempotencyKey = `project-deletion-confirmation/${params.projectName}/${params.to}`;

    const { html, text } = await renderProjectDeletionConfirmation({
      projectName: params.projectName,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: projectDeletionConfirmationSubject(params.projectName),
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
        projectName: params.projectName,
        provider: emailClient.getProvider(),
      },
      'Project deletion confirmation email sent'
    );
  }

  /**
   * Send project recovery scheduled email
   */
  async sendProjectRecoveryScheduled(params: ProjectRecoveryScheduledEmailParams): Promise<void> {
    const idempotencyKey = `project-recovery-scheduled/${params.projectName}/${params.to}`;

    const { html, text } = await renderProjectRecoveryScheduled({
      projectName: params.projectName,
    });

    await emailClient.send(
      {
        from: notificationFrom(),
        to: params.to,
        subject: projectRecoveryScheduledSubject(params.projectName),
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
        projectName: params.projectName,
        provider: emailClient.getProvider(),
      },
      'Project recovery scheduled email sent'
    );
  }

  /**
   * Send project recovery confirmation email
   */
  async sendProjectRecoveryConfirmation(
    params: ProjectRecoveryConfirmationEmailParams
  ): Promise<void> {
    const idempotencyKey = `project-recovery-confirmation/${params.projectName}/${params.to}`;

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
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        projectName: params.projectName,
        provider: emailClient.getProvider(),
      },
      'Project recovery confirmation email sent'
    );
  }

  /**
   * Send project recovery partially email
   */
  async sendProjectRecoveryPartially(params: ProjectRecoveryPartiallyEmailParams): Promise<void> {
    const idempotencyKey = `project-recovery-partially/${params.projectName}/${params.to}`;

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
      },
      {
        idempotencyKey,
      }
    );

    logger.info(
      {
        to: params.to,
        projectName: params.projectName,
        provider: emailClient.getProvider(),
      },
      'Project recovery partially email sent'
    );
  }
}

export const emailService = new EmailService();
