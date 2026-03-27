/**
 * SlackCanvasService - Business logic for Slack integration interactions
 *
 * Handles all Slack surface areas:
 * - App Home tab (app_home_opened event)
 * - Slash commands (/userplane)
 * - Block actions (button clicks in home tab)
 * - Modal view submissions (link creation form)
 * - App lifecycle events (uninstall, token revocation)
 *
 * Features:
 * - Cache-first integration lookup with graceful degradation
 * - Structured logging with Pino
 * - PostHog error tracking
 */

import { ORPCError } from '@orpc/server';
import type { CacheService } from '@userplane/cache';
import { createLinkProviderData } from '@userplane/contract';
import { z } from 'zod';

import { getUserInfo, openModal, postMessage, publishView } from '@/api/clients/slack';
import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import {
  buildAccessRequiredView,
  buildErrorEphemeral,
  buildErrorModalView,
  buildHomeTabConnectedView,
  buildHomeTabDisconnectedView,
  buildHomeTabNotMemberView,
  buildLimitExceededView,
  buildLinkCreatedMessage,
  buildLinkCreatorModal,
  buildLinkSuccessView,
  SlackActionIds,
  SlackBlockIds,
  SlackCallbackIds,
  slackCanvasUrls,
} from '@/api/lib/slack-blocks';
import { captureException } from '@/api/posthog';
import type { DomainRepository } from '@/api/repositories/domains.repository';
import type {
  IntegrationRepository,
  TypedIntegration,
} from '@/api/repositories/integrations.repository';
import { IntegrationHelper } from '@/api/repositories/integrations.repository';
import type { ProjectRepository } from '@/api/repositories/projects.repository';
import type { UserRepository } from '@/api/repositories/users.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { LinkService } from '@/api/services/link.service';

// =============================================================================
// Service Dependencies & Types
// =============================================================================

const logger = createLogger('slack-canvas-service');

export interface SlackCanvasServiceDeps {
  integrationRepo: IntegrationRepository;
  userRepo: UserRepository;
  workspaceMemberRepo: WorkspaceMemberRepository;
  linkService: LinkService;
  projectRepo: ProjectRepository;
  domainRepo: DomainRepository;
  entitlementService: EntitlementService;
  workspaceRepo: WorkspaceRepository;
  cacheService: CacheService;
}

/**
 * Slash command payload — built from URL-encoded form fields in the command handler.
 */
export interface SlackSlashCommandPayload {
  command: string;
  text: string;
  triggerId: string;
  userId: string;
  teamId: string;
  channelId: string;
  channelName: string;
  responseUrl: string;
  enterpriseId?: string;
}

/**
 * Zod schema for Slack Events API wrapper.
 * Validates the outer envelope; individual event types are checked at runtime.
 */
export const SlackEventEnvelopeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('url_verification'),
    challenge: z.string(),
  }),
  z.object({
    type: z.literal('event_callback'),
    team_id: z.string(),
    event: z.object({
      type: z.string(),
      user: z.string().optional(),
      tab: z.string().optional(),
      tokens: z
        .object({
          oauth: z.array(z.string()).optional(),
          bot: z.array(z.string()).optional(),
        })
        .optional(),
    }),
  }),
]);
export type SlackEventEnvelope = z.infer<typeof SlackEventEnvelopeSchema>;

/**
 * Zod schema for block_actions interactive payload.
 */
export const SlackBlockActionPayloadSchema = z.object({
  type: z.literal('block_actions'),
  trigger_id: z.string(),
  user: z.object({ id: z.string(), team_id: z.string() }),
  actions: z.array(
    z.object({
      action_id: z.string(),
      value: z.string().optional(),
    })
  ),
  view: z.object({ id: z.string() }).optional(),
});
export type SlackBlockActionPayload = z.infer<typeof SlackBlockActionPayloadSchema>;

/**
 * Zod schema for view_submission interactive payload.
 */
export const SlackViewSubmissionPayloadSchema = z.object({
  type: z.literal('view_submission'),
  user: z.object({ id: z.string(), team_id: z.string() }),
  view: z.object({
    id: z.string(),
    callback_id: z.string(),
    private_metadata: z.string(),
    state: z.object({
      values: z.record(
        z.record(
          z.object({
            type: z.string(),
            selected_option: z.object({ value: z.string() }).optional(),
            value: z.string().nullable().optional(),
          })
        )
      ),
    }),
  }),
});
export type SlackViewSubmissionPayload = z.infer<typeof SlackViewSubmissionPayloadSchema>;

