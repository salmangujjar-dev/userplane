/**
 * IntercomCanvasService - Business logic for Intercom Canvas Kit integration
 *
 * Provides explicit methods for Messenger (customer-facing) and Inbox (teammate) flows:
 *
 * Messenger methods:
 * - handleMessengerInitialize() - Customer opens card, expects card_creation_options
 * - handleMessengerSubmit() - Customer interacts with card
 *
 * Inbox methods:
 * - handleInboxInitialize() - Teammate opens inbox app, expects admin
 * - handleInboxSubmit() - Teammate interacts with inbox app
 *
 * Configure method (used by Messenger):
 * - handleConfigure() - Teammate configures card before sending
 *
 * Features:
 * - Cache-first integration lookup with graceful degradation
 * - Structured logging with Pino
 * - PostHog error tracking
 */

import type { CacheService } from '@workspace/cache';
import { createLinkProviderData } from '@workspace/contract';

import {
  buildAccessRequestedCanvas,
  buildCanvasErrorCanvas,
  buildConnectIntegrationCanvas,
  buildIntercomConversationRef,
  buildLimitExceededCanvas,
  buildLinkCreatorCanvas,
  buildOpenerCanvas,
  buildRecordingCanvas,
  buildSignUpCanvas,
  buildSuccessCanvas,
  ConfigureComponentId,
  type DomainOption,
  extractLinkCreatorFormValues,
  getTeammateDisplayName,
  InboxComponentId,
  type ProjectOption,
  resolveRecordingMessage,
} from '@/api/lib/intercom-canvas';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import type { DomainRepository } from '@/api/repositories/domains.repository';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { ProjectRepository } from '@/api/repositories/projects.repository';
import type { UserRepository } from '@/api/repositories/users.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { LinkService } from '@/api/services/link.service';
import {
  type CanvasInputValues,
  type CanvasResponse,
  type ConfigureResponse,
  type IntercomCanvasConfigureRequest,
  type IntercomCanvasInitializeRequest,
  type IntercomCanvasSubmitRequest,
  type IntercomConversation,
  type IntercomTeammate,
  RecordingCanvasStoredDataSchema,
} from '@/api/types/intercom-canvas';

// =============================================================================
// Service Dependencies & Types
// =============================================================================

const logger = createLogger('intercom-canvas-service');

export interface IntercomCanvasServiceDeps {
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
 * Verified workspace context after access check
 */
interface VerifiedWorkspaceContext {
  workspaceId: string;
  workspaceMemberId: string;
}

/**
 * Result of teammate access verification
 */
type TeammateAccessResult =
  | { status: 'granted'; context: VerifiedWorkspaceContext }
  | { status: 'user_not_found' }
  | { status: 'integration_not_found' }
  | { status: 'not_workspace_member' };

/**
 * Cached integration data structure
 */
interface CachedIntegration {
  workspaceId: string;
}

// =============================================================================
// Service Implementation
// =============================================================================

export class IntercomCanvasService {
  constructor(private deps: IntercomCanvasServiceDeps) {}

  // ===========================================================================
  // Messenger Methods (Customer-facing)
  // ===========================================================================

  /**
   * Handle messenger card initialization for customer
   *
   * Called when a customer opens a card in Messenger.
   * The card was previously configured via handleConfigure() which set card_creation_options.
   *
   * Note: Request is already validated by Zod at handler boundary.
   */
  handleMessengerInitialize(req: IntercomCanvasInitializeRequest): CanvasResponse {
    const { card_creation_options } = req;

    // card_creation_options.link_url is required for messenger cards
    // This is a data integrity issue if missing (card was misconfigured)
    if (!card_creation_options?.link_url) {
      logger.warn(
        { workspaceId: req.workspace_id },
        'Messenger card missing link_url - card misconfigured'
      );
      captureException(
        new Error('messenger card missing link_url - card misconfigured'),
        undefined,
        {
          operation: 'initalize_messenger_handler',
        }
      );
      return { canvas: buildCanvasErrorCanvas() };
    }

    return {
      canvas: buildRecordingCanvas({
        linkUrl: card_creation_options.link_url,
        linkTitle: card_creation_options.link_title,
        customMessage: card_creation_options.custom_message,
        footer: card_creation_options.footer,
        logoUrl: card_creation_options.logo_url,
      }),
    };
  }

