/**
 * ProvisionerService - Facade service for workspace provisioning
 * Orchestrates workspace creation with all related resources
 * All new workspaces start on free plan - users upgrade via subscription
 */

import { provisionerError } from '@workspace/contract';
import type { DbClient } from '@workspace/db';

import { deriveWorkspaceName } from '@/api/lib/workspace';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { DomainService } from '@/api/services/domain.service';
import { EntitlementService } from '@/api/services/entitlement.service';
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
  entitlementService: EntitlementService;
  workspaceRepo: WorkspaceRepository;
  db: DbClient;
}

type WorkspaceCreationResult =
  | {
      created: false;
      workspaceUrl?: string;
    }
  | { created: true; workspaceId: string; workspaceName: string };

export class ProvisionerService {
  constructor(private deps: ProvisionerServiceDeps) {}

  /**
   * Create workspace using an invite token
   * Extracts workspace details (URL, ID) from the token
   * Returns created: false with workspaceUrl if token is invalid or workspace already exists
   * This allows UI to auto-populate the manual creation form
   * Throws PROVISIONER_WORKSPACE_CREATE_FAILED if workspace creation fails
   * Throws PROVISIONER_TRANSACTION_FAILED if transaction fails
   */
  async createWorkspaceByInviteToken(params: {
    inviteToken: string;
    userId: string;
    userName?: string;
    userEmail: string;
  }): Promise<WorkspaceCreationResult> {
    const { inviteToken, userId, userName, userEmail } = params;

    const workspaceDetails = extractWorkspaceDetailsFromInviteToken(
      this.deps.tokenService,
      inviteToken
    );

    if (!workspaceDetails) {
      // Token is invalid or expired - return created: false without details
      return { created: false };
    }

    // Check if workspace with predetermined ID already exists
    const existingWorkspace = await this.deps.workspaceRepo.findById(workspaceDetails.workspaceId);
    if (existingWorkspace) {
      // Workspace already exists - return created: false with URL for manual flow
      return {
        created: false,
        workspaceUrl: workspaceDetails.workspaceUrl,
      };
    }

    return this.provisionWorkspace({
      url: workspaceDetails.workspaceUrl,
      predeterminedWorkspaceId: workspaceDetails.workspaceId,
      userId,
      userName,
      userEmail,
    });
  }

  /**
   * Create workspace manually with URL
   * User provides workspace URL, workspace starts on free plan
   * Throws PROVISIONER_WORKSPACE_CREATE_FAILED if workspace creation fails
   * Throws PROVISIONER_TRANSACTION_FAILED if transaction fails
   */
  async createWorkspaceByURL(params: {
    url: string;
    userId: string;
    userName?: string;
    userEmail: string;
  }): Promise<WorkspaceCreationResult> {
    const { url, userId, userName, userEmail } = params;

    return this.provisionWorkspace({
      url,
      predeterminedWorkspaceId: undefined,
      userId,
      userName,
      userEmail,
    });
  }

  /**
   * Private method that does the actual workspace provisioning
   * Creates workspace, project, member, and domain in a transaction
   * All workspaces start on free plan
   * Throws PROVISIONER_WORKSPACE_CREATE_FAILED if workspace creation fails
   * Throws PROVISIONER_TRANSACTION_FAILED if transaction fails
   */
  private async provisionWorkspace(params: {
    url: string;
    predeterminedWorkspaceId: string | undefined;
    userId: string;
    userName?: string;
    userEmail: string;
  }): Promise<WorkspaceCreationResult> {
    const { url, predeterminedWorkspaceId, userId, userName, userEmail } = params;

    // Derive workspace name from URL
    const workspaceName = deriveWorkspaceName(url, userName);

    const workspace = await this.deps.db.transaction(async (tx) => {
      // Create workspace with default recording preferences
      // Recording slug and defaults (company name, header, color, etc.) are set internally
      // Workspace starts on free plan - users upgrade via subscription
      const createdWorkspace = await this.deps.workspaceService.create(
        {
          workspaceId: predeterminedWorkspaceId,
          workspaceName,
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
          workspaceId: createdWorkspace.workspaceId!,
          projectTitle: workspaceName,
        },
        { tx }
      );

      await this.deps.workspaceMemberService.addOwner(
        {
          userId,
          workspaceId: createdWorkspace.workspaceId!,
        },
        { tx }
      );

      await this.deps.domainService.create(
        {
          workspaceId: createdWorkspace.workspaceId!,
          url,
          status: 'pending',
        },
        { tx }
      );

      // Provision entitlements for free plan
      // All new workspaces start on free plan
      await this.deps.entitlementService.provisionForPlan(createdWorkspace.workspaceId!, 'free', {
        tx,
      });

      // Initialize seat consumption (owner counts as 1 seat)
      await this.deps.entitlementService.consume(createdWorkspace.workspaceId!, 'seats', 1, { tx });

      return createdWorkspace;
    });

    if (!workspace) {
      throw provisionerError.PROVISIONER_TRANSACTION_FAILED();
    }

    return {
      created: true,
      workspaceId: workspace.workspaceId!,
      workspaceName: workspace.workspaceName!,
    };
  }
}