/**
 * Zod schema for the interactive payload discriminator.
 * The handler parses the raw JSON, then validates with this.
 */
export const SlackInteractivePayloadSchema = z.discriminatedUnion('type', [
  SlackBlockActionPayloadSchema,
  SlackViewSubmissionPayloadSchema,
  z.object({ type: z.literal('view_closed') }),
]);

/**
 * Verified workspace context after access check
 */
interface VerifiedSlackContext {
  workspaceId: string;
  workspaceMemberId: string;
  userName: string;
  integration: TypedIntegration<'slack'>;
}

/**
 * Result of user access verification
 */
type SlackAccessResult =
  | { status: 'granted'; context: VerifiedSlackContext }
  | { status: 'user_not_found' }
  | { status: 'integration_not_found' }
  | { status: 'not_workspace_member'; integration: TypedIntegration<'slack'> };

/**
 * Private metadata stored in modal views.
 * Validated with Zod on deserialization to avoid unsafe casts.
 */
const ModalPrivateMetadataSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  teamId: z.string(),
  workspaceId: z.string(),
});
type ModalPrivateMetadata = z.infer<typeof ModalPrivateMetadataSchema>;

// =============================================================================
// Service Implementation
// =============================================================================

export class SlackCanvasService {
  constructor(private deps: SlackCanvasServiceDeps) {}

  // ===========================================================================
  // App Home
  // ===========================================================================

  /**
   * Handle app_home_opened event
   *
   * Publishes the appropriate home tab view based on integration status
   * and user membership.
   */
  async handleAppHomeOpened(teamId: string, slackUserId: string): Promise<void> {
    const dashboardUrl = env.dashboard.baseUrl;

    // Look up integration by team_id
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);

    if (!integration) {
      // Cannot publish a home tab view without a valid bot token.
      // Slack will show the default empty home tab for disconnected workspaces.
      logger.debug({ teamId, slackUserId }, 'No integration found for app home');
      return;
    }

    const accessToken = IntegrationHelper.getAccessToken(integration);

    // Get Slack user email
    const slackUser = await getUserInfo(accessToken, slackUserId);
    if (!slackUser?.profile.email) {
      logger.debug({ teamId, slackUserId }, 'Could not retrieve Slack user email');
      await publishView(accessToken, slackUserId, buildHomeTabDisconnectedView({ dashboardUrl }));
      return;
    }

    // Find Userplane user by email
    const user = await this.deps.userRepo.findByEmail(slackUser.profile.email);
    if (!user) {
      logger.debug({ teamId, email: slackUser.profile.email }, 'Userplane user not found');
      await publishView(accessToken, slackUserId, buildHomeTabDisconnectedView({ dashboardUrl }));
      return;
    }

    // Check workspace membership
    const member = await this.deps.workspaceMemberRepo.findByUserAndWorkspace(
      user.id,
      integration.workspaceId
    );

    if (!member) {
      logger.debug(
        { teamId, email: slackUser.profile.email, workspaceId: integration.workspaceId },
        'User is not a workspace member'
      );
      await publishView(accessToken, slackUserId, buildHomeTabNotMemberView());
      return;
    }

    // Get workspace info for display
    const workspace = await this.deps.workspaceRepo.findById(integration.workspaceId);
    const workspaceName = workspace?.workspaceName ?? 'Your Workspace';

    await publishView(
      accessToken,
      slackUserId,
      buildHomeTabConnectedView({
        workspaceName,
        dashboardUrl: `${dashboardUrl}/workspace/${integration.workspaceId}`,
        workspaceId: integration.workspaceId,
        workspaceMemberId: member.workspaceMemberId,
      })
    );

