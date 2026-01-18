/**
 * ProvisionerService - Facade service for workspace provisioning
 * Orchestrates workspace creation with all related resources
 */

import { provisionerError } from '@workspace/contract';
import type { DbClient } from '@workspace/db';
import type { PlanId } from '@workspace/pricing';

import { deriveWorkspaceName } from '@/api/lib/workspace';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { DomainService } from '@/api/services/domain.service';
import { ProjectService } from '@/api/services/project.service';
import { TokenService } from '@/api/services/token.service';
import { WorkspaceService } from '@/api/services/workspace.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { extractWorkspaceDetailsFromInviteToken } from '@/api/utils/token';

export interface ProvisionerServiceDeps {
  workspaceService: WorkspaceService;
  projectService: ProjectService;
  workspaceMemberService: WorkspaceMemberService;
  domainService: DomainService;
  tokenService: TokenService;
  workspaceRepo: WorkspaceRepository;
  db: DbClient;
}

export class ProvisionerService {
  constructor(private deps: ProvisionerServiceDeps) {}

  /**
   * Create workspace with all related resources
   * Orchestrates workspace, project, member, and domain creation
   * Accepts URL directly or via invite token
   * Optionally accepts an invite token to create workspace with predetermined details
   * Throws PROVISIONER_URL_REQUIRED if no URL provided
   * Throws PROVISIONER_INVITE_TOKEN_INVALID if token is invalid
   * Throws PROVISIONER_WORKSPACE_EXISTS if workspace with predetermined ID exists
   * Throws PROVISIONER_WORKSPACE_CREATE_FAILED if workspace creation fails
   * Throws PROVISIONER_TRANSACTION_FAILED if transaction fails
   */
  async createWorkspace(params: {
    url?: string;
    userId: string;
    userName?: string;
    userEmail: string;
    inviteToken?: string;
  }): Promise<{ created: false } | { created: true; workspaceId: string; workspaceName: string }> {
    const { url: providedUrl, userId, userName, userEmail, inviteToken } = params;

    // Determine workspace details based on invite token or provided values
    let workspacePlan: PlanId = 'early_bird_monthly';
    let predeterminedWorkspaceId: string | undefined;
    let workspaceUrl = providedUrl;

    if (inviteToken) {
      const workspaceDetails = extractWorkspaceDetailsFromInviteToken(
        this.deps.tokenService,
        inviteToken
      );

      if (!workspaceDetails) {
        // Token is invalid or expired - return created: false instead of throwing
        return { created: false };
      }

      // Use token values only if token is valid
      workspacePlan = workspaceDetails.workspacePlan;
      predeterminedWorkspaceId = workspaceDetails.workspaceId;
      workspaceUrl = workspaceDetails.workspaceUrl;

      // Check if workspace with predetermined ID already exists
      const existingWorkspace = await this.deps.workspaceRepo.findById(predeterminedWorkspaceId);
      if (existingWorkspace) {
        // Workspace already exists - return created: false
        return { created: false };
      }
    }

    // URL is required either from token or directly provided
    if (!workspaceUrl) {
      throw provisionerError.PROVISIONER_URL_REQUIRED();
    }

    // Derive workspace name from user's name
    const workspaceName = deriveWorkspaceName(workspaceUrl, userName);

    const workspace = await this.deps.db.transaction(async (tx) => {
      // Create workspace with default recording preferences
      // Recording slug and defaults (company name, header, color, etc.) are set internally
      const createdWorkspace = await this.deps.workspaceService.create(
        {
          workspaceId: predeterminedWorkspaceId,
          workspaceName,
          workspacePlan,
          userId,
          workspaceBillingEmail: userEmail,
        },
        { tx }
      );

      if (!createdWorkspace) {
        throw provisionerError.PROVISIONER_WORKSPACE_CREATE_FAILED();
      }

      // Create first project (automatically becomes default)
      await this.deps.projectService.createProject(
        {
          workspaceId: createdWorkspace.workspaceId,
          projectTitle: workspaceName,
        },
        { tx }
      );

      await this.deps.workspaceMemberService.addOwner(
        {
          userId,
          workspaceId: createdWorkspace.workspaceId,
        },
        { tx }
      );

      await this.deps.domainService.create(
        {
          workspaceId: createdWorkspace.workspaceId,
          url: workspaceUrl,
          status: 'pending',
        },
        { tx }
      );

      return createdWorkspace;
    });

    if (!workspace) {
      throw provisionerError.PROVISIONER_TRANSACTION_FAILED();
    }

    return {
      created: true,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
    };
  }
}