  /**
   * Handle submit from Messenger context (customer actions)
   *
   * Currently the recording canvas uses URL action, so submits shouldn't occur.
   * This is a safety handler for future messenger interactions.
   */
  handleMessengerSubmit(req: IntercomCanvasSubmitRequest): CanvasResponse {
    const { component_id, current_canvas, workspace_id } = req;

    logger.debug(
      { componentId: component_id, workspaceId: workspace_id },
      'Messenger submit (unexpected)'
    );

    // Parse stored_data with Zod for type safety
    const storedDataResult = RecordingCanvasStoredDataSchema.safeParse(current_canvas?.stored_data);
    if (storedDataResult.success) {
      const storedData = storedDataResult.data;
      return {
        canvas: buildRecordingCanvas({
          linkUrl: storedData.link_url,
          linkTitle: storedData.link_title,
          customMessage: storedData.custom_message,
          footer: storedData.footer,
          logoUrl: storedData.logo_url,
        }),
      };
    }

    return { canvas: buildCanvasErrorCanvas() };
  }

  // ===========================================================================
  // Inbox Methods (Teammate-facing)
  // ===========================================================================

  /**
   * Handle inbox app initialization for teammate
   *
   * Called when a teammate opens the app in the Inbox conversation details.
   * Verifies teammate access and returns opener canvas.
   */
  async handleInboxInitialize(req: IntercomCanvasInitializeRequest): Promise<CanvasResponse> {
    const { admin: teammate, workspace_id: intercomWorkspaceId } = req;

    // Zod schema allows optional admin for messenger/inbox compatibility.
    // Inbox flow requires teammate - this is a runtime invariant check.
    if (!teammate) {
      logger.warn(
        { intercomWorkspaceId },
        'Inbox initialize called without teammate - invalid request routing'
      );
      captureException(new Error('inbox initialize called without teammate'), undefined, {
        operation: 'initalize_inbox_handler',
      });
      return { canvas: buildCanvasErrorCanvas() };
    }

    return this.showOpenerCanvas(intercomWorkspaceId, teammate);
  }

  /**
   * Handle submit from Inbox context (teammate actions)
   *
   * Routes to appropriate handler based on component_id.
   */
  async handleInboxSubmit(req: IntercomCanvasSubmitRequest): Promise<CanvasResponse> {
    const {
      component_id: componentId,
      admin: teammate,
      input_values: inputValues,
      workspace_id: intercomWorkspaceId,
      conversation,
    } = req;

    // Zod schema allows optional admin for messenger/inbox compatibility.
    // Inbox flow requires teammate - this is a runtime invariant check.
    if (!teammate) {
      logger.warn(
        { componentId, intercomWorkspaceId },
        'Inbox submit called without teammate - invalid request routing'
      );
      captureException(new Error('inbox submit called without teammate'), undefined, {
        operation: 'initalize_messenger_handler',
      });
      return { canvas: buildCanvasErrorCanvas() };
    }

    switch (componentId) {
      case InboxComponentId.REQUEST_RECORDING:
        return this.showLinkCreatorCanvas(intercomWorkspaceId, teammate);

      case InboxComponentId.CREATE_LINK:
        return this.createLinkAndShowSuccess(
          intercomWorkspaceId,
          conversation,
          teammate,
          inputValues
        );

      case InboxComponentId.GO_BACK:
      case InboxComponentId.DONE:
      case InboxComponentId.RETRY:
        return this.showOpenerCanvas(intercomWorkspaceId, teammate);

      case InboxComponentId.CREATE_ANOTHER:
        return this.showLinkCreatorCanvas(intercomWorkspaceId, teammate);

      default:
        logger.warn({ componentId, intercomWorkspaceId }, 'Unknown inbox component_id');
        captureException(new Error('inbox submit called without teammate'), undefined, {
          operation: 'handle_inbox_submit',
          componentId,
          intercomWorkspaceId,
        });
        return { canvas: buildCanvasErrorCanvas() };
    }
  }

  // ===========================================================================
  // Configure Methods (Messenger card configuration)
  // ===========================================================================

