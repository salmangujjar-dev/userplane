/**
 * IntercomService - Handles Intercom OAuth flow and integration management
 * Orchestrates OAuth authorization, token exchange, workspace creation, and admin invites
 * Supports two flows:
 * 1. Onboarding flow: Creates a new workspace during OAuth (no workspaceId in state)
 * 2. Workspace integration flow: Connects to existing workspace (workspaceId in state)
 */

import type { CacheService } from '@userplane/cache';
import {
  createProviderMeta,
  createProviderToken,
  FormEmailSchema,
  type IntercomAdminItem,
  type IntercomRegion,
  provisionerError,
  workspaceError,
} from '@userplane/contract';

import {
  detectRegionAndGetMe,
  exchangeCodeForToken,
  extractRegionFromCode,
  getAuthorizationUrl,
  getMeWithRegion,
  type IntercomAdmin,
  type IntercomMeResponse,
  listAdmins,
} from '@/api/clients/intercom';
import { generateIntegrationId } from '@/api/lib/id';
import { deriveWorkspaceUrl } from '@/api/lib/workspace';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { InviteService } from '@/api/services/invite.service';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { TokenService } from '@/api/services/token.service';
import type { IntercomOAuthSource } from '@/api/types';

export interface IntercomServiceDeps {
  tokenService: TokenService;
  integrationRepo: IntegrationRepository;
  provisionerService: ProvisionerService;
  inviteService: InviteService;
  cacheService: CacheService;
  memberRepo: WorkspaceMemberRepository;
}

type WorkspaceCreationResult =
  | { created: false; workspaceUrl?: string }
  | { created: true; workspaceId: string; workspaceName: string };

/**
 * Integration status result
 */
export interface IntegrationStatus {
  connected: boolean;
  providerWorkspaceId: string | null;
  connectedAt: Date | null;
}

/**
 * Integration connect result (workspace integration flow)
 */
export interface IntegrationConnectResult {
  connected: true;
  providerWorkspaceId: string;
}

/** Maximum number of admin suggestions to return */
const MAX_ADMIN_SUGGESTIONS = 10;

export class IntercomService {
  constructor(private deps: IntercomServiceDeps) {}

  /**
   * Generate OAuth authorization URL with signed state token
   * @param userId - The user initiating the OAuth flow
   * @param workspaceId - Optional workspace ID for workspace integration flow
   * @param source - Origin of the OAuth flow for callback routing
   */
  generateAuthorizationUrl(
    userId: string,
    workspaceId?: string,
    source?: IntercomOAuthSource
  ): { authorizationUrl: string; state: string } {
    const state = this.deps.tokenService.signIntercomOAuthState(userId, workspaceId, source);
    const authorizationUrl = getAuthorizationUrl(state);

    return { authorizationUrl, state };
  }

  /**
   * Handle Intercom workspace creation
   * Creates workspace, Intercom integration, and sends admin invites
   * @param params - The parameters for the workspace creation operation
   * @param params.me - The Intercom me response
   * @param params.region - The region of the Intercom API
   * @param params.accessToken - The access token for the Intercom API
   * @param params.userId - The user ID of the user who is creating the workspace
   * @param params.userName - The name of the user who is creating the workspace
   * @param params.userAuthEmail - The email of the user who is creating the workspace
   * @returns The workspace creation result
   */
  private async handleIntercomCreation(params: {
    me: IntercomMeResponse;
    region: IntercomRegion;
    accessToken: string;
    userId: string;
    userName?: string;
    userAuthEmail: string;
    userRole?: string | null;
  }): Promise<WorkspaceCreationResult> {
    const { me, region, accessToken, userId, userName, userAuthEmail, userRole } = params;

    // 1. Derive workspace URL and name from Intercom email domain and app name
    const workspaceUrl = deriveWorkspaceUrl(me.email);
    const workspaceName = me.app.name;

    // 2. Create workspace using ProvisionerService
    // This handles workspace, project, domain, member, entitlement creation,
    // and workspace creation rate limit checks
    const result = await this.deps.provisionerService.createWorkspaceByURLAndName({
      url: workspaceUrl,
      workspaceName: workspaceName,
      userId,
      userName,
      // Use user email for creating the workspace
      userEmail: userAuthEmail,
      userRole,
    });

    // Handle discriminated union: check if workspace was created
    if (!result.created) {
      throw provisionerError.PROVISIONER_WORKSPACE_CREATE_FAILED();
    }

    const workspace = {
      workspaceId: result.workspaceId,
      workspaceName: result.workspaceName,
    };

    // 3. Create integration record
    await this.deps.integrationRepo.create({
      id: generateIntegrationId(),
      workspaceId: workspace.workspaceId,
      provider: 'intercom',
      providerWorkspaceId: me.app.id_code,
      providerToken: createProviderToken('intercom', { accessToken }),
      providerMeta: createProviderMeta('intercom', { region }),
    });

    // Note: Admin invites are now handled via the UI flow
    // Users can select which admins to invite on the invite page

    return {
      created: true,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
    };
  }

