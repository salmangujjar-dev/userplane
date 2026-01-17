/**
 * WorkspaceMemberService - Domain service for workspace member operations
 * Contains business logic for workspace membership management
 */

import { generateWorkspaceMemberId } from '@/api/lib/id';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { Transaction } from '@/api/types';
import type { WorkspaceRole } from '@workspace/contract';
import { workspaceError } from '@workspace/contract';

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
      throw workspaceError.WORKSPACE_MEMBER_IDS_REQUIRED();
    }

    // Check if user is currently an active member
    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw workspaceError.WORKSPACE_MEMBER_ALREADY_EXISTS();
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
      throw workspaceError.WORKSPACE_MEMBER_IDS_REQUIRED();
    }

    // Check if user is currently an active member
    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw workspaceError.WORKSPACE_MEMBER_ALREADY_EXISTS();
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
      throw workspaceError.WORKSPACE_MEMBER_ID_REQUIRED();
    }

    const member = await this.deps.memberRepo.findById(params.memberId);
    if (!member) {
      throw workspaceError.WORKSPACE_MEMBER_NOT_FOUND();
    }

    // Prevent users from changing their own role
    if (member.userId === params.userId) {
      throw workspaceError.WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE();
    }

    // If downgrading from owner, ensure at least one owner remains
    if (member.workspaceRole === 'owner' && params.newRole !== 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(params.workspaceId);

      if (ownerCount <= 1) {
        throw workspaceError.WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE();
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
      throw workspaceError.WORKSPACE_MEMBER_ID_REQUIRED();
    }

    const member = await this.deps.memberRepo.findById(params.memberId);
    if (!member) {
      throw workspaceError.WORKSPACE_MEMBER_NOT_FOUND();
    }

    if (member.workspaceId !== params.workspaceId) {
      throw workspaceError.WORKSPACE_MEMBER_WRONG_WORKSPACE();
    }

    // Prevent users from removing themselves (they should use leave endpoint)
    if (member.userId === params.userId) {
      throw workspaceError.WORKSPACE_MEMBER_CANNOT_REMOVE_SELF();
    }

    // Check if this is the last owner
    if (member.workspaceRole === 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(params.workspaceId);

      if (ownerCount <= 1) {
        throw workspaceError.WORKSPACE_MEMBER_LAST_OWNER_REMOVE();
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
   * Get all owners of a workspace
   * Returns array of owner members with their email addresses
   * Used for sending notifications to workspace owners
   */
  async getOwners(workspaceId: string): Promise<Array<{ userId: string; email: string }>> {
    return this.deps.memberRepo.findOwnersByWorkspace(workspaceId);
  }

  /**
   * Get team members of a workspace with user details (paginated)
   * Returns members sorted by role (owner > admin > member)
   * If no members found, validates workspace existence (since workspace always has at least 1 member)
   * Pagination params are validated by the contract schema
   * Throws WORKSPACE_USER_ID_REQUIRED for invalid params
   * Throws WORKSPACE_NOT_FOUND if workspace doesn't exist when no members found
   */
  async getTeamMembers(workspaceId: string, page: number = 1, perPage: number = 5) {
    if (!workspaceId) {
      throw workspaceError.WORKSPACE_USER_ID_REQUIRED();
    }

    const total = await this.deps.memberRepo.countByWorkspace(workspaceId);

    // If no members exist, workspace doesn't exist (workspace always has at least 1 member)
    if (total === 0) {
      throw workspaceError.WORKSPACE_NOT_FOUND();
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
   * Cannot leave if you're the last owner with other members
   * If sole owner with no other members, returns shouldDeleteWorkspace: true
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED, WORKSPACE_MEMBER_NOT_IN_WORKSPACE,
   *        WORKSPACE_MEMBER_SOLE_OWNER_WITH_MEMBERS for validation errors
   */
  async leaveWorkspace(
    userId: string,
    workspaceId: string,
    options?: { tx?: Transaction }
  ): Promise<{ shouldDeleteWorkspace: boolean }> {
    if (!userId || !workspaceId) {
      throw workspaceError.WORKSPACE_MEMBER_IDS_REQUIRED();
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw workspaceError.WORKSPACE_MEMBER_NOT_IN_WORKSPACE();
    }

    // Check if this is the last owner
    if (member.workspaceRole === 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(workspaceId);

      if (ownerCount <= 1) {
        // Sole owner - check if there are other members
        const totalMemberCount = await this.deps.memberRepo.countByWorkspace(workspaceId);

        if (totalMemberCount > 1) {
          // There are other members - user must transfer ownership first
          throw workspaceError.WORKSPACE_MEMBER_SOLE_OWNER_WITH_MEMBERS();
        }

        // Only member in workspace - soft delete and signal to delete workspace
        await this.deps.memberRepo.softDelete(member.workspaceMemberId, options);
        return { shouldDeleteWorkspace: true };
      }
    }

    await this.deps.memberRepo.softDelete(member.workspaceMemberId, options);
    return { shouldDeleteWorkspace: false };
  }

  /**
   * Get notification preferences for authenticated user in workspace
   * Returns member's notification settings
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED, WORKSPACE_MEMBER_NOT_IN_WORKSPACE for validation errors
   */
  async getNotificationPreferences(userId: string, workspaceId: string) {
    if (!userId || !workspaceId) {
      throw workspaceError.WORKSPACE_MEMBER_IDS_REQUIRED();
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw workspaceError.WORKSPACE_MEMBER_NOT_IN_WORKSPACE();
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
      throw workspaceError.WORKSPACE_MEMBER_IDS_REQUIRED();
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw workspaceError.WORKSPACE_MEMBER_NOT_IN_WORKSPACE();
    }

    return this.deps.memberRepo.updateNotificationPreferences(
      member.workspaceMemberId,
      preferences,
      options
    );
  }

  /**
   * Count members in workspace
   * Returns the total number of active members in the workspace
   */
  async countByWorkspace(workspaceId: string): Promise<number> {
    return this.deps.memberRepo.countByWorkspace(workspaceId);
  }
}