    logger.debug(
      { teamId, slackUserId, workspaceId: integration.workspaceId },
      'Published connected home tab'
    );
  }

  // ===========================================================================
  // Slash Command
  // ===========================================================================

  /**
   * Handle /userplane slash command
   *
   * Verifies user access, fetches projects/domains, and opens the link
   * creation modal. Returns an ephemeral error message if verification fails,
   * or null when the modal opens successfully (Slack shows the modal directly).
   *
   * Important: The 3-second deadline means we must open the modal quickly.
   */
  async handleSlashCommand(
    payload: SlackSlashCommandPayload
  ): Promise<ReturnType<typeof buildErrorEphemeral> | null> {
    const { teamId, userId: slackUserId, triggerId, channelId, channelName } = payload;

    // Verify user access
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId);

    if (accessResult.status !== 'granted') {
      // Open a rich access required modal instead of a text error
      if (accessResult.status === 'not_workspace_member' && accessResult.integration) {
        const accessToken = IntegrationHelper.getAccessToken(accessResult.integration);
        const opened = await openModal(accessToken, triggerId, buildAccessRequiredView());
        if (!opened) {
          return buildErrorEphemeral('Unable to open the access request form. Please try again.');
        }
        return null;
      }
      return this.buildAccessDeniedEphemeral(accessResult);
    }

    const { workspaceId, integration, userName } = accessResult.context;
    const accessToken = IntegrationHelper.getAccessToken(integration);

    // Check link capacity
    const hasRoom = await this.deps.entitlementService.hasCapacity(workspaceId, 'links');
    if (!hasRoom) {
      const opened = await openModal(
        accessToken,
        triggerId,
        buildLimitExceededView({ workspaceId, limitType: 'links' })
      );
      if (!opened) {
        return buildErrorEphemeral(
          'You have reached your plan limit for links. Please upgrade your plan.'
        );
      }
      return null;
    }

    // Get dropdown options
    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    if (projects.length === 0 || domains.length === 0) {
      return buildErrorEphemeral(
        'No projects or domains found. Please set up a project and domain in the Userplane dashboard first.'
      );
    }

    // Build modal with private metadata
    const privateMetadata: ModalPrivateMetadata = {
      channelId,
      channelName,
      teamId,
      workspaceId,
    };

    const modal = buildLinkCreatorModal({ projects, domains, userName });
    const modalWithMetadata = {
      ...modal,
      private_metadata: JSON.stringify(privateMetadata),
    };

    // Open modal immediately to stay within 3-second deadline
    const opened = await openModal(accessToken, triggerId, modalWithMetadata);
    if (!opened) {
      return buildErrorEphemeral('Failed to open the link creation form. Please try again.');
    }

    // Return null - modal is shown directly by Slack
    return null;
  }

  // ===========================================================================
  // Block Actions
  // ===========================================================================

  /**
   * Handle block_actions from home tab button clicks
   *
   * Routes to the appropriate handler based on action_id.
   * Currently supports the "Create Link" button which opens the link creation modal.
   */
  async handleBlockAction(payload: SlackBlockActionPayload): Promise<void> {
    const { trigger_id: triggerId, user, actions } = payload;
    const teamId = user.team_id;
    const slackUserId = user.id;

    for (const action of actions) {
      switch (action.action_id) {
        case SlackActionIds.CREATE_LINK: {
          // Verify user access
          const accessResult = await this.verifySlackUserAccess(teamId, slackUserId);

          if (accessResult.status !== 'granted') {
            logger.debug(
              { teamId, slackUserId, status: accessResult.status },
              'Block action access denied'
            );
            return;
          }

          const { workspaceId, userName, integration } = accessResult.context;
          const accessToken = IntegrationHelper.getAccessToken(integration);

          // Check link capacity
          const hasRoom = await this.deps.entitlementService.hasCapacity(workspaceId, 'links');
          if (!hasRoom) {
            logger.debug({ workspaceId }, 'Block action: plan limit exceeded');
            // Post error as DM since block actions from home tab have no channel
            const errMsg = buildErrorEphemeral(
              'You have reached your plan limit for links. Please upgrade your plan.'
            );
            await postMessage(accessToken, slackUserId, errMsg.blocks, errMsg.text);
            return;
          }

          // Get dropdown options
          const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
          if (projects.length === 0 || domains.length === 0) {
            logger.warn({ workspaceId }, 'Block action: no projects or domains');
            const errMsg = buildErrorEphemeral(
              'No projects or domains found. Please set up a project and domain in the dashboard first.'
            );
            await postMessage(accessToken, slackUserId, errMsg.blocks, errMsg.text);
            return;
          }

          // Build and open modal
          // Note: Block actions from home tab don't have a channel context,
          // so we use empty strings for channelId/channelName
          const privateMetadata: ModalPrivateMetadata = {
            channelId: '',
            channelName: '',
            teamId,
            workspaceId,
          };

          const modal = buildLinkCreatorModal({ projects, domains, userName });
          const modalWithMetadata = {
            ...modal,
            private_metadata: JSON.stringify(privateMetadata),
          };

          const opened = await openModal(accessToken, triggerId, modalWithMetadata);
          if (!opened) {
            const errMsg = buildErrorEphemeral(
              'Failed to open the link creation form. Please try again.'
            );
            await postMessage(accessToken, slackUserId, errMsg.blocks, errMsg.text);
          }
          break;
        }

        default:
          logger.warn({ actionId: action.action_id, teamId }, 'Unknown block action');
          break;
      }
    }
  }

  // ===========================================================================
  // View Submission
  // ===========================================================================

  /**
   * Handle modal view submission (link creation form)
   *
   * Parses form values, creates the link, posts a message to the channel,
   * and returns an updated modal showing success.
   */
  async handleViewSubmission(payload: SlackViewSubmissionPayload): Promise<{
    response_action: 'update';
    view:
      | ReturnType<typeof buildLinkSuccessView>
      | ReturnType<typeof buildErrorModalView>
      | ReturnType<typeof buildLimitExceededView>;
  } | null> {
    const { view, user } = payload;

    if (view.callback_id !== SlackCallbackIds.CREATE_LINK_MODAL) {
      logger.warn({ callbackId: view.callback_id }, 'Unknown view submission callback_id');
      return null;
    }

    // Parse form values from view state
    const values = view.state.values;
    const linkTitle =
      values[SlackBlockIds.LINK_REFERENCE]?.[SlackActionIds.LINK_REFERENCE_INPUT]?.value ||
      undefined;
    const projectId =
      values[SlackBlockIds.PROJECT]?.[SlackActionIds.SELECT_PROJECT]?.selected_option?.value;
    const domainId =
      values[SlackBlockIds.DOMAIN]?.[SlackActionIds.SELECT_DOMAIN]?.selected_option?.value;
    const customMessage =
      values[SlackBlockIds.CUSTOM_MESSAGE]?.[SlackActionIds.CUSTOM_MESSAGE_INPUT]?.value ||
      undefined;

    if (!projectId || !domainId) {
      logger.warn('View submission missing required fields (projectId or domainId)');
      captureException(new Error('view submission missing required fields'), undefined, {
        operation: 'slack_view_submission',
        values,
      });
      return null;
    }

    // Parse and validate private metadata
    let rawMetadata: unknown;
    try {
      rawMetadata = JSON.parse(view.private_metadata);
    } catch {
      logger.warn(
        { privateMetadata: view.private_metadata },
        'Failed to parse private_metadata JSON'
      );
      return null;
    }

    const metadataResult = ModalPrivateMetadataSchema.safeParse(rawMetadata);
    if (!metadataResult.success) {
      logger.warn({ errors: metadataResult.error.flatten() }, 'Invalid private_metadata structure');
      captureException(new Error('invalid modal private_metadata'), undefined, {
        operation: 'slack_view_submission',
        private_metadata: view.private_metadata,
      });
      return null;
    }

    const { channelId, channelName, teamId, workspaceId } = metadataResult.data;

    // Look up integration and verify user
    const accessResult = await this.verifySlackUserAccess(teamId, user.id);
    if (accessResult.status !== 'granted') {
      logger.warn(
        { teamId, slackUserId: user.id, status: accessResult.status },
        'View submission access denied'
      );
      return {
        response_action: 'update',
        view: buildErrorModalView(
          'You do not have access to this workspace. Please contact a workspace admin.'
        ),
      };
    }

    const { workspaceMemberId, integration } = accessResult.context;
    const accessToken = IntegrationHelper.getAccessToken(integration);

    try {
      // Create link with provider data
      const link = await this.deps.linkService.createWithProvider({
        workspaceId,
        projectId,
        domainId,
        createdBy: workspaceMemberId,
        linkReusable: false,
        linkProviderType: 'slack',
        linkTitle: linkTitle || undefined,
        linkProviderId: channelId || null,
        linkProviderRef: channelId ? `slack://channel?team=${teamId}&id=${channelId}` : null,
        linkProviderData: createLinkProviderData('slack', {
          channelId: channelId || undefined,
          channelName: channelName || undefined,
          userId: user.id,
          meta: undefined,
        }),
      });

      const linkUrl = this.deps.linkService.generateLinkURL(
        link.linkId,
        link.workspaceId,
        link.domainUrl,
        link.domainStatus,
        link.recordingHideSensitive,
        link.recordingCaptureClientLog,
        false,
        link.recordingCaptureServerLog,
        link.recordingCaptureNetworkLog
      );

      logger.debug(
        { workspaceId, linkId: link.linkId, channelId },
        'Link created successfully (Slack)'
      );

      // Get project name for the success view and channel message
      const project = await this.deps.projectRepo.findById(projectId);
      const projectName = project?.projectTitle ?? 'Unknown Project';

      // Post link message to channel if we have a channel context
      if (channelId) {
        // Get Slack user info for creator display name
        const slackUser = await getUserInfo(accessToken, user.id);
        const createdBy = slackUser?.profile.display_name || slackUser?.real_name || 'Unknown';

        const message = buildLinkCreatedMessage({
          linkUrl,
          projectName,
          createdBy,
          customMessage,
          dashboardUrl: slackCanvasUrls.recordingsUrl(workspaceId),
        });

        await postMessage(accessToken, channelId, message.blocks, message.text);
      }

      // Return updated modal showing success
      return {
        response_action: 'update',
        view: buildLinkSuccessView({ linkUrl, projectName }),
      };
    } catch (error) {
      // Handle expected business errors (ORPCError has a `code` property)
      if (error instanceof ORPCError && error.code === 'PLAN_LIMIT_EXCEEDED') {
        logger.debug({ workspaceId }, 'Link creation failed: plan limit exceeded');
        return {
          response_action: 'update',
          view: buildLimitExceededView({ workspaceId, limitType: 'links' }),
        };
      }

      // Unexpected error
      logger.error({ err: error, workspaceId }, 'Link creation failed unexpectedly');
      captureException(error, undefined, {
        component: 'slack_canvas',
        operation: 'link_creation',
        workspace_id: workspaceId,
      });

      return {
        response_action: 'update',
        view: buildErrorModalView(
          'Something went wrong while creating the link. Please try again.'
        ),
      };
    }
  }

  // ===========================================================================
  // App Lifecycle Events
  // ===========================================================================

  /**
   * Handle app_uninstalled event
   *
   * Soft-deletes the integration and invalidates caches.
   */
  async handleAppUninstalled(teamId: string): Promise<void> {
    logger.debug({ teamId }, 'App uninstalled event received');

    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);

    if (!integration) {
      logger.warn({ teamId }, 'No active integration found for uninstall, ignoring');
      return;
    }

    // Soft-delete the integration
    const deleted = await this.deps.integrationRepo.delete(integration.workspaceId, 'slack');

    if (!deleted) {
      logger.warn(
        { teamId, workspaceId: integration.workspaceId },
        'Integration already deleted during uninstall'
      );
      return;
    }

    // Invalidate caches
    await this.deps.cacheService.invalidateIntegration('slack', teamId);

    logger.debug(
      { teamId, workspaceId: integration.workspaceId },
      'Integration disconnected via app_uninstalled event'
    );
  }

  /**
   * Handle tokens_revoked event
   *
   * Only disconnects when bot tokens are revoked.
   * User (oauth) token revocations are logged but do not trigger disconnect
   * since the bot token may still be valid.
   */
  async handleTokensRevoked(
    teamId: string,
    tokens: { oauth?: string[]; bot?: string[] }
  ): Promise<void> {
    logger.debug({ teamId, tokens }, 'Tokens revoked event received');

    // Only disconnect when bot tokens are revoked
    if (!tokens.bot || tokens.bot.length === 0) {
      logger.debug({ teamId }, 'Only user tokens revoked, bot still active — skipping disconnect');
      return;
    }

    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);

    if (!integration) {
      logger.warn({ teamId }, 'No active integration found for token revocation, ignoring');
      return;
    }

    // Soft-delete the integration
    const deleted = await this.deps.integrationRepo.delete(integration.workspaceId, 'slack');

    if (!deleted) {
      logger.warn(
        { teamId, workspaceId: integration.workspaceId },
        'Integration already deleted during token revocation'
      );
      return;
    }

    // Invalidate caches
    await this.deps.cacheService.invalidateIntegration('slack', teamId);

    logger.debug(
      { teamId, workspaceId: integration.workspaceId },
      'Integration disconnected via tokens_revoked event'
    );
  }

  // ===========================================================================
  // Private: Access Verification
  // ===========================================================================

  /**
   * Verify that a Slack user is a member of the connected Userplane workspace
   *
   * Unlike Intercom (which gets the email from the webhook payload and can skip the DB
   * call on cache hit), Slack requires the access token to call users.info for the email.
   * The token lives in the full integration record, so we always need the DB lookup.
   */
  private async verifySlackUserAccess(
    teamId: string,
    slackUserId: string
  ): Promise<SlackAccessResult> {
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);

    if (!integration) {
      return { status: 'integration_not_found' };
    }

    const accessToken = IntegrationHelper.getAccessToken(integration);

    // Get Slack user email
    const slackUser = await getUserInfo(accessToken, slackUserId);
    if (!slackUser?.profile.email) {
      logger.debug({ teamId, slackUserId }, 'Could not retrieve Slack user email');
      return { status: 'user_not_found' };
    }

    // Find Userplane user by email
    const user = await this.deps.userRepo.findByEmail(slackUser.profile.email);
    if (!user) {
      logger.debug({ email: slackUser.profile.email }, 'Userplane user not found');
      return { status: 'user_not_found' };
    }

    // Find workspace member
    const member = await this.deps.workspaceMemberRepo.findByUserAndWorkspace(
      user.id,
      integration.workspaceId
    );

    if (!member) {
      logger.debug(
        { email: slackUser.profile.email, workspaceId: integration.workspaceId },
        'User is not a workspace member'
      );
      return { status: 'not_workspace_member', integration };
    }

    // Resolve display name for personalization
    const userName =
      slackUser.profile.real_name ||
      slackUser.profile.display_name ||
      slackUser.real_name ||
      slackUser.name ||
      'Your team';

    return {
      status: 'granted',
      context: {
        workspaceId: integration.workspaceId,
        workspaceMemberId: member.workspaceMemberId,
        userName,
        integration,
      },
    };
  }

  // ===========================================================================
  // Private: Error Helpers
  // ===========================================================================

  /**
   * Build appropriate ephemeral error message when user access is denied
   */
  private buildAccessDeniedEphemeral(
    result: Exclude<SlackAccessResult, { status: 'granted' }>
  ): ReturnType<typeof buildErrorEphemeral> {
    switch (result.status) {
      case 'user_not_found':
        return buildErrorEphemeral(
          'Your Slack account is not linked to a Userplane account. Please sign up at userplane.com first.'
        );
      case 'integration_not_found':
        return buildErrorEphemeral(
          'This Slack workspace is not connected to Userplane. Please connect it from the Userplane dashboard.'
        );
      case 'not_workspace_member':
        return buildErrorEphemeral(
          'You are not a member of the connected Userplane workspace. Please ask a workspace admin to add you.'
        );
    }
  }

  /**
   * Get projects and domains for a workspace
   */
  private async getProjectsAndDomains(workspaceId: string): Promise<{
    projects: Array<{ id: string; name: string }>;
    domains: Array<{ id: string; domain: string }>;
  }> {
    const [projectRows, domainRows] = await Promise.all([
      this.deps.projectRepo.findByWorkspace(workspaceId),
      this.deps.domainRepo.findByWorkspaceId(workspaceId),
    ]);

    return {
      projects: projectRows.map((p) => ({ id: p.projectId, name: p.projectTitle })),
      domains: domainRows.map((d) => ({ id: d.domainId, domain: d.domainUrl })),
    };
  }
}
