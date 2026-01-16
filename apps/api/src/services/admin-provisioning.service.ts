/**
 * AdminProvisioningService - Business logic for admin workspace provisioning
 * Handles creating workspaces on behalf of users with optional members
 */

import { ORPCError } from '@orpc/server';
import { auth } from '@/api/clients/auth';
import { generateRandomPassword } from '@/api/lib/password';
import type { UserRepository } from '@/api/repositories/users.repository';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { DbClient } from '@workspace/db';
import type { PlanId } from '@workspace/pricing';

export interface AdminProvisioningServiceDeps {
  userRepo: UserRepository;
  provisionerService: ProvisionerService;
  workspaceMemberService: WorkspaceMemberService;
  workspaceService: WorkspaceService;
  db: DbClient;
}

interface ProvisionWorkspaceParams {
  owner: {
    email: string;
    name: string;
  };
  workspace: {
    name: string;
    url: string;
    plan?: PlanId;
  };
  members: Array<{
    email: string;
    name: string;
    role: 'admin' | 'member';
  }>;
}

interface ProvisionedUser {
  userId: string;
  email: string;
  name: string;
  isNew: boolean;
}

interface ProvisionedMember extends ProvisionedUser {
  role: 'admin' | 'member';
}

interface ProvisionWorkspaceResult {
  workspaceId: string;
  workspaceName: string;
  owner: ProvisionedUser;
  members: ProvisionedMember[];
}

export class AdminProvisioningService {
  constructor(private deps: AdminProvisioningServiceDeps) {}

  /**
   * Find or create a user by email
   * Uses Better Auth admin API to create new users with random passwords
   * Users can sign in via magic link to set their own password
   */
  private async findOrCreateUser(params: {
    email: string;
    name: string;
  }): Promise<{ user: { id: string; email: string; name: string }; isNew: boolean }> {
    // First, check if user already exists
    const existingUser = await this.deps.userRepo.findByEmail(params.email);

    if (existingUser) {
      return {
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
        isNew: false,
      };
    }

    // Create new user via Better Auth admin API
    try {
      const result = await auth.api.createUser({
        body: {
          email: params.email,
          password: generateRandomPassword(),
          name: params.name,
          role: 'user',
        },
      });

      if (!result || !result.user || !result.user.id) {
        throw new ORPCError('ADMIN_PROVISION_USER_CREATE_FAILED', {
          status: 500,
          message: `Failed to create user account for ${params.email}`,
        });
      }

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        isNew: true,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('ADMIN_PROVISION_USER_CREATE_FAILED', {
        status: 500,
        message: `Failed to create user account for ${params.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Provision a workspace on behalf of a user
   * Creates users if they don't exist, creates workspace, and adds members
   */
  async provisionWorkspace(params: ProvisionWorkspaceParams): Promise<ProvisionWorkspaceResult> {
    try {
      // 1. Find or create owner user
      const { user: ownerUser, isNew: ownerIsNew } = await this.findOrCreateUser({
        email: params.owner.email,
        name: params.owner.name,
      });

      // 2. Create workspace using ProvisionerService
      // This creates workspace + project + domain + adds owner as owner member
      let workspace: { workspaceId: string };
      try {
        workspace = await this.deps.provisionerService.createWorkspace({
          url: params.workspace.url,
          userId: ownerUser.id,
          userName: ownerUser.name,
          userEmail: ownerUser.email,
        });
      } catch (error) {
        throw new ORPCError('ADMIN_PROVISION_WORKSPACE_CREATE_FAILED', {
          status: 500,
          message: `Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }

      // Get workspace name for response
      const workspaceDetails = await this.deps.workspaceService.getById(workspace.workspaceId);

      // 3. Find or create members and add them to workspace
      const memberResults: ProvisionedMember[] = [];

      for (const member of params.members) {
        // Skip if member email is the same as owner
        if (member.email.toLowerCase() === params.owner.email.toLowerCase()) {
          continue;
        }

        try {
          const { user: memberUser, isNew: memberIsNew } = await this.findOrCreateUser({
            email: member.email,
            name: member.name,
          });

          // Add member to workspace
          await this.deps.workspaceMemberService.addMember({
            userId: memberUser.id,
            workspaceId: workspace.workspaceId,
            role: member.role,
          });

          memberResults.push({
            userId: memberUser.id,
            email: memberUser.email,
            name: memberUser.name,
            role: member.role,
            isNew: memberIsNew,
          });
        } catch (error) {
          // If member already exists in workspace, skip and continue
          if (error instanceof ORPCError && error.code === 'WORKSPACE_MEMBER_ALREADY_EXISTS') {
            continue;
          }
          throw new ORPCError('ADMIN_PROVISION_MEMBER_ADD_FAILED', {
            status: 500,
            message: `Failed to add member ${member.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      return {
        workspaceId: workspace.workspaceId,
        workspaceName: workspaceDetails.workspaceName,
        owner: {
          userId: ownerUser.id,
          email: ownerUser.email,
          name: ownerUser.name,
          isNew: ownerIsNew,
        },
        members: memberResults,
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError('ADMIN_PROVISION_FAILED', {
        status: 500,
        message: `Workspace provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
}
