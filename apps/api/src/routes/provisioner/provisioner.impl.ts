/**
 * Provisioner contract implementation using oRPC
 * Implements workspace creation and provisioning
 */

import { authorizedRateLimited } from '@/api/middleware/rate-limit.orpc';
import type { EmailService } from '@/api/services/email.service';
import type { IntercomService } from '@/api/services/intercom-oauth.service';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { ZendeskService } from '@/api/services/zendesk-oauth.service';

/**
 * POST /workspace - Create a new workspace
 * Requires authentication
 * Optionally accepts an invite token for workspace creation with predetermined details
 * Sends welcome email from founder to new workspace creators
 */
export const createWorkspaceImpl = (
  provisionerService: ProvisionerService,
  emailService: EmailService
) => {
  return authorizedRateLimited.provisioner.createWorkspace.handler(async ({ input, context }) => {
    // Call the appropriate method based on the discriminated union type
    // All workspaces start on free plan - users upgrade via subscription
    const result =
      input.body.type === 'invite'
        ? await provisionerService.createWorkspaceByInviteToken({
            inviteToken: input.body.inviteToken,
            userId: context.user.id,
            userName: context.user.name,
            userEmail: context.user.email,
            userRole: context.user.role,
          })
        : await provisionerService.createWorkspaceByURL({
            url: input.body.url,
            userId: context.user.id,
            userName: context.user.name,
            userEmail: context.user.email,
            userRole: context.user.role,
          });

    // Send welcome email based on creation type
    // Only send if workspace was created (not if it already existed)
    if (result.created) {
      if (input.body.type === 'invite') {
        // Pilot user - invited with token
        await emailService.sendSafeWelcomeEmailPilot(
          { to: context.user.email },
          {
            workspaceName: result.workspaceName,
            workspaceId: result.workspaceId,
          }
        );
      } else {
        // Subscription user - organic signup without invite token
        await emailService.sendSafeWelcomeEmailSubscription(
          { to: context.user.email },
          {
            workspaceName: result.workspaceName,
            workspaceId: result.workspaceId,
          }
        );
      }
    }

    return {
      message: 'Workspace created successfully',
      data: result,
    };
  });
};

/**
 * GET /provisioner/intercom/authorize - Initiate Intercom OAuth flow
 * Returns authorization URL and state token for CSRF protection
 */
export const intercomAuthorizeImpl = (intercomService: IntercomService) => {
  return authorizedRateLimited.provisioner.intercom.authorize.handler(
    async ({ input, context }) => {
      const { authorizationUrl, state } = intercomService.generateAuthorizationUrl(
        context.user.id,
        undefined,
        input.query.source
      );

      return {
        message: 'Authorization URL generated',
        data: { authorizationUrl, state },
      };
    }
  );
};

/**
 * GET /provisioner/intercom/callback - Handle Intercom OAuth callback
 * Exchanges code for token and creates workspace (onboarding flow only)
 */
export const intercomCallbackImpl = (
  intercomService: IntercomService,
  emailService: EmailService
) => {
  return authorizedRateLimited.provisioner.intercom.callback.handler(async ({ input, context }) => {
    const result = await intercomService.handleCallback({
      code: input.query.code,
      state: input.query.state,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userRole: context.user.role,
    });

    // Send welcome email if workspace was created
    if (result.created) {
      await emailService.sendSafeWelcomeEmailSubscription(
        { to: context.user.email },
        {
          workspaceName: result.workspaceName,
          workspaceId: result.workspaceId,
        }
      );
    }

    return {
      message: 'Workspace created successfully',
      data: result,
    };
  });
};

/**
 * GET /provisioner/zendesk/authorize - Initiate Zendesk OAuth flow
 * Returns authorization URL and state token for CSRF protection
 * Requires subdomain since Zendesk OAuth is per-account
 */
export const zendeskAuthorizeImpl = (zendeskService: ZendeskService) => {
  return authorizedRateLimited.provisioner.zendesk.authorize.handler(async ({ input, context }) => {
    const { authorizationUrl, state } = zendeskService.generateAuthorizationUrl(
      context.user.id,
      input.query.subdomain,
      undefined,
      input.query.source
    );

    return {
      message: 'Authorization URL generated',
      data: { authorizationUrl, state },
    };
  });
};

/**
 * GET /provisioner/zendesk/callback - Handle Zendesk OAuth callback
 * Exchanges code for token and creates workspace (onboarding flow only)
 */
export const zendeskCallbackImpl = (zendeskService: ZendeskService, emailService: EmailService) => {
  return authorizedRateLimited.provisioner.zendesk.callback.handler(async ({ input, context }) => {
    const result = await zendeskService.handleCallback({
      code: input.query.code,
      state: input.query.state,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userRole: context.user.role,
    });

    // Send welcome email if workspace was created
    if (result.created) {
      await emailService.sendSafeWelcomeEmailSubscription(
        { to: context.user.email },
        {
          workspaceName: result.workspaceName,
          workspaceId: result.workspaceId,
        }
      );
    }

    return {
      message: 'Workspace created successfully',
      data: result,
    };
  });
};

/**
 * Create the provisioner procedures object
 */
export const createProvisionerProcedures = (
  provisionerService: ProvisionerService,
  emailService: EmailService,
  intercomService: IntercomService,
  zendeskService: ZendeskService
) => {
  return {
    createWorkspace: createWorkspaceImpl(provisionerService, emailService),
    intercom: {
      authorize: intercomAuthorizeImpl(intercomService),
      callback: intercomCallbackImpl(intercomService, emailService),
    },
    zendesk: {
      authorize: zendeskAuthorizeImpl(zendeskService),
      callback: zendeskCallbackImpl(zendeskService, emailService),
    },
  };
};
