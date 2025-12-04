/**
 * ProvisionerService - Facade service for workspace provisioning
 * Orchestrates workspace creation with all related resources
 */

import type { DbClient } from '@workspace/db';
import { WorkspaceService } from '@/api/services/workspace.service';
import { ProjectService } from '@/api/services/project.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { DomainService } from '@/api/services/domain.service';
import { deriveWorkspaceNameFromUser } from '@/api/lib/utils';
import type { ProvisionWorkspaceParams, ProvisionWorkspaceResult } from '@/api/types';

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
   */
  async createWorkspace(params: ProvisionWorkspaceParams): Promise<ProvisionWorkspaceResult> {
    const { url, userId, userName } = params;

    // Derive workspace name from user's name
    const workspaceName = deriveWorkspaceNameFromUser(userName);

    const workspace = await this.deps.db.transaction(async (tx) => {
      // Create workspace - recording slug is generated internally
      const createdWorkspace = await this.deps.workspaceService.create(
        {
          workspaceName,
          workspacePlan: 'early_bird_monthly',
          userId,
        },
        { tx }
      );

      if (!createdWorkspace) {
        throw new Error('Failed to create workspace');
      }

      // Create first project (automatically becomes default)
      await this.deps.projectService.createProject(
        {
          workspaceId: createdWorkspace.id,
          projectTitle: workspaceName,
        },
        { tx }
      );

      await this.deps.workspaceMemberService.addOwner(
        {
          userId,
          workspaceId: createdWorkspace.id,
        },
        { tx }
      );

      await this.deps.domainService.create(
        {
          workspaceId: createdWorkspace.id,
          url: url,
          status: 'pending',
        },
        { tx }
      );

      return createdWorkspace;
    });

    if (!workspace) {
      throw new Error('Transaction failed');
    }

    return {
      workspaceId: workspace.id,
    };
  }
}
