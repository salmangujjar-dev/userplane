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

import {
  getUserInfo,
  openModal,
  postMessage,
  publishView,
  respondToUrl,
  updateModal,
} from '@/api/clients/slack';
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
  buildLoadingModal,
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
   * Called via fire-and-forget from the handler (HTTP 200 already sent).
   *
   * Flow:
   *  1. Look up the integration (single fast DB query) to get the access token.
   *  2. Open a loading modal immediately — the trigger_id is short-lived (~3 s)
   *     and must be consumed before the slower work begins.
   *  3. Verify access, check capacity, fetch projects/domains.
   *  4. Replace the loading modal with the real content via views.update,
   *     or show an appropriate error/access-required view.
   *
   * If we can't even open the loading modal (no integration, or Slack API
   * failure), fall back to response_url for error delivery.
   */
  async handleSlashCommand(payload: SlackSlashCommandPayload): Promise<void> {
    const { teamId, userId: slackUserId, triggerId, channelId, channelName, responseUrl } = payload;

    // --- Phase 1: Get access token (single DB query) -------------------------
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);
    if (!integration) {
      await respondToUrl(
        responseUrl,
        buildErrorEphemeral(
          'This Slack workspace is not connected to Userplane. Please connect it from the Userplane dashboard.'
        )
      );
      return;
    }

    const accessToken = IntegrationHelper.getAccessToken(integration);

    // --- Phase 2: Open loading modal before trigger_id expires ----------------
    const viewId = await openModal(accessToken, triggerId, buildLoadingModal());
    if (!viewId) {
      await respondToUrl(
        responseUrl,
        buildErrorEphemeral('Failed to open the link creation form. Please try again.')
      );
      return;
    }

    // --- Phase 3: Verify access (includes slow Slack users.info call) --------
    // Pass the already-fetched integration to avoid a redundant DB query.
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);

    if (accessResult.status !== 'granted') {
      if (accessResult.status === 'not_workspace_member') {
        await updateModal(accessToken, viewId, buildAccessRequiredView());
      } else {
        await updateModal(
          accessToken,
          viewId,
          buildErrorModalView(this.buildAccessDeniedEphemeral(accessResult).text)
        );
      }
      return;
    }

    const { workspaceId, userName } = accessResult.context;

    // --- Phase 4: Check capacity & fetch data --------------------------------
    const hasRoom = await this.deps.entitlementService.hasCapacity(workspaceId, 'links');
    if (!hasRoom) {
      await updateModal(
        accessToken,
        viewId,
        buildLimitExceededView({ workspaceId, limitType: 'links' })
      );
      return;
    }

    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    if (projects.length === 0 || domains.length === 0) {
      await updateModal(
        accessToken,
        viewId,
        buildErrorModalView(
          'No projects or domains found. Please set up a project and domain in the Userplane dashboard first.'
        )
      );
      return;
    }

    // --- Phase 5: Replace loading modal with the real form -------------------
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

    await updateModal(accessToken, viewId, modalWithMetadata);
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
          // Same open-first-then-update pattern as handleSlashCommand.
          // Block actions from home tab have no response_url, so errors
          // that occur before the modal opens are sent as DMs.

          // Phase 1: Get access token
          const integration = await this.deps.integrationRepo.findByProviderWorkspaceId(
            'slack',
            teamId
          );
          if (!integration) {
            logger.warn({ teamId }, 'Block action: integration not found');
            return;
          }
          const accessToken = IntegrationHelper.getAccessToken(integration);

          // Phase 2: Open loading modal before trigger_id expires
          const viewId = await openModal(accessToken, triggerId, buildLoadingModal());
          if (!viewId) {
            const errMsg = buildErrorEphemeral(
              'Failed to open the link creation form. Please try again.'
            );
            await postMessage(accessToken, slackUserId, errMsg.blocks, errMsg.text);
            return;
          }

          // Phase 3: Verify access
          const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);
          if (accessResult.status !== 'granted') {
            logger.debug(
              { teamId, slackUserId, status: accessResult.status },
              'Block action access denied'
            );
            if (accessResult.status === 'not_workspace_member') {
              await updateModal(accessToken, viewId, buildAccessRequiredView());
            } else {
              await updateModal(
                accessToken,
                viewId,
                buildErrorModalView(this.buildAccessDeniedEphemeral(accessResult).text)
              );
            }
            return;
          }

          const { workspaceId, userName } = accessResult.context;

          // Phase 4: Check capacity & fetch data
          const hasRoom = await this.deps.entitlementService.hasCapacity(workspaceId, 'links');
          if (!hasRoom) {
            await updateModal(
              accessToken,
              viewId,
              buildLimitExceededView({ workspaceId, limitType: 'links' })
            );
            return;
          }

          const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
          if (projects.length === 0 || domains.length === 0) {
            await updateModal(
              accessToken,
              viewId,
              buildErrorModalView(
                'No projects or domains found. Please set up a project and domain in the dashboard first.'
              )
            );
            return;
          }

          // Phase 5: Replace loading modal with the real form
          // Block actions from home tab have no channel context
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

          await updateModal(accessToken, viewId, modalWithMetadata);
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
   * Validates form data synchronously (no I/O) and returns a "Creating…"
   * loading view immediately so Slack doesn't time out. The actual link
   * creation, channel message, and success/error modal update happen
   * asynchronously in {@link processLinkCreation}.
   */
  handleViewSubmission(payload: SlackViewSubmissionPayload): {
    response_action: 'update';
    view: ReturnType<typeof buildLoadingModal> | ReturnType<typeof buildErrorModalView>;
  } | null {
    const { view, user } = payload;

    if (view.callback_id !== SlackCallbackIds.CREATE_LINK_MODAL) {
      logger.warn({ callbackId: view.callback_id }, 'Unknown view submission callback_id');
      return null;
    }

    // Parse form values from view state (pure parsing, no I/O)
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

    // Fire off async processing — the loading view is returned below
    void this.processLinkCreation({
      viewId: view.id,
      teamId,
      slackUserId: user.id,
      workspaceId,
      channelId,
      channelName,
      projectId,
      domainId,
      linkTitle,
      customMessage,
    }).catch((error) => {
      logger.error({ err: error, workspaceId }, 'processLinkCreation failed');
      captureException(error, undefined, {
        component: 'slack_canvas',
        operation: 'link_creation',
        workspace_id: workspaceId,
      });
    });

    return {
      response_action: 'update',
      view: buildLoadingModal('Creating your link\u2026'),
    };
  }

  /**
   * Async link creation triggered by view submission.
   *
   * Runs after the handler has already returned the "Creating…" loading view
   * to Slack. Uses views.update to show the final success or error state.
   */
  private async processLinkCreation(params: {
    viewId: string;
    teamId: string;
    slackUserId: string;
    workspaceId: string;
    channelId: string;
    channelName: string;
    projectId: string;
    domainId: string;
    linkTitle: string | undefined;
    customMessage: string | undefined;
  }): Promise<void> {
    const {
      viewId,
      teamId,
      slackUserId,
      workspaceId,
      channelId,
      channelName,
      projectId,
      domainId,
      linkTitle,
      customMessage,
    } = params;

    // Get access token (fast DB query)
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);
    if (!integration) {
      // Integration removed between modal open and submit (e.g. app uninstalled).
      // Without the access token we cannot call views.update, so the modal stays
      // on the loading screen until the user closes it.
      logger.warn({ teamId, viewId }, 'processLinkCreation: integration not found');
      captureException(new Error('integration missing during link creation'), undefined, {
        operation: 'slack_link_creation',
        team_id: teamId,
        view_id: viewId,
      });
      return;
    }
    const accessToken = IntegrationHelper.getAccessToken(integration);

    // Verify user still has access
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);
    if (accessResult.status !== 'granted') {
      logger.warn(
        { teamId, slackUserId, status: accessResult.status },
        'View submission access denied'
      );
      await updateModal(
        accessToken,
        viewId,
        buildErrorModalView(
          'You do not have access to this workspace. Please contact a workspace admin.'
        )
      );
      return;
    }

    const { workspaceMemberId } = accessResult.context;

    try {
      // Create the link
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
          userId: slackUserId,
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
        const slackUser = await getUserInfo(accessToken, slackUserId);
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

      // Replace loading modal with success view
      await updateModal(accessToken, viewId, buildLinkSuccessView({ linkUrl, projectName }));
    } catch (error) {
      if (error instanceof ORPCError && error.code === 'PLAN_LIMIT_EXCEEDED') {
        logger.debug({ workspaceId }, 'Link creation failed: plan limit exceeded');
        await updateModal(
          accessToken,
          viewId,
          buildLimitExceededView({ workspaceId, limitType: 'links' })
        );
        return;
      }

      logger.error({ err: error, workspaceId }, 'Link creation failed unexpectedly');
      captureException(error, undefined, {
        component: 'slack_canvas',
        operation: 'link_creation',
        workspace_id: workspaceId,
      });
      await updateModal(
        accessToken,
        viewId,
        buildErrorModalView('Something went wrong while creating the link. Please try again.')
      );
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
   * Verify that a Slack user is a member of the connected Userplane workspace.
   *
   * Callers that already fetched the integration (e.g. to open a loading modal
   * before the trigger_id expires) can pass it in to avoid a redundant DB query.
   */
  private async verifySlackUserAccess(
    teamId: string,
    slackUserId: string,
    existingIntegration?: TypedIntegration<'slack'>
  ): Promise<SlackAccessResult> {
    const integration =
      existingIntegration ??
      (await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId));

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