  /**
   * Handle configure request for card creation flow
   *
   * This flow is used when teammate inserts the app into a conversation.
   */
  async handleConfigure(
    req: IntercomCanvasConfigureRequest
  ): Promise<ConfigureResponse | CanvasResponse> {
    const {
      admin: teammate,
      workspace_id: intercomWorkspaceId,
      component_id: componentId,
      input_values: inputValues,
      context,
    } = req;

    // Configure schema requires admin, but defensive check for type narrowing
    if (!teammate || !intercomWorkspaceId) {
      logger.warn('Configure called with missing teammate or workspace_id');
      captureException(
        new Error('configure called with missing teammate or workspace_id'),
        undefined,
        {
          operation: 'handle_canvas_configure',
          componentId,
          intercomWorkspaceId,
        }
      );
      return { canvas: buildCanvasErrorCanvas() };
    }

    // Subsequent request (teammate interaction)
    if (componentId) {
      return this.handleConfigureSubmit(
        teammate,
        componentId,
        intercomWorkspaceId,
        context?.conversation_id?.toString(),
        inputValues
      );
    }

    // Initial configure request: show link creator canvas
    return this.showConfigureLinkCreatorCanvas(intercomWorkspaceId, teammate);
  }

  // ===========================================================================
  // Private: Canvas Display Methods
  // ===========================================================================

  /**
   * Show opener canvas with "Request recording" and "View recordings" buttons
   */
  private async showOpenerCanvas(
    intercomWorkspaceId: string,
    teammate: IntercomTeammate
  ): Promise<CanvasResponse> {
    const accessResult = await this.verifyTeammateAccess(intercomWorkspaceId, teammate.email);

    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, teammate.email);
    }