  /**
   * Validate OAuth state token
   * Returns true if state is valid for the given user and optional workspace
   * @param state - The OAuth state token to verify
   * @param userId - The expected user ID
   * @param workspaceId - Optional expected workspace ID for workspace integration flow
   */
  validateState(state: string, userId: string, workspaceId?: string): boolean {
    const payload = this.deps.tokenService.verifyIntercomOAuthState(state, userId, workspaceId);
    return payload !== null;
  }

  /**
   * Handle OAuth callback
   * Exchanges code for token, fetches user info, and creates workspace
   */
  async handleCallback(params: {
    code: string;
    state: string;
    userId: string;
    userName?: string;
    userEmail: string;
    userRole?: string | null;
  }): Promise<WorkspaceCreationResult> {
    const { code, state, userId, userName, userEmail, userRole } = params;

    // 1. Validate state token
    if (!this.validateState(state, userId)) {
      throw provisionerError.INTERCOM_OAUTH_STATE_INVALID();
    }

    // 2. Extract region from authorization code (fast path)
    // Intercom encodes region in the code: base64({code}:{aws-region})
    const extractedRegion = extractRegionFromCode(code);

    // 3. Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    if (!tokenResponse) {
      throw provisionerError.INTERCOM_TOKEN_EXCHANGE_FAILED();
    }

    // 4. Get user info from Intercom /me endpoint
    // Use extracted region if available (fast path), otherwise detect (slow path)
    const meResult = extractedRegion
      ? await getMeWithRegion(tokenResponse.access_token, extractedRegion)
      : await detectRegionAndGetMe(tokenResponse.access_token);
    if (!meResult) {
      throw provisionerError.INTERCOM_USER_INFO_FAILED();
    }

    const { me, region } = meResult;

    // 5. Verify email is verified (security)
    if (!me.email_verified) {
      throw provisionerError.INTERCOM_EMAIL_NOT_VERIFIED();
    }

