/**
 * AdminWorkspaceService - Business logic for admin workspace operations
 * Handles workspace management, deactivation, and token reset
 */

import type {
  AdminWorkspaceProvisionData,
  AdminWorkspaceProvisionInput,
} from '@workspace/contract';
import { adminError, DEFAULT_TRIAL_PERIOD_DAYS } from '@workspace/contract';

import { generateInviteToken } from '@/api/lib/id';
import { createLogger } from '@/api/lib/logger';
import { deriveWorkspaceName } from '@/api/lib/workspace';
import type {
  AdminWorkspaceRepository,
  SearchWorkspaceProjectsParams,
  SearchWorkspacesParams,
} from '@/api/repositories/admin-workspace.repository';
import type { AdminPlanService } from '@/api/services/admin-plan.service';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { UserService } from '@/api/services/user.service';
import type { WorkspaceService } from '@/api/services/workspace.service';

const logger = createLogger('admin-workspace-service');

export interface AdminWorkspaceServiceDeps {
  adminWorkspaceRepo: AdminWorkspaceRepository;
  workspaceService: WorkspaceService;
  userService: UserService;
  adminPlanService: AdminPlanService;
  provisionerService: ProvisionerService;
  dashboardBaseUrl: string;
}

export class AdminWorkspaceService {
  constructor(private deps: AdminWorkspaceServiceDeps) {}

  /**
   * Search workspaces with entity counts
   */
  async searchWorkspaces(params: SearchWorkspacesParams) {
    return this.deps.adminWorkspaceRepo.searchWorkspaces(params);
  }

  /**
   * Get workspace detail
   * Note: Members are fetched separately via listWorkspaceMembers
   */
  async getWorkspaceDetail(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    const counts = await this.deps.adminWorkspaceRepo.getWorkspaceCounts(workspaceId);

    return {
      ...workspace,
      ...counts,
    };
  }

