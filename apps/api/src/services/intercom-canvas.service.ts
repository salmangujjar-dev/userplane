/**
 * IntercomCanvasService - Business logic for Intercom Canvas Kit integration
 * Handles initialize, configure, and submit flows for the Inbox and Messenger apps
 */

import {
  buildAccessRequestedCanvas,
  buildCanvasErrorCanvas,
  buildConnectIntegrationCanvas,
  // buildIntegrationNotFoundCanvas,
  buildLimitExceededCanvas,
  buildLinkCreatorCanvas,
  buildOpenerCanvas,
  buildRecordingCanvas,
  buildSignUpCanvas,
  buildSuccessCanvas,
  type DomainOption,
  type ProjectOption,
} from '@/api/lib/intercom-canvas';
import type { DomainRepository } from '@/api/repositories/domains.repository';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { ProjectRepository } from '@/api/repositories/projects.repository';
import type { UserRepository } from '@/api/repositories/users.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { LinkService } from '@/api/services/link.service';
import type {
  CanvasInputValues,
  CanvasResponse,
  ConfigureResponse,
  IntercomAdmin,
  IntercomCanvasConfigureRequest,
  IntercomCanvasInitializeRequest,
  IntercomCanvasSubmitRequest,
  IntercomConversation,
  MessengerLocation,
} from '@/api/types/intercom-canvas';

export interface IntercomCanvasServiceDeps {
  integrationRepo: IntegrationRepository;
  userRepo: UserRepository;
  workspaceMemberRepo: WorkspaceMemberRepository;
  linkService: LinkService;
  projectRepo: ProjectRepository;
  domainRepo: DomainRepository;
  entitlementService: EntitlementService;
  workspaceRepo: WorkspaceRepository;
}

interface WorkspaceContext {
  workspaceId: string;
  workspaceMemberId: string;
}

/**
 * Result of admin access verification
 */
type AdminAccessResult =
  | { status: 'granted'; context: WorkspaceContext }
  | { status: 'user_not_found' }
  | { status: 'not_workspace_member' };

/**
 * Result of user existence check
 */
interface UserExists {
  userId: string;
}

/**
 * Messenger location values per Intercom Canvas Kit spec
 */
const MESSENGER_LOCATIONS: MessengerLocation[] = ['conversation', 'home', 'message'];

/**
 * Check if location is a messenger context (customer-facing)
 */
function isMessengerLocation(location?: string): location is MessengerLocation {
  return MESSENGER_LOCATIONS.includes(location as MessengerLocation);
}

export class IntercomCanvasService {
  constructor(private deps: IntercomCanvasServiceDeps) {}

  /**
   * Handle initialize request from Intercom Canvas Kit
   * Routes to appropriate canvas based on context (inbox vs messenger)
   *
   * Messenger locations: 'conversation', 'home', 'message' - customer-facing
   * Inbox location: 'inbox' - teammate-facing
   */
  async handleInitialize(req: IntercomCanvasInitializeRequest): Promise<CanvasResponse> {
    const { context, admin, user, card_creation_options, workspace_id } = req;
    const location = context?.location;

    // Messenger context: customer is viewing the card
    // Identified by messenger locations OR presence of user object without admin
    if (isMessengerLocation(location) || (user && !admin)) {
      return this.handleMessengerInitialize(card_creation_options);
    }

    // Inbox context: teammate is viewing the app
    // Requires admin and workspace_id
    if (!admin || !workspace_id) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    return this.handleInboxInitialize(workspace_id, admin);
  }

  /**
   * Handle configure request for card creation flow
   * This flow is used when teammate inserts the app into a conversation
   *
   * Flow:
   * 1. Initial request: Show link creator canvas
   * 2. Teammate selects project/domain and clicks "Create Link"
   * 3. Create the link and return results with link_url
   * 4. Results become card_creation_options for initialize flow
   */
  async handleConfigure(
    req: IntercomCanvasConfigureRequest
  ): Promise<ConfigureResponse | CanvasResponse> {
    const {
      admin: intercomAdmin,
      workspace_id: intercomWorkspaceId,
      component_id,
      input_values,
    } = req;

    if (!intercomAdmin || !intercomWorkspaceId) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    // If component_id is present, this is a subsequent request (teammate interaction)
    if (component_id) {
      return this.handleConfigureSubmit(
        intercomAdmin,
        component_id,
        intercomWorkspaceId,
        req.context?.conversation_id?.toString(),
        input_values
      );
    }

    // Initial configure request: show link creator canvas
    return this.handleConfigureInitial(intercomWorkspaceId, intercomAdmin);
  }