    return {
      canvas: buildOpenerCanvas({
        workspaceId: accessResult.context.workspaceId,
        workspaceMemberId: accessResult.context.workspaceMemberId,
      }),
    };
  }

  /**
   * Show link creator canvas with project/domain dropdowns
   */
  private async showLinkCreatorCanvas(
    intercomWorkspaceId: string,
    teammate: IntercomTeammate
  ): Promise<CanvasResponse> {
    const accessResult = await this.verifyTeammateAccess(intercomWorkspaceId, teammate.email);

    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, teammate.email);
    }

    const { workspaceId } = accessResult.context;

    // Read-only capacity check
    const hasRoom = await this.deps.entitlementService.hasCapacity(workspaceId, 'links');
    if (!hasRoom) {
      return { canvas: buildLimitExceededCanvas({ workspaceId, limitType: 'links' }) };
    }

    // Get dropdown options
    const { projects, domains } = await this.getProjectsAndDomains(workspaceId);
    if (projects.length === 0 || domains.length === 0) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    return {
      canvas: buildLinkCreatorCanvas({
        projects,
        domains,
        adminName: getTeammateDisplayName(teammate),
      }),
    };
  }

  /**
   * Show link creator canvas for configure flow (same as inbox, but separate for clarity)
   */
  private async showConfigureLinkCreatorCanvas(
    intercomWorkspaceId: string,
    teammate: IntercomTeammate
  ): Promise<CanvasResponse> {
    return this.showLinkCreatorCanvas(intercomWorkspaceId, teammate);
  }

  // ===========================================================================
  // Private: Link Creation Methods
  // ===========================================================================

  /**
   * Create link and show success canvas (Inbox flow)
   * Returns card_creation_options for Intercom to auto-send card
   */
  private async createLinkAndShowSuccess(
    intercomWorkspaceId: string,
    conversation: IntercomConversation | undefined,
    teammate: IntercomTeammate,
    inputValues: CanvasInputValues | undefined
  ): Promise<CanvasResponse> {
    const formValues = extractLinkCreatorFormValues(inputValues);
    if (!formValues) {
      logger.warn({ intercomWorkspaceId }, 'Link creation failed: invalid form values');
      captureException(new Error('link creation called with invalid form values'), undefined, {
        operation: 'create_link_intercom',
        conversation,
        teammate,
        inputValues,
        intercomWorkspaceId,
      });
      return { canvas: buildCanvasErrorCanvas() };
    }

    const accessResult = await this.verifyTeammateAccess(intercomWorkspaceId, teammate.email);
    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, teammate.email);
    }

    const { workspaceId, workspaceMemberId } = accessResult.context;

    // Get workspace preferences for footer
    const workspacePreferences = await this.deps.workspaceRepo.findPreferencesById(workspaceId);

    // Build conversation reference
    const conversationRef = buildIntercomConversationRef(intercomWorkspaceId, conversation?.id);

    try {
      const link = await this.deps.linkService.createWithProvider({
        workspaceId,
        projectId: formValues.project_id,
        domainId: formValues.domain_id,
        createdBy: workspaceMemberId,
        linkReusable: false,
        linkProviderType: 'intercom',
        linkTitle: conversationRef.title,
        linkProviderId: conversationRef.id,
        linkProviderRef: conversationRef.url,
        linkProviderData: createLinkProviderData('intercom', { adminId: teammate.id }),
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

      const message = resolveRecordingMessage(formValues.custom_message, teammate, 'inbox');

      logger.debug({ workspaceId, linkId: link.linkId }, 'Link created successfully (inbox flow)');

      // Use logo URL directly from workspace preferences (stored as full CDN URL)
      const logoUrl = workspacePreferences?.recordingCompanyLogoPath ?? null;

      return {
        canvas: buildSuccessCanvas({
          linkUrl,
        }),
        card_creation_options: {
          link_url: linkUrl,
          custom_message: message,
          footer: workspacePreferences?.recordingFootnote ?? null,
          logo_url: logoUrl,
        },
      };
    } catch (error) {
      return this.handleLinkCreationError(error, workspaceId);
    }
  }

  /**
   * Handle configure submit actions
   */
  private async handleConfigureSubmit(
    teammate: IntercomTeammate,
    componentId: string,
    intercomWorkspaceId: string,
    conversationId: string | undefined,
    inputValues: CanvasInputValues | undefined
  ): Promise<ConfigureResponse | CanvasResponse> {
    switch (componentId) {
      case ConfigureComponentId.CREATE_LINK:
        return this.createLinkAndReturnResults(
          teammate,
          intercomWorkspaceId,
          conversationId,
          inputValues
        );

      case ConfigureComponentId.GO_BACK:
        return this.showConfigureLinkCreatorCanvas(intercomWorkspaceId, teammate);

      default:
        return { canvas: buildCanvasErrorCanvas() };
    }
  }

  /**
   * Create link and return results to complete configure flow
   * Results become card_creation_options in initialize flow
   */
  private async createLinkAndReturnResults(
    teammate: IntercomTeammate,
    intercomWorkspaceId: string,
    conversationId: string | undefined,
    inputValues: CanvasInputValues | undefined
  ): Promise<ConfigureResponse | CanvasResponse> {
    const formValues = extractLinkCreatorFormValues(inputValues);
    if (!formValues) {
      logger.warn({ intercomWorkspaceId }, 'Link creation failed: invalid form values');
      captureException(new Error('link creation called with invalid form values'), undefined, {
        operation: 'create_link_intercom',
        conversationId,
        teammate,
        inputValues,
        intercomWorkspaceId,
      });
      return { canvas: buildCanvasErrorCanvas() };
    }

    const accessResult = await this.verifyTeammateAccess(intercomWorkspaceId, teammate.email);
    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, teammate.email);
    }

    const { workspaceId, workspaceMemberId } = accessResult.context;

    // Get workspace preferences for footer
    const workspacePreferences = await this.deps.workspaceRepo.findPreferencesById(workspaceId);

    // Build conversation reference
    const conversationRef = buildIntercomConversationRef(intercomWorkspaceId, conversationId);

    try {
      const link = await this.deps.linkService.createWithProvider({
        workspaceId,
        projectId: formValues.project_id,
        domainId: formValues.domain_id,
        createdBy: workspaceMemberId,
        linkReusable: false,
        linkProviderType: 'intercom',
        linkTitle: conversationRef.title,
        linkProviderId: conversationRef.id,
        linkProviderRef: conversationRef.url,
        linkProviderData: createLinkProviderData('intercom', { adminId: teammate.id }),
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

      const message = resolveRecordingMessage(formValues.custom_message, teammate, 'configure');

      logger.debug(
        { workspaceId, linkId: link.linkId },
        'Link created successfully (configure flow)'
      );
      // Use logo URL directly from workspace preferences (stored as full CDN URL)
      const logoUrl = workspacePreferences?.recordingCompanyLogoPath ?? null;

      // Return results to complete configure flow
      return {
        results: {
          link_url: linkUrl,
          custom_message: message,
          footer: workspacePreferences?.recordingFootnote ?? null,
          logo_url: logoUrl,
        },
      };
    } catch (error) {
      return this.handleLinkCreationError(error, workspaceId);
    }
  }

  // ===========================================================================
  // Private: Access Verification
  // ===========================================================================

  /**
   * Verify that the teammate is a member of the workspace
   *
   * Uses cache-first lookup for integration (30 min TTL).
   * User and member lookups are not cached as they're less frequent.
   */
  private async verifyTeammateAccess(
    intercomWorkspaceId: string,
    teammateEmail: string
  ): Promise<TeammateAccessResult> {
    // Cache-first integration lookup
    let integration =
      await this.deps.cacheService.getIntegrationByProviderWorkspace<CachedIntegration>(
        'intercom',
        intercomWorkspaceId
      );

    if (integration) {
      logger.debug(
        { intercomWorkspaceId, workspaceId: integration.workspaceId },
        'Integration cache hit'
      );
    }

    if (!integration) {
      // Cache miss - fetch from database
      const dbIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
        'intercom',
        intercomWorkspaceId
      );

      if (!dbIntegration) {
        // Integration not found - check if user exists to show appropriate canvas
        const user = await this.deps.userRepo.findByEmail(teammateEmail);
        if (!user) {
          logger.debug({ teammateEmail }, 'Teammate access denied: user not found');
          return { status: 'user_not_found' };
        }
        // User exists but integration not connected - prompt to connect
        logger.debug(
          { teammateEmail, intercomWorkspaceId },
          'Teammate access denied: integration not found'
        );
        return { status: 'integration_not_found' };
      }

      // Cache the integration for future lookups
      integration = { workspaceId: dbIntegration.workspaceId };
      await this.deps.cacheService.setIntegrationByProviderWorkspace(
        'intercom',
        intercomWorkspaceId,
        integration
      );
      logger.debug(
        { intercomWorkspaceId, workspaceId: integration.workspaceId },
        'Integration cached'
      );
    }

    // Find user by email
    const user = await this.deps.userRepo.findByEmail(teammateEmail);
    if (!user) {
      logger.debug({ teammateEmail }, 'Teammate access denied: user not found');
      return { status: 'user_not_found' };
    }

    // Find workspace member
    const member = await this.deps.workspaceMemberRepo.findByUserAndWorkspace(
      user.id,
      integration.workspaceId
    );

    if (!member) {
      logger.debug(
        { teammateEmail, workspaceId: integration.workspaceId },
        'Teammate access denied: not workspace member'
      );
      return { status: 'not_workspace_member' };
    }

    return {
      status: 'granted',
      context: {
        workspaceId: integration.workspaceId,
        workspaceMemberId: member.workspaceMemberId,
      },
    };
  }

  // ===========================================================================
  // Private: Error & Canvas Helpers
  // ===========================================================================

  /**
   * Build appropriate canvas when teammate access is denied
   */
  private buildAccessDeniedCanvas(
    result: Exclude<TeammateAccessResult, { status: 'granted' }>,
    teammateEmail: string
  ): CanvasResponse {
    switch (result.status) {
      case 'user_not_found':
        return { canvas: buildSignUpCanvas({ adminEmail: teammateEmail }) };
      case 'integration_not_found':
        return { canvas: buildConnectIntegrationCanvas({ adminEmail: teammateEmail }) };
      case 'not_workspace_member':
        return { canvas: buildAccessRequestedCanvas({ adminEmail: teammateEmail }) };
    }
  }

  /**
   * Handle link creation errors
   */
  private handleLinkCreationError(error: unknown, workspaceId: string): CanvasResponse {
    // Handle expected business errors
    if (error && typeof error === 'object' && 'code' in error) {
      const errorWithCode = error as { code: string };
      if (errorWithCode.code === 'PLAN_LIMIT_EXCEEDED') {
        logger.debug({ workspaceId }, 'Link creation failed: plan limit exceeded');
        return { canvas: buildLimitExceededCanvas({ workspaceId, limitType: 'links' }) };
      }
    }

    // Unexpected error - log and capture in PostHog
    logger.error({ err: error, workspaceId }, 'Link creation failed unexpectedly');
    captureException(error, undefined, {
      component: 'intercom_canvas',
      operation: 'link_creation',
      workspace_id: workspaceId,
    });

    return { canvas: buildCanvasErrorCanvas() };
  }

  /**
   * Get projects and domains for a workspace
   */
  private async getProjectsAndDomains(
    workspaceId: string
  ): Promise<{ projects: ProjectOption[]; domains: DomainOption[] }> {
    const [projectRows, domainRows] = await Promise.all([
      this.deps.projectRepo.findByWorkspace(workspaceId),
      this.deps.domainRepo.findByWorkspaceId(workspaceId),
    ]);

    return {
      projects: projectRows.map((p) => ({ id: p.projectId, title: p.projectTitle })),
      domains: domainRows.map((d) => ({ id: d.domainId, url: d.domainUrl })),
    };
  }
}
