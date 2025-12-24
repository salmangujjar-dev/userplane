/**
 * WorkspaceMemberService - Domain service for workspace member operations
 * Contains business logic for workspace membership management
 */

import { ORPCError } from '@orpc/server';
import { generateWorkspaceMemberId } from '@/api/lib/id';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { Transaction } from '@/api/types';
import type { WorkspaceRole } from '@workspace/contract';

export interface WorkspaceMemberServiceDeps {
  memberRepo: WorkspaceMemberRepository;
}

export class WorkspaceMemberService {
  constructor(private deps: WorkspaceMemberServiceDeps) {}

  /**
   * Add user as workspace owner
   * Used only during workspace creation
   * If user was previously soft-deleted, restores them as owner instead
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED if params are invalid
   * Throws WORKSPACE_MEMBER_ALREADY_EXISTS if user is already a member
   */
  async addOwner(params: { userId: string; workspaceId: string }, options?: { tx?: Transaction }) {
    if (!params.userId || !params.workspaceId) {
      throw new ORPCError('WORKSPACE_MEMBER_IDS_REQUIRED', {
        status: 400,
        message: 'User ID and Workspace ID are required',
      });
    }

    // Check if user is currently an active member
    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw new ORPCError('WORKSPACE_MEMBER_ALREADY_EXISTS', {
        status: 409,
        message: 'User is already a member of this workspace',
      });
    }

    // Check if user was previously a member but soft-deleted
    const deletedMember = await this.deps.memberRepo.findByUserAndWorkspaceIncludingDeleted(
      params.userId,
      params.workspaceId
    );

    // If soft-deleted member exists, restore them as owner
    if (deletedMember && deletedMember.isDeleted) {
      return this.deps.memberRepo.restore(deletedMember.workspaceMemberId, 'owner', options);
    }