  /**
   * Handle initial configure request - show link creator canvas
   */
  private async handleConfigureInitial(
    intercomWorkspaceId: string,
    intercomAdmin: IntercomAdmin
  ): Promise<CanvasResponse> {
    // Find integration
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      intercomWorkspaceId
    );

    const intercomAdminEmail = intercomAdmin.email;

    if (!integration) {
      return this.buildIntegrationNotFoundResponse(intercomAdminEmail);
    }

    // Verify admin access
    const accessResult = await this.verifyAdminAccess(integration.workspaceId, intercomAdminEmail);

    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, intercomAdminEmail);
    }

    // Check if link limit exceeded
    const canAddLink = await this.deps.entitlementService.canConsumeLinks(integration.workspaceId);
    if (!canAddLink.allowed) {
      return {
        canvas: buildLimitExceededCanvas({
          workspaceId: integration.workspaceId,
          limitType: 'links',
        }),
      };
    }

    // Get projects and domains for dropdowns
    const { projects, domains } = await this.getProjectsAndDomains(integration.workspaceId);

    if (projects.length === 0 || domains.length === 0) {
      return {
        canvas: buildCanvasErrorCanvas(),
      };
    }

    return {
      canvas: buildLinkCreatorCanvas({
        projects,
        domains,
        adminName: intercomAdmin.name || intercomAdminEmail,
      }),
    };
  }

  /**
   * Handle configure submit - teammate clicked a button in configure canvas
   * Returns results object when link is created, which ends configure flow
   */
  private async handleConfigureSubmit(
    intercomAdmin: IntercomAdmin,
    componentId: string,
    intercomWorkspaceId: string,
    intercomConversationId?: string,
    inputValues?: CanvasInputValues
  ): Promise<ConfigureResponse | CanvasResponse> {
    switch (componentId) {
      case 'create_link':
        return this.handleConfigureCreateLink(
          intercomAdmin,
          intercomWorkspaceId,
          intercomConversationId,
          inputValues
        );

      case 'go_back':
        // Return to initial configure canvas
        return this.handleConfigureInitial(intercomWorkspaceId, intercomAdmin);

      default:
        return { canvas: buildCanvasErrorCanvas() };
    }
  }

  /**
   * Handle link creation in configure flow
   * Creates link and returns results to complete configure flow
   */
  private async handleConfigureCreateLink(
    intercomAdmin: IntercomAdmin,
    intercomWorkspaceId: string,
    intercomConversationId?: string,
    inputValues?: CanvasInputValues
  ): Promise<ConfigureResponse | CanvasResponse> {
    if (!inputValues) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    const projectId = inputValues.project_id as string | undefined;
    const domainId = inputValues.domain_id as string | undefined;
    const customMessage = inputValues.custom_message as string | undefined;

    if (!projectId || !domainId) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    // Find integration
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      intercomWorkspaceId
    );

    const intercomAdminEmail = intercomAdmin.email;

    if (!integration) {
      return this.buildIntegrationNotFoundResponse(intercomAdminEmail);
    }

    // Verify admin access
    const accessResult = await this.verifyAdminAccess(integration.workspaceId, intercomAdminEmail);

    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, intercomAdminEmail);
    }

    // Fetch workspace preferences for footer
    const workspacePreferences = await this.deps.workspaceRepo.findPreferencesById(
      integration.workspaceId
    );

    const intercomConversationUrl = `https://app.intercom.com/a/inbox/${intercomWorkspaceId}/inbox/shared/all/conversation/${intercomConversationId}`;

    const intercomConversationTitle = `Intercom #${intercomConversationId}`;

    // Create the recording link with explicit provider info
    try {
      const link = await this.deps.linkService.createWithProvider({
        workspaceId: integration.workspaceId,
        projectId,
        domainId,
        createdBy: accessResult.context.workspaceMemberId,
        linkReusable: false,
        linkProviderType: 'intercom',
        linkTitle: intercomConversationTitle,
        linkProviderId: intercomConversationId,
        linkProviderRef: intercomConversationUrl,
      });

      // Generate link URL
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

      // Generate default message with admin's name
      const adminName = intercomAdmin.name || intercomAdminEmail;
      const defaultMessage = `${adminName} has requested a screen recording`;
      const messageToUse = customMessage?.trim() || defaultMessage;

      // Return results to complete configure flow
      // These values become card_creation_options in initialize
      return {
        results: {
          link_url: linkUrl,
          custom_message: messageToUse,
          footer: workspacePreferences?.recordingFootnote ?? null,
        },
      };
    } catch (error) {
      // Check for limit exceeded error
      if (error && typeof error === 'object' && 'code' in error) {
        const errorWithCode = error as { code: string };
        if (errorWithCode.code === 'LINK_LIMIT_EXCEEDED') {
          return {
            canvas: buildLimitExceededCanvas({
              workspaceId: integration.workspaceId,
              limitType: 'links',
            }),
          };
        }
      }

      return { canvas: buildCanvasErrorCanvas() };
    }
  }

  /**
   * Handle submit request from Intercom Canvas Kit
   * Routes to appropriate handler based on context and component_id
   *
   * Messenger submits: handled by handleMessengerSubmit (customer actions)
   * Inbox submits: handled by handleInboxSubmit (teammate actions)
   */
  async handleSubmit(req: IntercomCanvasSubmitRequest): Promise<CanvasResponse> {
    const { component_id, context, workspace_id } = req;

    if (!component_id || !workspace_id) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    const location = context?.location;

    // Route based on context location
    if (isMessengerLocation(location) || (req.user && !req.admin)) {
      return this.handleMessengerSubmit(req);
    }

    return this.handleInboxSubmit(req);
  }

  /**
   * Handle submit from Messenger context (customer actions)
   * Currently the recording canvas uses URL action, so submits shouldn't occur
   * This is a safety handler for future messenger interactions
   */
  private handleMessengerSubmit(req: IntercomCanvasSubmitRequest): CanvasResponse {
    const { component_id, current_canvas } = req;

    // For now, messenger cards don't have submit actions
    // The recording button uses URL action type, not submit
    // This handles any unexpected submits gracefully
    switch (component_id) {
      default: {
        // If we have stored link URL, show recording canvas again
        const storedLinkUrl = current_canvas?.stored_data?.link_url as string | undefined;
        if (storedLinkUrl) {
          return {
            canvas: buildRecordingCanvas({
              linkUrl: storedLinkUrl,
              linkTitle: current_canvas?.stored_data?.link_title as string | undefined,
              customMessage: current_canvas?.stored_data?.custom_message as string | undefined,
              footer: current_canvas?.stored_data?.footer as string | null | undefined,
            }),
          };
        }
        return { canvas: buildCanvasErrorCanvas() };
      }
    }
  }

  /**
   * Handle submit from Inbox context (teammate actions)
   * Routes to appropriate handler based on component_id
   */
  private async handleInboxSubmit(req: IntercomCanvasSubmitRequest): Promise<CanvasResponse> {
    const {
      component_id,
      admin: intercomAdmin,
      input_values,
      workspace_id: intercomWorkspaceId,
      conversation,
    } = req;

    if (!intercomAdmin || !intercomWorkspaceId) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    switch (component_id) {
      case 'request_recording':
        return this.handleRequestRecording(intercomWorkspaceId, intercomAdmin);

      case 'create_link':
        return this.handleCreateLink(
          intercomWorkspaceId,
          conversation,
          intercomAdmin,
          input_values
        );

      case 'go_back':
      case 'done':
      case 'retry':
        return this.handleInboxInitialize(intercomWorkspaceId, intercomAdmin);

      case 'create_another':
        return this.handleRequestRecording(intercomWorkspaceId, intercomAdmin);

      default:
        return { canvas: buildCanvasErrorCanvas() };
    }
  }

  /**
   * Handle inbox app initialization for teammate
   * Verifies admin access and returns opener canvas
   */
  private async handleInboxInitialize(
    providerWorkspaceId: string,
    intercomAdmin?: IntercomAdmin
  ): Promise<CanvasResponse> {
    if (!intercomAdmin) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    // Find integration by provider workspace ID
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      providerWorkspaceId
    );

    const intercomAdminEmail = intercomAdmin.email;

    if (!integration) {
      // Integration not found - check if user exists and has workspaces
      return this.buildIntegrationNotFoundResponse(intercomAdminEmail);
    }

    // Verify admin is a workspace member
    const accessResult = await this.verifyAdminAccess(integration.workspaceId, intercomAdminEmail);

    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, intercomAdminEmail);
    }

    // Return opener canvas with recordings URL filtered by this teammate
    return {
      canvas: buildOpenerCanvas({
        workspaceId: integration.workspaceId,
        workspaceMemberId: accessResult.context.workspaceMemberId,
      }),
    };
  }

  /**
   * Handle messenger card initialization for customer
   * Shows the recording canvas with the link from card_creation_options
   */
  private handleMessengerInitialize(cardCreationOptions?: {
    link_url?: string;
    link_title?: string;
    custom_message?: string;
    footer?: string | null;
  }): CanvasResponse {
    if (!cardCreationOptions?.link_url) {
      return {
        canvas: buildCanvasErrorCanvas(),
      };
    }

    return {
      canvas: buildRecordingCanvas({
        linkUrl: cardCreationOptions.link_url,
        linkTitle: cardCreationOptions.link_title,
        customMessage: cardCreationOptions.custom_message,
        footer: cardCreationOptions.footer,
      }),
    };
  }

  /**
   * Handle "Request recording" button click
   * Shows link creator canvas with project/domain dropdowns
   */
  private async handleRequestRecording(
    providerWorkspaceId: string,
    admin?: IntercomAdmin
  ): Promise<CanvasResponse> {
    if (!admin) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    // Find integration
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      providerWorkspaceId
    );

    if (!integration) {
      return this.buildIntegrationNotFoundResponse(admin.email);
    }

    // Verify admin access
    const accessResult = await this.verifyAdminAccess(integration.workspaceId, admin.email);

    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, admin.email);
    }

    // Check if link limit exceeded
    const canAddLink = await this.deps.entitlementService.canConsumeLinks(integration.workspaceId);
    if (!canAddLink.allowed) {
      return {
        canvas: buildLimitExceededCanvas({
          workspaceId: integration.workspaceId,
          limitType: 'links',
        }),
      };
    }

    // Get projects and domains
    const { projects, domains } = await this.getProjectsAndDomains(integration.workspaceId);

    if (projects.length === 0 || domains.length === 0) {
      return {
        canvas: buildCanvasErrorCanvas(),
      };
    }

    return {
      canvas: buildLinkCreatorCanvas({
        projects,
        domains,
        adminName: admin.name || admin.email,
      }),
    };
  }

  /**
   * Handle "Create Link" button click
   * Creates a recording link and returns success canvas with card_creation_options
   */
  private async handleCreateLink(
    intercomWorkspaceId: string,
    intercomConversation?: IntercomConversation,
    admin?: IntercomAdmin,
    inputValues?: Record<string, string | string[] | undefined>
  ): Promise<CanvasResponse> {
    if (!admin || !inputValues) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    const projectId = inputValues.project_id as string;
    const domainId = inputValues.domain_id as string;
    const customMessage = inputValues.custom_message as string | undefined;

    if (!projectId || !domainId) {
      return { canvas: buildCanvasErrorCanvas() };
    }

    // Find integration
    const integration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      intercomWorkspaceId
    );

    if (!integration) {
      return this.buildIntegrationNotFoundResponse(admin.email);
    }

    // Verify admin access
    const accessResult = await this.verifyAdminAccess(integration.workspaceId, admin.email);

    if (accessResult.status !== 'granted') {
      return this.buildAccessDeniedCanvas(accessResult, admin.email);
    }

    // Fetch workspace preferences for footer
    const workspacePreferences = await this.deps.workspaceRepo.findPreferencesById(
      integration.workspaceId
    );

    const intercomConversationId = intercomConversation?.id;

    const intercomConversationUrl = `https://app.intercom.com/a/inbox/${intercomWorkspaceId}/inbox/shared/all/conversation/${intercomConversationId}`;

    const intercomConversationTitle = `Intercom #${intercomConversationId}`;

    // Create the recording link with explicit provider info
    try {
      const link = await this.deps.linkService.createWithProvider({
        workspaceId: integration.workspaceId,
        projectId,
        domainId,
        createdBy: accessResult.context.workspaceMemberId,
        linkReusable: false,
        linkProviderType: 'intercom',
        linkTitle: intercomConversationTitle,
        linkProviderId: intercomConversationId,
        linkProviderRef: intercomConversationUrl,
      });

      // Generate link URL
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

      // Generate default message with admin's name
      const adminName = admin.name || admin.email;
      const defaultMessage = `${adminName} has requested a screen recording from you`;
      const messageToUse = customMessage?.trim() || defaultMessage;

      // Return success canvas with card_creation_options
      return {
        canvas: buildSuccessCanvas({
          linkUrl,
          message: 'The recording link will be sent to the customer.',
        }),
        card_creation_options: {
          link_url: linkUrl,
          custom_message: messageToUse,
          footer: workspacePreferences?.recordingFootnote ?? null,
        },
      };
    } catch (error) {
      // Check for limit exceeded error
      if (error && typeof error === 'object' && 'code' in error) {
        const errorWithCode = error as { code: string };
        if (errorWithCode.code === 'LINK_LIMIT_EXCEEDED') {
          return {
            canvas: buildLimitExceededCanvas({
              workspaceId: integration.workspaceId,
              limitType: 'links',
            }),
          };
        }
      }

      return { canvas: buildCanvasErrorCanvas() };
    }
  }

  /**
   * Verify that the admin (Intercom teammate) is a member of the workspace
   * Returns detailed result indicating why access was denied
   */
  private async verifyAdminAccess(
    workspaceId: string,
    adminEmail: string
  ): Promise<AdminAccessResult> {
    // Find user by email
    const user = await this.deps.userRepo.findByEmail(adminEmail);
    if (!user) {
      return { status: 'user_not_found' };
    }

    // Find workspace member
    const member = await this.deps.workspaceMemberRepo.findByUserAndWorkspace(user.id, workspaceId);

    if (!member) {
      return { status: 'not_workspace_member' };
    }

    return {
      status: 'granted',
      context: {
        workspaceId,
        workspaceMemberId: member.workspaceMemberId,
      },
    };
  }

  /**
   * Check if user exists by email
   * Used to determine what canvas to show when integration is not found
   */
  private async findUserByEmail(adminEmail: string): Promise<UserExists | null> {
    const user = await this.deps.userRepo.findByEmail(adminEmail);
    if (!user) {
      return null;
    }

    return { userId: user.id };
  }

  /**
   * Build appropriate canvas when admin access is denied
   */
  private buildAccessDeniedCanvas(
    result: Exclude<AdminAccessResult, { status: 'granted' }>,
    adminEmail: string
  ): CanvasResponse {
    switch (result.status) {
      case 'user_not_found':
        return { canvas: buildSignUpCanvas({ adminEmail }) };
      case 'not_workspace_member':
        return { canvas: buildAccessRequestedCanvas({ adminEmail }) };
    }
  }

  /**
   * Build appropriate canvas when integration is not found
   * Checks if user exists to show relevant message
   */
  private async buildIntegrationNotFoundResponse(adminEmail: string): Promise<CanvasResponse> {
    const userExists = await this.findUserByEmail(adminEmail);

    if (!userExists) {
      // User doesn't exist in Userplane - show sign up
      return { canvas: buildSignUpCanvas({ adminEmail }) };
    }

    // User exists - show connect integration
    // They can choose which workspace to connect from the settings page
    return {
      canvas: buildConnectIntegrationCanvas({
        adminEmail,
      }),
    };
  }

  /**
   * Get projects and domains for a workspace
   * Returns arrays suitable for dropdown options
   */
  private async getProjectsAndDomains(
    workspaceId: string
  ): Promise<{ projects: ProjectOption[]; domains: DomainOption[] }> {
    // Fetch projects (non-paginated, all active projects)
    const projectRows = await this.deps.projectRepo.findByWorkspace(workspaceId);
    const projects: ProjectOption[] = projectRows.map((p) => ({
      id: p.projectId,
      title: p.projectTitle,
    }));

    // Fetch domains (non-paginated, all active domains)
    const domainRows = await this.deps.domainRepo.findByWorkspaceId(workspaceId);
    const domains: DomainOption[] = domainRows.map((d) => ({
      id: d.domainId,
      url: d.domainUrl,
    }));

    return { projects, domains };
  }
}
