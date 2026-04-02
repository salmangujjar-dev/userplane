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
  getPermalink,
  getUserInfo,
  listUsersAll,
  openModal,
  postMessage,
  publishView,
  respondToUrl,
  updateModal,
} from '@/api/clients/slack';
import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import {
  BROWSE_PAGE_SIZE,
  buildAccessDeniedModalView,
  buildAccessRequiredModalView,
  buildAccountNotFoundModalView,
  buildCommandFailedMessage,
  buildFrozenLoadingModalView,
  buildHomeAccessRequiredView,
  buildHomeBrowseLinksView,
  buildHomeBrowseRecordingsView,
  buildHomeConnectedView,
  buildHomeCreateLinkView,
  buildHomeDisconnectedView,
  buildHomeErrorView,
  buildHomeFrozenLoadingView,
  buildHomeLimitExceededView,
  buildHomeSuccessView,
  buildLimitExceededModalView,
  buildLinkCreatedMessage,
  buildLinkCreationFailedModalView,
  buildLinkCreatorModalView,
  buildLoadingModalView,
  buildSetupIncompleteModalView,
  buildSuccessModalView,
  buildWorkspaceNotConnectedMessage,
  buildWorkspaceNotConnectedModalView,
  type HomeLinkItem,
  type HomeRecordingItem,
  type LinkFilterState,
  type RecordingFilterState,
  SlackActionIds,
  SlackBlockIds,
  SlackCallbackIds,
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
import type { RecordingService } from '@/api/services/recording.service';

// =============================================================================
// Service Dependencies & Types
// =============================================================================

const logger = createLogger('slack-canvas-service');

export interface SlackCanvasServiceDeps {
  integrationRepo: IntegrationRepository;
  userRepo: UserRepository;
  workspaceMemberRepo: WorkspaceMemberRepository;
  linkService: LinkService;
  recordingService: RecordingService;
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
      selected_option: z.object({ value: z.string() }).nullable().optional(),
    })
  ),
  view: z.object({ id: z.string(), type: z.string() }).optional(),
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
            selected_option: z
              .object({
                value: z.string(),
                text: z.object({ type: z.string(), text: z.string() }).optional(),
              })
              .optional(),
            value: z.string().nullable().optional(),
          })
        )
      ),
    }),
  }),
});
export type SlackViewSubmissionPayload = z.infer<typeof SlackViewSubmissionPayloadSchema>;

/**
 * Zod schema for message_action (message shortcut) interactive payload.
 */
export const SlackMessageActionPayloadSchema = z.object({
  type: z.literal('message_action'),
  callback_id: z.string(),
  trigger_id: z.string(),
  user: z.object({ id: z.string(), team_id: z.string() }),
  team: z.object({ id: z.string() }),
  channel: z.object({ id: z.string(), name: z.string() }),
  message: z.object({
    ts: z.string(),
    thread_ts: z.string().optional(),
  }),
  response_url: z.string().optional(),
});
export type SlackMessageActionPayload = z.infer<typeof SlackMessageActionPayloadSchema>;

/**
 * Zod schema for the interactive payload discriminator.
 * The handler parses the raw JSON, then validates with this.
 */
