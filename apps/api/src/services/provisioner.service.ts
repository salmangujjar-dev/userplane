/**
 * ProvisionerService - Facade service for workspace provisioning
 * Orchestrates workspace creation with all related resources
 */

import type { DbClient } from '@workspace/db';
import { WorkspaceService } from '@/api/services/workspace.service';
import { ProjectService } from '@/api/services/project.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { DomainService } from '@/api/services/domain.service';
import { extractHostname, deriveWorkspaceName } from '@/api/lib/utils';
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
    const { url, userId } = params;

    // Extract hostname for workspace naming
    const hostname = extractHostname(url);
    const workspaceName = deriveWorkspaceName(hostname);

    // Generate unique slug with UUID suffix
    const recordingSlug = this.deps.workspaceService.generateUniqueSlug(workspaceName);

    const workspace = await this.deps.db.transaction(async (tx) => {
      const createdWorkspace = await this.deps.workspaceService.create(
        {
          workspaceName,
          recordingSlug,
          workspacePlan: 'starter_monthly',
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
      workspace: {
        recordingSlug: workspace.recordingSlug,
        workspaceName: workspace.workspaceName,
        workspaceInviteToken: workspace.workspaceInviteToken,
      },
    };
  }
}