  /**
   * List workspace members with pagination
   */
  async listWorkspaceMembers(workspaceId: string, options: { limit: number; offset: number }) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    return this.deps.adminWorkspaceRepo.getWorkspaceMembers(workspaceId, options);
  }

  /**
   * Search workspace projects with pagination, filtering, and sorting
   */
  async searchWorkspaceProjects(params: SearchWorkspaceProjectsParams) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(params.workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    return this.deps.adminWorkspaceRepo.searchWorkspaceProjects(params);
  }

  /**
   * Deactivate (soft delete) a workspace
   * Delegates to WorkspaceService.deleteWorkspace for consistent deletion logic
   */
  async deactivateWorkspace(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    if (workspace.isDeleted) {
      throw adminError.WORKSPACE_ALREADY_DEACTIVATED();
    }

    // Use workspace service for deletion to ensure all related entities are properly soft-deleted
    const deletedAt = new Date();
    await this.deps.workspaceService.deleteWorkspace(workspaceId, deletedAt);

    // Return full detail
    return this.getWorkspaceDetail(workspaceId);
  }

  /**
   * Restore a soft-deleted workspace
   * Delegates to WorkspaceService.restoreWorkspace for consistent restoration logic
   */
  async restoreWorkspace(workspaceId: string) {
    // Use workspace service for restoration to ensure all related entities are properly restored
    const result = await this.deps.workspaceService.restoreWorkspace(workspaceId);

    // Return the restoration result with full details
    return result;
  }

  /**
   * Reset workspace invite token
   */
  async resetInviteToken(workspaceId: string) {
    const workspace = await this.deps.adminWorkspaceRepo.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    const newToken = generateInviteToken();
    const updated = await this.deps.adminWorkspaceRepo.resetInviteToken(workspaceId, newToken);
    if (!updated) {
      throw adminError.WORKSPACE_NOT_FOUND();
    }

    // Return full detail
    return this.getWorkspaceDetail(workspaceId);
  }

  /**
   * Provision a workspace for an admin workflow
   */
  async provisionWorkspace(
    params: AdminWorkspaceProvisionInput['body'] & { adminRequestHeaders: Headers }
  ): Promise<AdminWorkspaceProvisionData> {
    const { email, name, workspaceDomain, workspaceName, adminRequestHeaders } = params;

    // Get or create a user
    let user: { id: string; name: string; email: string };
    let isNewUser: boolean;
    try {
      const userResult = await this.deps.userService.getOrCreateUser({
        email,
        name,
        headers: adminRequestHeaders,
      });
      user = userResult.user;
      isNewUser = userResult.isNewUser;
    } catch (error) {
      logger.error({ err: error, email }, 'Failed to create user during admin workspace provision');
      throw adminError.ADMIN_WORKSPACE_PROVISION_USER_CREATE_FAILED({ email });
    }

    // Resolve the workspace name
    const resolvedWorkspaceName = workspaceName || deriveWorkspaceName(workspaceDomain, name);

    // Provision the workspace
    const result = await this.deps.provisionerService.createWorkspaceByURLAndName({
      url: workspaceDomain,
      workspaceName: resolvedWorkspaceName,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });

    if (!result.created) {
      throw adminError.ADMIN_WORKSPACE_PROVISION_WORKSPACE_EXISTS();
    }

    const workspaceUrl = `${this.deps.dashboardBaseUrl}/workspace/${result.workspaceId}/recordings`;

    // Resolve the product id
    const resolvedProductId = await this.resolveProductId(params, resolvedWorkspaceName);

    if (!resolvedProductId) {
      return {
        checkoutUrl: null,
        workspaceUrl,
        workspaceId: result.workspaceId,
        workspaceName: result.workspaceName,
        userId: user.id,
        isNewUser,
      };
    }

    // Resolve trial period (only for existing/custom plan modes)
    const trialPeriodDays =
      'trialPeriodDays' in params
        ? Number(params.trialPeriodDays ?? String(DEFAULT_TRIAL_PERIOD_DAYS))
        : undefined;

    // Now checkout for the product and return the checkout url
    const checkoutUrl = await this.createCheckout(
      resolvedProductId,
      result.workspaceId,
      email,
      name,
      trialPeriodDays
    );

    return {
      checkoutUrl,
      workspaceUrl,
      workspaceId: result.workspaceId,
      workspaceName: result.workspaceName,
      userId: user.id,
      isNewUser,
    };
  }

  private async resolveProductId(
    params: AdminWorkspaceProvisionInput['body'],
    workspaceName: string
  ) {
    if (params.planMode === 'free') {
      return undefined;
    }

    if (params.planMode === 'existing') {
      return params.productId;
    }

    try {
      const createdPlan = await this.deps.adminPlanService.createPlan({
        name: workspaceName,
        description: `${workspaceName}'s custom plan`,
        price: params.customPlan.price,
        featureLimits: params.customPlan.featureLimits,
        featureGates: params.customPlan.featureGates,
      });
      return createdPlan.productId;
    } catch (error) {
      logger.error({ err: error }, 'Failed to create plan during admin workspace provision');
      throw adminError.ADMIN_WORKSPACE_PROVISION_PLAN_CREATE_FAILED();
    }
  }

  private async createCheckout(
    productId: string,
    workspaceId: string,
    email: string,
    name: string,
    trialPeriodDays?: number
  ) {
    try {
      await this.deps.adminPlanService.verifyProductExists(productId);
    } catch {
      throw adminError.ADMIN_WORKSPACE_PROVISION_PRODUCT_NOT_FOUND({ productId });
    }

    try {
      return await this.deps.adminPlanService.createCheckoutSession({
        productId,
        workspaceId,
        email,
        name,
        returnUrl: `${this.deps.dashboardBaseUrl}/workspace/${workspaceId}/settings?tab=plan-usage`,
        trialPeriodDays,
      });
    } catch (error) {
      logger.error(
        { err: error, productId },
        'Failed to create checkout during admin workspace provision'
      );
      throw adminError.ADMIN_WORKSPACE_PROVISION_CHECKOUT_FAILED({ productId });
    }
  }
}
