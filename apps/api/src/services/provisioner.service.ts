/**
 * ProvisionerService - Facade service for workspace provisioning
 * Orchestrates workspace creation with all related resources
 */

import { provisionerError } from '@workspace/contract';
import type { DbClient } from '@workspace/db';
import {
  getPlanName,
  type PlanId,
  type PlanName,
  type UserSelectablePlanId,
} from '@workspace/pricing';

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

type WorkspaceCreationResult =
  | {
      created: false;
      workspaceUrl?: string;
      workspacePlan?: UserSelectablePlanId;
      planName?: PlanName;
      planCycle?: 'monthly' | 'annual';
    }
  | { created: true; workspaceId: string; workspaceName: string };

export class ProvisionerService {
  constructor(private deps: ProvisionerServiceDeps) {}

  /**
   * Create workspace using an invite token
   * Extracts workspace details (URL, plan, ID) from the token
   * Returns created: false with workspaceUrl and workspacePlan if token is invalid or workspace already exists
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

    // If the workspace plan is not sandbox, trigger the manual flow
    if (workspaceDetails.workspacePlan !== 'sandbox') {
      return {
        created: false,
        workspaceUrl: workspaceDetails.workspaceUrl,
        // If the workspace plan is free, default to starter_annual
        workspacePlan:
          workspaceDetails.workspacePlan === 'free'
            ? 'starter_annual'
            : workspaceDetails.workspacePlan,
        // Get the plan name from the workspace plan
        planName: getPlanName(
          workspaceDetails.workspacePlan === 'free'
            ? 'starter_annual'
            : workspaceDetails.workspacePlan
        ),
        // Get the plan cycle from the workspace plan
        planCycle: workspaceDetails.workspacePlan.endsWith('_monthly') ? 'monthly' : 'annual',
      };
    }

    // Check if workspace with predetermined ID already exists
    const existingWorkspace = await this.deps.workspaceRepo.findById(workspaceDetails.workspaceId);
    if (existingWorkspace) {
      // Workspace already exists - return created: false with details for manual flow
      const planName = getPlanName(workspaceDetails.workspacePlan);
      const planCycle = workspaceDetails.workspacePlan.endsWith('_monthly')
        ? ('monthly' as const)
        : ('annual' as const);

      return {
        created: false,
        workspaceUrl: workspaceDetails.workspaceUrl,
        workspacePlan: workspaceDetails.workspacePlan as UserSelectablePlanId,
        planName,
        planCycle,
      };
    }

    return this.provisionWorkspace({
      url: workspaceDetails.workspaceUrl,
      plan: workspaceDetails.workspacePlan,
      predeterminedWorkspaceId: workspaceDetails.workspaceId,
      userId,
      userName,
      userEmail,
    });
  }

  /**
   * Create workspace manually with URL and plan
   * User provides workspace URL and selects a plan
   * Throws PROVISIONER_WORKSPACE_CREATE_FAILED if workspace creation fails
   * Throws PROVISIONER_TRANSACTION_FAILED if transaction fails
   */
  async createWorkspaceByURL(params: {
    url: string;
    plan: UserSelectablePlanId;
    userId: string;
    userName?: string;
    userEmail: string;
  }): Promise<WorkspaceCreationResult> {
    const { url, plan, userId, userName, userEmail } = params;

    return this.provisionWorkspace({
      url,
      plan,
      predeterminedWorkspaceId: undefined,
      userId,
      userName,
      userEmail,
    });
  }

  /**
   * Private method that does the actual workspace provisioning
   * Creates workspace, project, member, and domain in a transaction
   * Throws PROVISIONER_WORKSPACE_CREATE_FAILED if workspace creation fails
   * Throws PROVISIONER_TRANSACTION_FAILED if transaction fails
   */
  private async provisionWorkspace(params: {
    url: string;
    plan: PlanId;
    predeterminedWorkspaceId: string | undefined;
    userId: string;
    userName?: string;
    userEmail: string;
  }): Promise<WorkspaceCreationResult> {
    const { url, plan, predeterminedWorkspaceId, userId, userName, userEmail } = params;

    // Derive workspace name from URL
    const workspaceName = deriveWorkspaceName(url, userName);

    const workspace = await this.deps.db.transaction(async (tx) => {
      // Create workspace with default recording preferences
      // Recording slug and defaults (company name, header, color, etc.) are set internally
      const createdWorkspace = await this.deps.workspaceService.create(
        {
          workspaceId: predeterminedWorkspaceId,
          workspaceName,
          workspacePlan: plan,
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
