/**
 * WorkspaceMemberService - Domain service for workspace member operations
 * Contains business logic for workspace membership management
 */

import { generateWorkspaceMemberId } from '@/api/lib/id-generator';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ValidationError, ConflictError } from '@/api/lib/errors';
import type {
  Transaction,
  AddOwnerParams,
  AddMemberParams,
  UpdateRoleParams,
  RemoveMemberParams,
} from '@/api/types';

export interface WorkspaceMemberServiceDeps {
  memberRepo: WorkspaceMemberRepository;
}

export class WorkspaceMemberService {
  constructor(private deps: WorkspaceMemberServiceDeps) {}

  /**
   * Add user as workspace owner
   * Used only during workspace creation
   * If user was previously soft-deleted, restores them as owner instead
   */
  async addOwner(params: AddOwnerParams, options?: { tx?: Transaction }) {
    if (!params.userId || !params.workspaceId) {
      throw new ValidationError('User ID and Workspace ID are required');
    }

    // Check if user is currently an active member
    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw new ConflictError('User is already a member of this workspace');
    }

    // Check if user was previously a member but soft-deleted
    const deletedMember = await this.deps.memberRepo.findByUserAndWorkspaceIncludingDeleted(
      params.userId,
      params.workspaceId
    );

    // If soft-deleted member exists, restore them as owner
    if (deletedMember && deletedMember.isDeleted) {
      return this.deps.memberRepo.restore(deletedMember.id, 'owner', options);
    }

    // Otherwise, create new member as owner
    return this.deps.memberRepo.create(
      {
        id: generateWorkspaceMemberId(),
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
   */
  async addMember(params: AddMemberParams, options?: { tx?: Transaction }) {
    if (!params.userId || !params.workspaceId) {
      throw new ValidationError('User ID and Workspace ID are required');
    }

    // Check if user is currently an active member
    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw new ConflictError('User is already a member of this workspace');
    }

    // Check if user was previously a member but soft-deleted
    const deletedMember = await this.deps.memberRepo.findByUserAndWorkspaceIncludingDeleted(
      params.userId,
      params.workspaceId
    );

    // If soft-deleted member exists, restore them
    if (deletedMember && deletedMember.isDeleted) {
      return this.deps.memberRepo.restore(deletedMember.id, params.role, options);
    }

    // Otherwise, create new member
    return this.deps.memberRepo.create(
      {
        id: generateWorkspaceMemberId(),
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
   */
  async updateMemberRole(params: UpdateRoleParams, options?: { tx?: Transaction }) {
    if (!params.memberId) {
      throw new ValidationError('Member ID is required');
    }

    const member = await this.deps.memberRepo.findById(params.memberId);
    if (!member) {
      throw new ValidationError('Workspace member not found');
    }

    // Prevent users from changing their own role
    if (member.userId === params.userId) {
      throw new ValidationError('You cannot change your own role');
    }

    // If downgrading from owner, ensure at least one owner remains
    if (member.workspaceRole === 'owner' && params.newRole !== 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(params.workspaceId);

      if (ownerCount <= 1) {
        throw new ValidationError(
          'Cannot change role of the last owner. Promote another member to owner first.'
        );
      }
    }

    return this.deps.memberRepo.updateRole(params.memberId, params.newRole, options);
  }

  /**
   * Remove member from workspace (soft delete)
   * Requires owner/admin authorization (handled in middleware)
   * Cannot remove yourself (use leaveWorkspace instead)
   * Cannot remove the last owner
   */
  async removeMember(params: RemoveMemberParams, options?: { tx?: Transaction }) {
    if (!params.memberId) {
      throw new ValidationError('Member ID is required');
    }

    const member = await this.deps.memberRepo.findById(params.memberId);
    if (!member) {
      throw new ValidationError('Workspace member not found');
    }

    if (member.workspaceId !== params.workspaceId) {
      throw new ValidationError('Member does not belong to this workspace');
    }

    // Prevent users from removing themselves (they should use leave endpoint)
    if (member.userId === params.userId) {
      throw new ValidationError(
        'You cannot remove yourself. Use the leave workspace endpoint instead.'
      );
    }

    // Check if this is the last owner
    if (member.workspaceRole === 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(params.workspaceId);

      if (ownerCount <= 1) {
        throw new ValidationError('Cannot remove the last owner from workspace');
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
   */
  async getTeamMembers(workspaceId: string, page: number = 1, perPage: number = 5) {
    if (!workspaceId) {
      throw new ValidationError('Workspace ID is required');
    }

    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > 10) {
      throw new ValidationError('Per page must be between 1 and 10');
    }

    const total = await this.deps.memberRepo.countByWorkspace(workspaceId);
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
   */
  async leaveWorkspace(userId: string, workspaceId: string, options?: { tx?: Transaction }) {
    if (!userId || !workspaceId) {
      throw new ValidationError('User ID and Workspace ID are required');
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw new ValidationError('You are not a member of this workspace');
    }

    // Check if this is the last owner
    if (member.workspaceRole === 'owner') {
      const ownerCount = await this.deps.memberRepo.countOwnersByWorkspace(workspaceId);

      if (ownerCount <= 1) {
        throw new ValidationError(
          'Cannot leave workspace as the last owner. Transfer ownership or delete the workspace first.'
        );
      }
    }

    return this.deps.memberRepo.softDelete(member.id, options);
  }

  /**
   * Update notification preferences for authenticated user in workspace
   * Member can only update their own preferences
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
      throw new ValidationError('User ID and Workspace ID are required');
    }

    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
    if (!member) {
      throw new ValidationError('You are not a member of this workspace');
    }

    return this.deps.memberRepo.updateNotificationPreferences(member.id, preferences, options);
  }
}