    // Otherwise, create new member as owner
    return this.deps.memberRepo.create(
      {
        workspaceMemberId: generateWorkspaceMemberId(),
        userId: params.userId,
        workspaceId: params.workspaceId,
        workspaceRole: 'owner',
      },
      options
    );
  }

  /**
   * Add user as workspace member
   * Used when accepting invites
   * Always creates 'member' role - upgrades handled separately
   * If user was previously soft-deleted, restores them instead
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED if params are invalid
   * Throws WORKSPACE_MEMBER_ALREADY_EXISTS if user is already a member
   */
  async addMember(
    params: { userId: string; workspaceId: string; role: WorkspaceRole },
    options?: { tx?: Transaction }
  ) {
    if (!params.userId || !params.workspaceId) {
      throw new ORPCError('WORKSPACE_MEMBER_IDS_REQUIRED', {
        status: 400,
        message: 'User ID and Workspace ID are required',
      });
    }

    // Check if user is currently an active member
    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw new ORPCError('WORKSPACE_MEMBER_ALREADY_EXISTS', {
        status: 409,
        message: 'User is already a member of this workspace',
      });
    }

    // Check if user was previously a member but soft-deleted
    const deletedMember = await this.deps.memberRepo.findByUserAndWorkspaceIncludingDeleted(
      params.userId,
      params.workspaceId
    );

    // If soft-deleted member exists, restore them
    if (deletedMember && deletedMember.isDeleted) {
      return this.deps.memberRepo.restore(deletedMember.workspaceMemberId, params.role, options);
    }

    // Otherwise, create new member
    return this.deps.memberRepo.create(
      {
        workspaceMemberId: generateWorkspaceMemberId(),
        userId: params.userId,
        workspaceId: params.workspaceId,
        workspaceRole: params.role,
      },
      options
    );
  }

  /**
   * Update workspace member role by member ID
   * Validates that member exists and role is valid
   * Requires owner/admin authorization (handled in middleware)
   * Prevents self-role changes and ensures at least one owner remains
   * Throws WORKSPACE_MEMBER_ID_REQUIRED, WORKSPACE_MEMBER_NOT_FOUND,
   *        WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE, WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE for validation errors
   */
  async updateMemberRole(
    params: { memberId: string; newRole: WorkspaceRole; userId: string; workspaceId: string },
    options?: { tx?: Transaction }
  ) {
    if (!params.memberId) {
      throw new ORPCError('WORKSPACE_MEMBER_ID_REQUIRED', {
        status: 400,
        message: 'Member ID is required',
      });
    }

    const member = await this.deps.memberRepo.findById(params.memberId);
    if (!member) {
      throw new ORPCError('WORKSPACE_MEMBER_NOT_FOUND', {
        status: 404,
        message: 'Workspace member not found',
      });
    }

    // Prevent users from changing their own role
    if (member.userId === params.userId) {
      throw new ORPCError('WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE', {
        status: 403,
        message: 'You cannot change your own role',
      });
    }

    // If downgrading from owner, ensure at least one owner remains
    if (member.workspaceRole === 'owner' && params.newRole !== 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(params.workspaceId);

      if (ownerCount <= 1) {
        throw new ORPCError('WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE', {
          status: 403,
          message: 'Cannot change role of the last owner. Promote another member to owner first.',
        });
      }
    }

    return this.deps.memberRepo.updateRole(params.memberId, params.newRole, options);
  }

  /**
   * Remove member from workspace (soft delete)
   * Requires owner/admin authorization (handled in middleware)
   * Cannot remove yourself (use leaveWorkspace instead)
   * Cannot remove the last owner
   * Throws WORKSPACE_MEMBER_ID_REQUIRED, WORKSPACE_MEMBER_NOT_FOUND,
   *        WORKSPACE_MEMBER_WRONG_WORKSPACE, WORKSPACE_MEMBER_CANNOT_REMOVE_SELF,
   *        WORKSPACE_MEMBER_LAST_OWNER_REMOVE for validation errors
   */
  async removeMember(
    params: { memberId: string; workspaceId: string; userId: string },
    options?: { tx?: Transaction }
  ) {
    if (!params.memberId) {
      throw new ORPCError('WORKSPACE_MEMBER_ID_REQUIRED', {
        status: 400,
        message: 'Member ID is required',
      });
    }

    const member = await this.deps.memberRepo.findById(params.memberId);
    if (!member) {
      throw new ORPCError('WORKSPACE_MEMBER_NOT_FOUND', {
        status: 404,
        message: 'Workspace member not found',
      });
    }

    if (member.workspaceId !== params.workspaceId) {
      throw new ORPCError('WORKSPACE_MEMBER_WRONG_WORKSPACE', {
        status: 403,
        message: 'Member does not belong to this workspace',
      });
    }

    // Prevent users from removing themselves (they should use leave endpoint)
    if (member.userId === params.userId) {
      throw new ORPCError('WORKSPACE_MEMBER_CANNOT_REMOVE_SELF', {
        status: 403,
        message: 'You cannot remove yourself. Use the leave workspace endpoint instead.',
      });
    }

    // Check if this is the last owner
    if (member.workspaceRole === 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(params.workspaceId);

      if (ownerCount <= 1) {
        throw new ORPCError('WORKSPACE_MEMBER_LAST_OWNER_REMOVE', {
          status: 403,
          message: 'Cannot remove the last owner from workspace',
        });
      }
    }

    return this.deps.memberRepo.softDelete(params.memberId, options);
  }

  /**
   * Get member
   */
  async getMember(userId: string, workspaceId: string) {
    return this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
  }

  /**
   * Get team members of a workspace with user details (paginated)
   * Returns members sorted by role (owner > admin > member)
   * If no members found, validates workspace existence (since workspace always has at least 1 member)
   * Throws WORKSPACE_USER_ID_REQUIRED, WORKSPACE_MEMBER_INVALID_PAGINATION for invalid params
   * Throws WORKSPACE_NOT_FOUND if workspace doesn't exist when no members found
   */
  async getTeamMembers(workspaceId: string, page: number = 1, perPage: number = 5) {
    if (!workspaceId) {
      throw new ORPCError('WORKSPACE_USER_ID_REQUIRED', {
        status: 400,
        message: 'Workspace ID is required',
      });
    }

    if (page < 1) {
      throw new ORPCError('WORKSPACE_MEMBER_INVALID_PAGINATION', {
        status: 400,
        message: 'Page must be greater than 0',
      });
    }

    if (perPage < 1 || perPage > 10) {
      throw new ORPCError('WORKSPACE_MEMBER_INVALID_PAGINATION', {
        status: 400,
        message: 'Per page must be between 1 and 10',
      });
    }

    const total = await this.deps.memberRepo.countByWorkspace(workspaceId);

    // If no members exist, workspace doesn't exist (workspace always has at least 1 member)
    if (total === 0) {
      throw new ORPCError('WORKSPACE_NOT_FOUND', {
        status: 404,
        message: 'Workspace not found',
      });
    }

    const offset = (page - 1) * perPage;
    const members = await this.deps.memberRepo.findByWorkspaceWithUsersPaginated(
      workspaceId,
      perPage,
      offset
    );

    return {
      members,
      total,
    };
  }

  /**
   * Leave workspace (self-removal via soft delete)
   * Allows member to remove themselves from workspace
   * Cannot leave if you're the last owner
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED, WORKSPACE_MEMBER_NOT_IN_WORKSPACE,
   *        WORKSPACE_MEMBER_LAST_OWNER_LEAVE for validation errors
   */
  async leaveWorkspace(userId: string, workspaceId: string, options?: { tx?: Transaction }) {
    if (!userId || !workspaceId) {
      throw new ORPCError('WORKSPACE_MEMBER_IDS_REQUIRED', {
        status: 400,
        message: 'User ID and Workspace ID are required',
      });
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw new ORPCError('WORKSPACE_MEMBER_NOT_IN_WORKSPACE', {
        status: 404,
        message: 'You are not a member of this workspace',
      });
    }

    // Check if this is the last owner
    if (member.workspaceRole === 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(workspaceId);

      if (ownerCount <= 1) {
        throw new ORPCError('WORKSPACE_MEMBER_LAST_OWNER_LEAVE', {
          status: 403,
          message:
            'Cannot leave workspace as the last owner. Transfer ownership or delete the workspace first.',
        });
      }
    }

    return this.deps.memberRepo.softDelete(member.workspaceMemberId, options);
  }

  /**
   * Get notification preferences for authenticated user in workspace
   * Returns member's notification settings
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED, WORKSPACE_MEMBER_NOT_IN_WORKSPACE for validation errors
   */
  async getNotificationPreferences(userId: string, workspaceId: string) {
    if (!userId || !workspaceId) {
      throw new ORPCError('WORKSPACE_MEMBER_IDS_REQUIRED', {
        status: 400,
        message: 'User ID and Workspace ID are required',
      });
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw new ORPCError('WORKSPACE_MEMBER_NOT_IN_WORKSPACE', {
        status: 404,
        message: 'You are not a member of this workspace',
      });
    }

    return {
      notifyOnLinkUsage: member.notifyOnLinkUsage,
      notifyOnQuotaReset: member.notifyOnQuotaReset,
      notifyOnQuotaLimit: member.notifyOnQuotaLimit,
      notifyOnInviteAccepted: member.notifyOnInviteAccepted,
      notifyOnMemberJoin: member.notifyOnMemberJoin,
    };
  }

  /**
   * Update notification preferences for authenticated user in workspace
   * Member can only update their own preferences
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED, WORKSPACE_MEMBER_NOT_IN_WORKSPACE for validation errors
   */
  async updateNotificationPreferences(
    userId: string,
    workspaceId: string,
    preferences: Partial<{
      notifyOnLinkUsage: boolean;
      notifyOnQuotaReset: boolean;
      notifyOnQuotaLimit: boolean;
      notifyOnInviteAccepted: boolean;
      notifyOnMemberJoin: boolean;
    }>,
    options?: { tx?: Transaction }
  ) {
    if (!userId || !workspaceId) {
      throw new ORPCError('WORKSPACE_MEMBER_IDS_REQUIRED', {
        status: 400,
        message: 'User ID and Workspace ID are required',
      });
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw new ORPCError('WORKSPACE_MEMBER_NOT_IN_WORKSPACE', {
        status: 404,
        message: 'You are not a member of this workspace',
      });
    }

    return this.deps.memberRepo.updateNotificationPreferences(
      member.workspaceMemberId,
      preferences,
      options
    );
  }
}