    // 6. Check if Intercom workspace is already connected
    const existingIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      me.app.id_code
    );
    if (existingIntegration) {
      throw provisionerError.INTERCOM_WORKSPACE_ALREADY_CONNECTED();
    }

    // 7. Create workspace and integration
    return this.handleIntercomCreation({
      me,
      region: region as IntercomRegion,
      accessToken: tokenResponse.access_token,
      userId,
      userName,
      userAuthEmail: userEmail,
      userRole,
    });
  }

  // ============================================================================
  // WORKSPACE INTEGRATION FLOW (for existing workspaces)
  // ============================================================================

  /**
   * Handle OAuth callback for workspace integration flow
   * Connects Intercom to an existing workspace (no workspace creation)
   */
  async handleIntegrationCallback(params: {
    code: string;
    state: string;
    userId: string;
    workspaceId: string;
  }): Promise<IntegrationConnectResult> {
    const { code, state, userId, workspaceId } = params;

    // 1. Validate state token with workspace ID
    if (!this.validateState(state, userId, workspaceId)) {
      throw provisionerError.INTERCOM_OAUTH_STATE_INVALID();
    }

    // 2. Check if workspace already has an Intercom integration
    const existingWorkspaceIntegration =
      await this.deps.integrationRepo.findByWorkspaceIdAndProvider(workspaceId, 'intercom');
    if (existingWorkspaceIntegration) {
      throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
    }

    // 3. Extract region from authorization code (fast path)
    // Intercom encodes region in the code: base64({code}:{aws-region})
    const extractedRegion = extractRegionFromCode(code);

    // 4. Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    if (!tokenResponse) {
      throw provisionerError.INTERCOM_TOKEN_EXCHANGE_FAILED();
    }

    // 5. Get user info from Intercom /me endpoint
    // Use extracted region if available (fast path), otherwise detect (slow path)
    const meResult = extractedRegion
      ? await getMeWithRegion(tokenResponse.access_token, extractedRegion)
      : await detectRegionAndGetMe(tokenResponse.access_token);
    if (!meResult) {
      throw provisionerError.INTERCOM_USER_INFO_FAILED();
    }

    const { me, region } = meResult;

    // 6. Verify email is verified (security)
    if (!me.email_verified) {
      throw provisionerError.INTERCOM_EMAIL_NOT_VERIFIED();
    }

    // 7. Check if this Intercom workspace is already connected to another userplane workspace
    const existingProviderIntegration = await this.deps.integrationRepo.findByProviderWorkspaceId(
      'intercom',
      me.app.id_code
    );
    if (existingProviderIntegration) {
      throw workspaceError.INTEGRATION_PROVIDER_WORKSPACE_CONFLICT();
    }

    // 8. Create integration record
    await this.deps.integrationRepo.create({
      id: generateIntegrationId(),
      workspaceId,
      provider: 'intercom',
      providerWorkspaceId: me.app.id_code,
      providerToken: createProviderToken('intercom', {
        accessToken: tokenResponse.access_token,
      }),
      providerMeta: createProviderMeta('intercom', { region: region as IntercomRegion }),
    });

    // 9. Warm cache for future lookups
    await this.deps.cacheService.setIntegrationByProviderWorkspace('intercom', me.app.id_code, {
      workspaceId,
    });

    return {
      connected: true,
      providerWorkspaceId: me.app.id_code,
    };
  }

  /**
   * Get integration status for a workspace
   */
  async getIntegrationStatus(workspaceId: string): Promise<IntegrationStatus> {
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'intercom'
    );

    if (!integration) {
      return {
        connected: false,
        providerWorkspaceId: null,
        connectedAt: null,
      };
    }

    return {
      connected: true,
      providerWorkspaceId: integration.providerWorkspaceId,
      connectedAt: integration.createdAt,
    };
  }

  /**
   * Disconnect Intercom integration from a workspace
   * Returns true if disconnected, throws if not found
   */
  async disconnectIntegration(workspaceId: string): Promise<boolean> {
    // Get integration first to retrieve providerWorkspaceId for cache invalidation
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'intercom'
    );

    if (!integration) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    // Delete the integration
    const deleted = await this.deps.integrationRepo.delete(workspaceId, 'intercom');

    if (!deleted) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    // Invalidate caches to prevent stale lookups
    await this.deps.cacheService.invalidateIntercom(workspaceId, integration.providerWorkspaceId);

    return true;
  }

  /**
   * Fetch and normalize admins from Intercom (shared logic)
   * Handles integration lookup, caching, Intercom API call, and email normalization
   * @param workspaceId - The workspace ID
   * @returns Map of normalized email to IntercomAdmin, or throws on error
   */
  private async _fetchAndNormalizeAdmins(workspaceId: string): Promise<Map<string, IntercomAdmin>> {
    // Get integration to retrieve access token and region
    const integration = await this.deps.integrationRepo.findByWorkspaceIdAndProvider(
      workspaceId,
      'intercom'
    );

    if (!integration) {
      throw workspaceError.INTEGRATION_NOT_FOUND();
    }

    // Parse provider token to get access token
    const providerToken = integration.providerToken as { accessToken: string };
    const providerMeta = integration.providerMeta as { region: IntercomRegion };

    // Check cache first for raw Intercom admins
    let admins = await this.deps.cacheService.getIntercomAdmins<IntercomAdmin>(workspaceId);

    // Cache miss - fetch from Intercom API and cache result
    if (!admins) {
      admins = await listAdmins(providerToken.accessToken, providerMeta.region);

      if (!admins || admins.length === 0) {
        return new Map();
      }

      await this.deps.cacheService.setIntercomAdmins(workspaceId, admins);
    }

    // Collect and normalize admin emails, excluding Intercom internal emails
    const adminEmailMap = new Map<string, IntercomAdmin>();
    for (const admin of admins) {
      const emailResult = FormEmailSchema.safeParse(admin.email);
      if (emailResult.success) {
        // Skip Intercom internal/operator emails
        if (emailResult.data.endsWith('@intercom.io')) {
          continue;
        }
        adminEmailMap.set(emailResult.data, admin);
      }
    }

    return adminEmailMap;
  }

  /**
   * Build list of admin items from Intercom, optionally excluding existing members
   * Shared logic for getAdmins and suggestAdmins
   * @param workspaceId - The workspace ID
   * @param options - Configuration for filtering
   * @returns Array of admin items
   */
  private async _buildAdminItemList(
    workspaceId: string,
    options: { excludeMembers: boolean }
  ): Promise<IntercomAdminItem[]> {
    const adminEmailMap = await this._fetchAndNormalizeAdmins(workspaceId);

    if (adminEmailMap.size === 0) {
      return [];
    }

    // Get matching member emails if we need to exclude them
    let memberEmails: Set<string> = new Set();
    if (options.excludeMembers) {
      memberEmails = await this.deps.memberRepo.findMatchingMemberEmails(workspaceId, [
        ...adminEmailMap.keys(),
      ]);
    }

    // Filter and map admins to IntercomAdminItem
    const result: IntercomAdminItem[] = [];
    for (const [normalizedEmail, admin] of adminEmailMap) {
      if (options.excludeMembers && memberEmails.has(normalizedEmail)) {
        continue;
      }

      result.push({
        id: admin.id,
        email: normalizedEmail,
        name: admin.name ?? null,
      });
    }

    return result;
  }

  /**
   * Get all admins from the connected Intercom workspace
   * Optionally filters out admins who are already workspace members
   * @param workspaceId - The workspace ID to get admins for
   * @param excludeMembers - If true, excludes admins who are already workspace members
   */
  async getAdmins(
    workspaceId: string,
    excludeMembers: boolean = false
  ): Promise<IntercomAdminItem[]> {
    return this._buildAdminItemList(workspaceId, { excludeMembers });
  }

  /**
   * Get suggested admins from Intercom for invite modal
   * Always excludes existing members and returns empty array on any error (graceful degradation)
   * @param workspaceId - The workspace ID
   * @param options - Optional configuration { limit?: number }
   * @returns Object with suggestions array and hasMore flag (never throws)
   */
  async suggestAdmins(
    workspaceId: string,
    options?: { limit?: number }
  ): Promise<{ suggestions: IntercomAdminItem[]; hasMore: boolean }> {
    try {
      const limit = Math.min(options?.limit ?? 5, MAX_ADMIN_SUGGESTIONS);

      const admins = await this._buildAdminItemList(workspaceId, { excludeMembers: true });

      const hasMore = admins.length > limit;
      const suggestions = hasMore ? admins.slice(0, limit) : admins;

      return { suggestions, hasMore };
    } catch {
      // Graceful degradation - return empty array on any error
      return { suggestions: [], hasMore: false };
    }
  }
}
