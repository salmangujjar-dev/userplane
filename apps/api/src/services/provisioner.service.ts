/**
 * ProvisionerService - Facade service for workspace provisioning
 * Orchestrates workspace creation with all related resources
 */

import type { DbClient } from '@workspace/db';
import { WorkspaceService } from '@/api/services/workspace.service';
import { ProjectService } from '@/api/services/project.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { DomainService } from '@/api/services/domain.service';
import { deriveWorkspaceName } from '@/api/lib/workspace';
import { provisionerError } from '@workspace/contract';

export interface ProvisionerServiceDeps {
  workspaceService: WorkspaceService;
  projectService: ProjectService;
  workspaceMemberService: WorkspaceMemberService;
  domainService: DomainService;
  db: DbClient;
}

export class ProvisionerService {
  constructor(private deps: ProvisionerServiceDeps) {}

  /**
   * Create workspace with all related resources
   * Orchestrates workspace, project, member, and domain creation
   * Accepts any valid URL format
   * Throws PROVISIONER_WORKSPACE_CREATE_FAILED if workspace creation fails
   * Throws PROVISIONER_TRANSACTION_FAILED if transaction fails
   */
  async createWorkspace(params: {
    url: string;
    userId: string;
    userName?: string;
    userEmail: string;
  }): Promise<{ workspaceId: string }> {
    const { url, userId, userName, userEmail } = params;

    // Derive workspace name from user's name
    const workspaceName = deriveWorkspaceName(url, userName);

    const workspace = await this.deps.db.transaction(async (tx) => {
      // Create workspace with default recording preferences
      // Recording slug and defaults (company name, header, color, etc.) are set internally
      const createdWorkspace = await this.deps.workspaceService.create(
        {
          workspaceName,
          workspacePlan: 'early_bird_monthly',
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
          url: url,
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
      workspaceId: workspace.workspaceId,
    };
  }
}