export const SlackInteractivePayloadSchema = z.discriminatedUnion('type', [
  SlackBlockActionPayloadSchema,
  SlackViewSubmissionPayloadSchema,
  SlackMessageActionPayloadSchema,
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
  | { status: 'user_not_found'; email?: string }
  | { status: 'integration_not_found' }
  | { status: 'not_workspace_member'; integration: TypedIntegration<'slack'>; email?: string };

/**
 * Private metadata stored in modal views.
 * Validated with Zod on deserialization to avoid unsafe casts.
 */
const ModalPrivateMetadataSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  teamId: z.string(),
  workspaceId: z.string(),
  threadTs: z.string().optional(),
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

    // Look up integration (cache-first)
    const integration = await this.getIntegrationCached(teamId);
    if (!integration) {
      logger.debug({ teamId, slackUserId }, 'No integration found for app home');
      return;
    }

    const accessToken = IntegrationHelper.getAccessToken(integration);

    // Verify user access (single code path shared with slash commands, modals, etc.)
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);

    if (accessResult.status === 'not_workspace_member') {
      await publishView(
        accessToken,
        slackUserId,
        buildHomeAccessRequiredView({ email: accessResult.email })
      );
      return;
    }

    if (accessResult.status !== 'granted') {
      // user_not_found or integration_not_found — show disconnected view
      await publishView(accessToken, slackUserId, buildHomeDisconnectedView({ dashboardUrl }));
      return;
    }

    const { workspaceId } = accessResult.context;
    const { homeData } = await this.getHomeTabData(workspaceId);

    await publishView(accessToken, slackUserId, buildHomeConnectedView(homeData));

    logger.debug({ teamId, slackUserId, workspaceId }, 'Published connected home tab');
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
    const {
      teamId,
      userId: slackUserId,
      triggerId,
      channelId,
      channelName,
      responseUrl,
      text,
    } = payload;

    // --- Phase 1: Get access token (cache-first) ------------------------------
    const integration = await this.getIntegrationCached(teamId);
    if (!integration) {
      await respondToUrl(responseUrl, buildWorkspaceNotConnectedMessage());
      return;
    }

    const accessToken = IntegrationHelper.getAccessToken(integration);

    // --- Phase 2: Open loading modal before trigger_id expires ----------------
    const viewId = await openModal(accessToken, triggerId, buildLoadingModalView());
    if (!viewId) {
      await respondToUrl(
        responseUrl,
        buildCommandFailedMessage({ workspaceId: integration.workspaceId })
      );
      return;
    }

    // --- Phase 3: Verify access (includes slow Slack users.info call) --------
    // Pass the already-fetched integration to avoid a redundant DB query.
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);

    if (accessResult.status !== 'granted') {
      if (accessResult.status === 'not_workspace_member') {
        await updateModal(
          accessToken,
          viewId,
          buildAccessRequiredModalView({ email: accessResult.email })
        );
      } else {
        await updateModal(
          accessToken,
          viewId,
          accessResult.status === 'user_not_found'
            ? buildAccountNotFoundModalView({ email: accessResult.email })
            : buildWorkspaceNotConnectedModalView()
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
        buildLimitExceededModalView({ workspaceId, limitType: 'links' })
      );
      return;
    }

    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    if (projects.length === 0 || domains.length === 0) {
      await updateModal(accessToken, viewId, buildSetupIncompleteModalView());
      return;
    }

    // --- Phase 5: Replace loading modal with the real form -------------------
    const privateMetadata: ModalPrivateMetadata = {
      channelId,
      channelName,
      teamId,
      workspaceId,
    };

    const modal = buildLinkCreatorModalView({ projects, domains, userName, linkReference: text });
    const modalWithMetadata = {
      ...modal,
      private_metadata: JSON.stringify(privateMetadata),
    };

    await updateModal(accessToken, viewId, modalWithMetadata);
  }

  // ===========================================================================
  // Message Shortcut
  // ===========================================================================

  /**
   * Handle message shortcut (message_action) — "Create recording link"
   *
   * Called via fire-and-forget from the handler (HTTP 200 already sent).
   *
   * Flow mirrors handleSlashCommand:
   *  1. Validate callback_id
   *  2. Look up integration to get access token
   *  3. Open loading modal immediately (trigger_id is short-lived)
   *  4. Verify access, check capacity, fetch projects/domains
   *  5. Replace loading modal with real form, including threadTs in metadata
   */
  async handleMessageShortcut(payload: SlackMessageActionPayload): Promise<void> {
    const { callback_id, trigger_id: triggerId, user, team, channel, message } = payload;

    if (callback_id !== SlackCallbackIds.CREATE_LINK_SHORTCUT) {
      logger.warn({ callbackId: callback_id }, 'Unknown message shortcut callback_id');
      return;
    }

    const teamId = team.id;
    const slackUserId = user.id;
    const channelId = channel.id;
    const channelName = channel.name;

    // Determine thread_ts for reply threading:
    // - If message is in a thread, reply to the parent thread
    // - If message is in main channel, start a new thread on that message
    const threadTs = message.thread_ts ?? message.ts;

    // --- Phase 1: Get access token (cache-first) ------------------------------
    const integration = await this.getIntegrationCached(teamId);
    if (!integration) {
      logger.warn({ teamId }, 'Message shortcut: integration not found');
      return;
    }

    const accessToken = IntegrationHelper.getAccessToken(integration);

    // --- Phase 2: Open loading modal before trigger_id expires ----------------
    const viewId = await openModal(accessToken, triggerId, buildLoadingModalView());
    if (!viewId) {
      logger.warn({ teamId, triggerId }, 'Message shortcut: failed to open loading modal');
      return;
    }

    // --- Phase 3: Verify access (includes slow Slack users.info call) --------
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);

    if (accessResult.status !== 'granted') {
      if (accessResult.status === 'not_workspace_member') {
        await updateModal(
          accessToken,
          viewId,
          buildAccessRequiredModalView({ email: accessResult.email })
        );
      } else {
        await updateModal(
          accessToken,
          viewId,
          accessResult.status === 'user_not_found'
            ? buildAccountNotFoundModalView({ email: accessResult.email })
            : buildWorkspaceNotConnectedModalView()
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
        buildLimitExceededModalView({ workspaceId, limitType: 'links' })
      );
      return;
    }

    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    if (projects.length === 0 || domains.length === 0) {
      await updateModal(accessToken, viewId, buildSetupIncompleteModalView());
      return;
    }

    // --- Phase 5: Replace loading modal with the real form -------------------
    const privateMetadata: ModalPrivateMetadata = {
      channelId,
      channelName,
      teamId,
      workspaceId,
      threadTs,
    };

    const modal = buildLinkCreatorModalView({ projects, domains, userName });
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
   * Handle block_actions from home tab and modal interactions.
   *
   * Routes to the appropriate handler based on action_id.
   */
  async handleBlockAction(payload: SlackBlockActionPayload): Promise<void> {
    const { trigger_id: triggerId, user, actions } = payload;
    const teamId = user.team_id;
    const slackUserId = user.id;
    const isHomeTab = payload.view?.type === 'home';

    for (const action of actions) {
      switch (action.action_id) {
        case SlackActionIds.CREATE_LINK: {
          if (isHomeTab) {
            // Home tab flow: show inline create link form
            await this.handleHomeCreateLink(teamId, slackUserId);
          } else {
            // Non-home-tab flow (shouldn't happen currently, but defensive):
            // Open modal with the link creation form
            await this.handleCreateLinkModal(teamId, slackUserId, triggerId);
          }
          break;
        }

        case SlackActionIds.HOME_BACK: {
          await this.handleAppHomeOpened(teamId, slackUserId);
          break;
        }

        case SlackActionIds.BROWSE_RECORDINGS: {
          await this.handleBrowseRecordings(teamId, slackUserId, 1);
          break;
        }

        case SlackActionIds.BROWSE_LINKS: {
          await this.handleBrowseLinks(teamId, slackUserId, 1);
          break;
        }

        case SlackActionIds.CREATE_LINK_SUBMIT: {
          await this.handleHomeCreateLinkSubmit(teamId, slackUserId);
          break;
        }

        // Home tab select changes - cache the selection for later use
        case SlackActionIds.SELECT_PROJECT:
        case SlackActionIds.SELECT_DOMAIN: {
          if (isHomeTab && action.selected_option?.value) {
            const field =
              action.action_id === SlackActionIds.SELECT_PROJECT ? 'projectId' : 'domainId';
            await this.cacheHomeSelectState(teamId, slackUserId, {
              [field]: action.selected_option.value,
            });
          }
          break;
        }

        // Filter select changes - cache the filter value
        case SlackActionIds.FILTER_RECORDINGS_PROJECT:
        case SlackActionIds.FILTER_RECORDINGS_DOMAIN:
        case SlackActionIds.FILTER_RECORDINGS_DATE: {
          if (action.selected_option?.value) {
            const fieldMap: Record<string, string> = {
              [SlackActionIds.FILTER_RECORDINGS_PROJECT]: 'projectId',
              [SlackActionIds.FILTER_RECORDINGS_DOMAIN]: 'domainId',
              [SlackActionIds.FILTER_RECORDINGS_DATE]: 'dateRange',
            };
            const field = fieldMap[action.action_id]!;
            await this.cacheFilterState(teamId, slackUserId, 'recordings', {
              [field]: action.selected_option.value,
            });
          }
          break;
        }

        case SlackActionIds.FILTER_RECORDINGS_GO: {
          await this.handleBrowseRecordings(teamId, slackUserId, 1);
          break;
        }

        case SlackActionIds.FILTER_LINKS_PROJECT:
        case SlackActionIds.FILTER_LINKS_DOMAIN:
        case SlackActionIds.FILTER_LINKS_STATUS: {
          if (action.selected_option?.value) {
            const fieldMap: Record<string, string> = {
              [SlackActionIds.FILTER_LINKS_PROJECT]: 'projectId',
              [SlackActionIds.FILTER_LINKS_DOMAIN]: 'domainId',
              [SlackActionIds.FILTER_LINKS_STATUS]: 'status',
            };
            const field = fieldMap[action.action_id]!;
            await this.cacheFilterState(teamId, slackUserId, 'links', {
              [field]: action.selected_option.value,
            });
          }
          break;
        }

        case SlackActionIds.FILTER_LINKS_GO: {
          await this.handleBrowseLinks(teamId, slackUserId, 1);
          break;
        }

        case SlackActionIds.PAGE_RECORDINGS_PREV:
        case SlackActionIds.PAGE_RECORDINGS_NEXT: {
          const page = Math.max(1, Number(action.value) || 1);
          await this.handleBrowseRecordings(teamId, slackUserId, page);
          break;
        }

        case SlackActionIds.PAGE_LINKS_PREV:
        case SlackActionIds.PAGE_LINKS_NEXT: {
          const page = Math.max(1, Number(action.value) || 1);
          await this.handleBrowseLinks(teamId, slackUserId, page);
          break;
        }

        default: {
          // Silently ignore URL-only button actions and unknown actions
          const urlOnlyActions: string[] = [
            SlackActionIds.CONNECT_WORKSPACE,
            SlackActionIds.CREATE_WORKSPACE,
            SlackActionIds.REQUEST_ACCESS,
            SlackActionIds.CONTACT_SUPPORT,
            SlackActionIds.OPEN_LINK,
            SlackActionIds.VIEW_DASHBOARD,
            SlackActionIds.VIEW_RECORDING,
            SlackActionIds.VIEW_RECORDINGS,
            SlackActionIds.UPGRADE_WORKSPACE,
          ];
          if (!urlOnlyActions.includes(action.action_id)) {
            logger.debug({ actionId: action.action_id, teamId }, 'Unhandled block action');
          }
          break;
        }
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
    view: ReturnType<typeof buildFrozenLoadingModalView>;
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
    const projectOption =
      values[SlackBlockIds.PROJECT]?.[SlackActionIds.SELECT_PROJECT]?.selected_option;
    const domainOption =
      values[SlackBlockIds.DOMAIN]?.[SlackActionIds.SELECT_DOMAIN]?.selected_option;
    const projectId = projectOption?.value;
    const domainId = domainOption?.value;
    const projectName = projectOption?.text?.text;
    const domainName = domainOption?.text?.text;
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

    const { channelId, channelName, teamId, workspaceId, threadTs } = metadataResult.data;

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
      threadTs,
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
      view: buildFrozenLoadingModalView({
        projectName: projectName ?? 'Unknown project',
        domainName: domainName ?? 'Unknown domain',
        linkTitle: linkTitle || undefined,
        customMessage: customMessage || undefined,
      }),
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
    threadTs?: string;
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
      threadTs,
    } = params;

    // Get access token (cache-first)
    const integration = await this.getIntegrationCached(teamId);
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
      await updateModal(accessToken, viewId, buildAccessDeniedModalView());
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
          threadTs: threadTs || undefined,
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

      // Post link message to channel if we have a channel context
      let messagePermalink: string | undefined;
      if (channelId) {
        const message = buildLinkCreatedMessage({
          linkUrl,
          slackUserId,
          customMessage,
        });
        const messageTs = await postMessage(
          accessToken,
          channelId,
          message.blocks,
          message.text,
          threadTs
        );
        if (messageTs) {
          messagePermalink = (await getPermalink(accessToken, channelId, messageTs)) ?? undefined;
        }
      }

      // Replace loading modal with success view
      await updateModal(
        accessToken,
        viewId,
        buildSuccessModalView({
          linkUrl,
          messagePermalink,
        })
      );
    } catch (error) {
      if (error instanceof ORPCError && error.code === 'PLAN_LIMIT_EXCEEDED') {
        logger.debug({ workspaceId }, 'Link creation failed: plan limit exceeded');
        await updateModal(
          accessToken,
          viewId,
          buildLimitExceededModalView({ workspaceId, limitType: 'links' })
        );
        return;
      }

      logger.error({ err: error, workspaceId }, 'Link creation failed unexpectedly');
      captureException(error, undefined, {
        component: 'slack_canvas',
        operation: 'link_creation',
        workspace_id: workspaceId,
      });
      await updateModal(accessToken, viewId, buildLinkCreationFailedModalView({ workspaceId }));
    }
  }

  // ===========================================================================
  // View Broadcasting
  // ===========================================================================

  /**
   * Publish the connected home tab view to the user who just completed OAuth.
   * Best-effort: logs failures but does not throw.
   */
  async publishConnectedViewForUser(
    accessToken: string,
    workspaceId: string,
    slackUserId: string
  ): Promise<void> {
    const { homeData } = await this.getHomeTabData(workspaceId);
    const connectedView = buildHomeConnectedView(homeData);
    await publishView(accessToken, slackUserId, connectedView);

    logger.debug({ workspaceId, slackUserId }, 'Published connected home tab for authed user');
  }

  /**
   * Broadcast disconnected home tab view to all workspace members.
   * Best-effort: logs failures but does not throw.
   */
  async broadcastDisconnectedView(accessToken: string): Promise<void> {
    const dashboardUrl = env.dashboard.baseUrl;
    const disconnectedView = buildHomeDisconnectedView({ dashboardUrl });

    const members = await listUsersAll(accessToken);
    if (members.length === 0) {
      logger.debug('No members found for disconnected view broadcast');
      return;
    }

    const BATCH_SIZE = 20;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((member) => publishView(accessToken, member.id, disconnectedView))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    logger.debug(
      { successCount, failCount, total: members.length },
      'Disconnected view broadcast complete'
    );
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
    const integration = existingIntegration ?? (await this.getIntegrationCached(teamId));

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

    const email = slackUser.profile.email;

    // Find Userplane user by email
    const user = await this.deps.userRepo.findByEmail(email);
    if (!user) {
      logger.debug({ email }, 'Userplane user not found');
      return { status: 'user_not_found', email };
    }

    // Find workspace member
    const member = await this.deps.workspaceMemberRepo.findByUserAndWorkspace(
      user.id,
      integration.workspaceId
    );

    if (!member) {
      logger.debug(
        { email, workspaceId: integration.workspaceId },
        'User is not a workspace member'
      );
      return { status: 'not_workspace_member', integration, email };
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

  // ===========================================================================
  // Private: Create Link Flows
  // ===========================================================================

  /**
   * Show the inline create link form on the home tab.
   */
  private async handleHomeCreateLink(teamId: string, slackUserId: string): Promise<void> {
    const ctx = await this.getSlackContext(teamId);
    if (!ctx) return;

    const { accessToken, workspaceId } = ctx;
    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);

    if (projects.length === 0 || domains.length === 0) {
      await publishView(
        accessToken,
        slackUserId,
        buildHomeErrorView(
          'No projects or domains are configured yet. Set them up in your dashboard first.'
        )
      );
      return;
    }

    await publishView(accessToken, slackUserId, buildHomeCreateLinkView({ projects, domains }));
  }

  /**
   * Open the link creation modal (used from slash command and non-home contexts).
   * Uses the open-first-then-update pattern to consume the trigger_id quickly.
   */
  private async handleCreateLinkModal(
    teamId: string,
    slackUserId: string,
    triggerId: string
  ): Promise<void> {
    const integration = await this.getIntegrationCached(teamId);
    if (!integration) {
      logger.warn({ teamId }, 'Block action: integration not found');
      return;
    }
    const accessToken = IntegrationHelper.getAccessToken(integration);

    // Open loading modal before trigger_id expires
    const viewId = await openModal(accessToken, triggerId, buildLoadingModalView());
    if (!viewId) {
      const errMsg = buildCommandFailedMessage({
        workspaceId: integration.workspaceId,
        retryHint: 'Try clicking the button again.',
      });
      await postMessage(accessToken, slackUserId, errMsg.blocks, errMsg.text);
      return;
    }

    // Verify access
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);
    if (accessResult.status !== 'granted') {
      logger.debug(
        { teamId, slackUserId, status: accessResult.status },
        'Block action access denied'
      );
      if (accessResult.status === 'not_workspace_member') {
        await updateModal(
          accessToken,
          viewId,
          buildAccessRequiredModalView({ email: accessResult.email })
        );
      } else {
        await updateModal(
          accessToken,
          viewId,
          accessResult.status === 'user_not_found'
            ? buildAccountNotFoundModalView({ email: accessResult.email })
            : buildWorkspaceNotConnectedModalView()
        );
      }
      return;
    }

    const { workspaceId, userName } = accessResult.context;

    // Check capacity & fetch data
    const hasRoom = await this.deps.entitlementService.hasCapacity(workspaceId, 'links');
    if (!hasRoom) {
      await updateModal(
        accessToken,
        viewId,
        buildLimitExceededModalView({ workspaceId, limitType: 'links' })
      );
      return;
    }

    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    if (projects.length === 0 || domains.length === 0) {
      await updateModal(accessToken, viewId, buildSetupIncompleteModalView());
      return;
    }

    const privateMetadata: ModalPrivateMetadata = {
      channelId: '',
      channelName: '',
      teamId,
      workspaceId,
    };

    const modal = buildLinkCreatorModalView({ projects, domains, userName });
    const modalWithMetadata = {
      ...modal,
      private_metadata: JSON.stringify(privateMetadata),
    };

    await updateModal(accessToken, viewId, modalWithMetadata);
  }

  // ===========================================================================
  // Private: Home Tab Sub-Views
  // ===========================================================================

  /**
   * Cache-first integration lookup by Slack team ID.
   * Tries Redis cache first (30-min TTL), falls back to DB, warms cache on miss.
   * Use for all read paths. Skip for destructive paths (uninstall, token revoke).
   */
  private async getIntegrationCached(teamId: string): Promise<TypedIntegration<'slack'> | null> {
    const cached = await this.deps.cacheService.getIntegrationByProviderWorkspace<
      TypedIntegration<'slack'>
    >('slack', teamId);
    if (cached) {
      logger.debug({ teamId, workspaceId: cached.workspaceId }, 'Integration cache hit');
      return cached;
    }

    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId('slack', teamId);
    if (!integration) return null;

    await this.deps.cacheService.setIntegrationByProviderWorkspace('slack', teamId, integration);
    logger.debug({ teamId, workspaceId: integration.workspaceId }, 'Integration cached');
    return integration;
  }

  /**
   * Lightweight context lookup with cache-first integration.
   * Use for read-only browse/page actions where full access verification is overkill.
   */
  private async getSlackContext(teamId: string): Promise<{
    integration: TypedIntegration<'slack'>;
    accessToken: string;
    workspaceId: string;
  } | null> {
    const integration = await this.getIntegrationCached(teamId);
    if (!integration) return null;
    return {
      integration,
      accessToken: IntegrationHelper.getAccessToken(integration),
      workspaceId: integration.workspaceId,
    };
  }

  /**
   * Fetch all data needed for the connected home tab in one method.
   */
  private async getHomeTabData(workspaceId: string) {
    const [workspace, recordingsResult, linksResult] = await Promise.all([
      this.deps.workspaceRepo.findById(workspaceId),
      this.deps.recordingService.getByWorkspaceIdPaginated(workspaceId, 1, 3),
      this.deps.linkService.getByWorkspaceIdPaginated(workspaceId, 1, 3),
    ]);

    const workspaceName = workspace?.workspaceName ?? 'Your Workspace';
    const dashboardUrl = `${env.dashboard.baseUrl}/workspace/${workspaceId}`;

    const recordings: HomeRecordingItem[] = recordingsResult.recordings.map((r) => ({
      title: r.linkTitle || 'Untitled',
      creatorName: r.creator.name ?? 'Unknown',
      projectName: 'Recording',
      durationFormatted: this.formatDuration(r.recordingDurationMs),
      createdAtTs: Math.floor(r.createdAt.getTime() / 1000),
      thumbnailUrl: r.recordingThumbnail,
    }));

    const links: HomeLinkItem[] = linksResult.links.map((l) => ({
      linkId: l.linkId,
      title: l.linkTitle || 'Untitled Link',
      projectName: l.project.title ?? 'Unknown Project',
      creatorName: l.creator.name ?? 'Unknown',
      createdAtTs: Math.floor(l.createdAt.getTime() / 1000),
      linkUrl: l.linkURL,
      workspaceId,
    }));

    return {
      homeData: { workspaceName, workspaceId, dashboardUrl, recordings, links },
    };
  }

  /**
   * Handle browse recordings - publishes the recordings browse view.
   */
  private async handleBrowseRecordings(
    teamId: string,
    slackUserId: string,
    page: number
  ): Promise<void> {
    const ctx = await this.getSlackContext(teamId);
    if (!ctx) return;

    const { accessToken, workspaceId } = ctx;

    const filters = await this.getFilterState<RecordingFilterState>(
      teamId,
      slackUserId,
      'recordings'
    );

    const recordingFilters: { projectId?: string[] } = {};
    if (filters?.projectId && filters.projectId !== 'all') {
      recordingFilters.projectId = [filters.projectId];
    }

    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    const recordingsResult = await this.deps.recordingService.getByWorkspaceIdPaginated(
      workspaceId,
      page,
      BROWSE_PAGE_SIZE,
      recordingFilters
    );

    const recordings: HomeRecordingItem[] = recordingsResult.recordings.map((r) => ({
      title: r.linkTitle || 'Untitled',
      creatorName: r.creator.name ?? 'Unknown',
      projectName: 'Recording',
      durationFormatted: this.formatDuration(r.recordingDurationMs),
      createdAtTs: Math.floor(r.createdAt.getTime() / 1000),
      thumbnailUrl: r.recordingThumbnail,
    }));

    await publishView(
      accessToken,
      slackUserId,
      buildHomeBrowseRecordingsView({
        projects,
        domains,
        recordings,
        total: recordingsResult.total,
        page,
        selectedFilters: filters ?? undefined,
      })
    );
  }

  /**
   * Handle browse links - publishes the links browse view.
   */
  private async handleBrowseLinks(
    teamId: string,
    slackUserId: string,
    page: number
  ): Promise<void> {
    const ctx = await this.getSlackContext(teamId);
    if (!ctx) return;

    const { accessToken, workspaceId } = ctx;

    const filters = await this.getFilterState<LinkFilterState>(teamId, slackUserId, 'links');

    const linkFilters: { projectId?: string[]; domainId?: string[] } = {};
    if (filters?.projectId && filters.projectId !== 'all') {
      linkFilters.projectId = [filters.projectId];
    }
    if (filters?.domainId && filters.domainId !== 'all') {
      linkFilters.domainId = [filters.domainId];
    }

    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    const linksResult = await this.deps.linkService.getByWorkspaceIdPaginated(
      workspaceId,
      page,
      BROWSE_PAGE_SIZE,
      linkFilters
    );

    const links = linksResult.links.map((l) => ({
      linkId: l.linkId,
      title: l.linkTitle || 'Untitled Link',
      projectName: l.project.title ?? 'Unknown Project',
      creatorName: l.creator.name ?? 'Unknown',
      domainName: l.domain.url,
      createdAtTs: Math.floor(l.createdAt.getTime() / 1000),
      linkUrl: l.linkURL,
      workspaceId,
    }));

    await publishView(
      accessToken,
      slackUserId,
      buildHomeBrowseLinksView({
        projects,
        domains,
        links,
        total: linksResult.total,
        page,
        dashboardUrl: `${env.dashboard.baseUrl}/workspace/${workspaceId}`,
        selectedFilters: filters ?? undefined,
      })
    );
  }

  /**
   * Handle link creation from the home tab create link form.
   * Reads cached project/domain selections and creates the link.
   */
  private async handleHomeCreateLinkSubmit(teamId: string, slackUserId: string): Promise<void> {
    // Fetch integration once (cache-first), reuse for access check and error views
    const integration = await this.getIntegrationCached(teamId);
    if (!integration) return;

    const accessToken = IntegrationHelper.getAccessToken(integration);
    const accessResult = await this.verifySlackUserAccess(teamId, slackUserId, integration);

    if (accessResult.status !== 'granted') {
      if (accessResult.status === 'not_workspace_member') {
        await publishView(
          accessToken,
          slackUserId,
          buildHomeAccessRequiredView({ email: accessResult.email })
        );
      } else if (accessResult.status === 'user_not_found') {
        await publishView(
          accessToken,
          slackUserId,
          buildHomeDisconnectedView({ dashboardUrl: env.dashboard.baseUrl })
        );
      }
      return;
    }

    const { workspaceId, workspaceMemberId } = accessResult.context;

    // Read cached selections
    const cached = await this.getHomeSelectState(teamId, slackUserId);
    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);

    // Use cached values or fall back to first available option
    const projectId = cached?.projectId ?? projects[0]?.id;
    const domainId = cached?.domainId ?? domains[0]?.id;

    if (!projectId || !domainId) {
      // Re-publish home with no data available
      await this.handleAppHomeOpened(teamId, slackUserId);
      return;
    }

    // Resolve display names for the frozen loading view
    const projectName = projects.find((p) => p.id === projectId)?.name ?? 'Unknown project';
    const domainName = domains.find((d) => d.id === domainId)?.domain ?? 'Unknown domain';

    // Show frozen loading state immediately
    await publishView(
      accessToken,
      slackUserId,
      buildHomeFrozenLoadingView({ projectName, domainName })
    );

    try {
      // Check capacity
      const hasRoom = await this.deps.entitlementService.hasCapacity(workspaceId, 'links');
      if (!hasRoom) {
        await publishView(
          accessToken,
          slackUserId,
          buildHomeLimitExceededView({ workspaceId, limitType: 'links' })
        );
        return;
      }

      const link = await this.deps.linkService.createWithProvider({
        workspaceId,
        projectId,
        domainId,
        createdBy: workspaceMemberId,
        linkReusable: false,
        linkProviderType: 'slack',
        linkTitle: undefined,
        linkProviderId: null,
        linkProviderRef: null,
        linkProviderData: createLinkProviderData('slack', {
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

      await publishView(accessToken, slackUserId, buildHomeSuccessView({ linkUrl }));

      // Clear cached selection state
      await this.deps.cacheService.delete(this.homeSelectCacheKey(teamId, slackUserId));
    } catch (error) {
      logger.error({ err: error, workspaceId }, 'Home tab link creation failed');
      captureException(error, undefined, {
        component: 'slack_canvas',
        operation: 'home_link_creation',
        workspace_id: workspaceId,
      });
      await publishView(
        accessToken,
        slackUserId,
        buildHomeErrorView('Something went wrong while creating your link. Please try again.', [
          {
            text: 'Create from Dashboard',
            actionId: SlackActionIds.VIEW_DASHBOARD,
            url: `${env.dashboard.baseUrl}/workspace/${workspaceId}/recordings?create_link=true`,
            style: 'primary',
          },
        ])
      );
    }
  }

  // ===========================================================================
  // Private: Cache Helpers
  // ===========================================================================

  private homeSelectCacheKey(teamId: string, slackUserId: string): string {
    return `slack:home_create:${teamId}:${slackUserId}`;
  }

  private filterCacheKey(teamId: string, slackUserId: string, view: string): string {
    return `slack:filter:${teamId}:${slackUserId}:${view}`;
  }

  private async cacheHomeSelectState(
    teamId: string,
    slackUserId: string,
    partial: Record<string, string>
  ): Promise<void> {
    const key = this.homeSelectCacheKey(teamId, slackUserId);
    const [existing] = await this.deps.cacheService.mget<Record<string, string>>([key]);
    const current = existing ?? {};
    await this.deps.cacheService.mset([{ key, value: { ...current, ...partial } }], 300);
  }

  private async getHomeSelectState(
    teamId: string,
    slackUserId: string
  ): Promise<Record<string, string> | null> {
    const key = this.homeSelectCacheKey(teamId, slackUserId);
    const [value] = await this.deps.cacheService.mget<Record<string, string>>([key]);
    return value ?? null;
  }

  private async cacheFilterState(
    teamId: string,
    slackUserId: string,
    view: string,
    partial: Record<string, string>
  ): Promise<void> {
    const key = this.filterCacheKey(teamId, slackUserId, view);
    const [existing] = await this.deps.cacheService.mget<Record<string, string>>([key]);
    const current = existing ?? {};
    await this.deps.cacheService.mset([{ key, value: { ...current, ...partial } }], 300);
  }

  private async getFilterState<T>(
    teamId: string,
    slackUserId: string,
    view: string
  ): Promise<T | null> {
    const key = this.filterCacheKey(teamId, slackUserId, view);
    const [value] = await this.deps.cacheService.mget<T>([key]);
    return value ?? null;
  }

  // ===========================================================================
  // Private: Formatting Helpers
  // ===========================================================================

  private formatDuration(ms: number | null): string {
    if (!ms) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
}
