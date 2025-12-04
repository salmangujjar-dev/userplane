/**
 * WorkspaceMemberService - Domain service for workspace member operations
 * Contains business logic for workspace membership management
 */

import { nanoid } from 'nanoid';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ValidationError, ConflictError } from '@/api/lib/errors';
import type { Transaction, AddOwnerParams, AddMemberParams, UpdateRoleParams } from '@/api/types';

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
        id: `wm_${nanoid(16)}`,
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
        id: `wm_${nanoid(16)}`,
        userId: params.userId,
        workspaceId: params.workspaceId,
        workspaceRole: params.role,
      },
      options
    );
  }

  /**
   * Update member role
   * Requires owner/admin authorization (handled in middleware)
   */
  async updateRole(params: UpdateRoleParams, options?: { tx?: Transaction }) {
    return this.deps.memberRepo.updateRole(params.memberId, params.newRole, options);
  }

  /**
   * Update workspace member role by member ID
   * Validates that member exists and role is valid
   * Requires owner/admin authorization (handled in middleware)
   */
  async updateMemberRole(
    memberId: string,
    newRole: 'owner' | 'admin' | 'member',
    options?: { tx?: Transaction }
  ) {
    if (!memberId) {
      throw new ValidationError('Member ID is required');
    }

    if (!['owner', 'admin', 'member'].includes(newRole)) {
      throw new ValidationError('Invalid role. Must be one of: owner, admin, member');
    }

    const member = await this.deps.memberRepo.findById(memberId);
    if (!member) {
      throw new ValidationError('Workspace member not found');
    }

    return this.deps.memberRepo.updateRole(memberId, newRole, options);
  }

  /**
   * Remove member from workspace (soft delete)
   * Requires owner/admin authorization (handled in middleware)
   * Cannot remove the last owner
   */
  async removeMember(memberId: string, workspaceId: string, options?: { tx?: Transaction }) {
    if (!memberId) {
      throw new ValidationError('Member ID is required');
    }

    const member = await this.deps.memberRepo.findById(memberId);
    if (!member) {
      throw new ValidationError('Workspace member not found');
    }

    if (member.workspaceId !== workspaceId) {
      throw new ValidationError('Member does not belong to this workspace');
    }

    // Check if this is the last owner
    if (member.workspaceRole === 'owner') {
      const allMembers = await this.deps.memberRepo.findByWorkspaceWithUsers(workspaceId);
      const ownerCount = allMembers.filter((m) => m.role === 'owner').length;

      if (ownerCount <= 1) {
        throw new ValidationError('Cannot remove the last owner from workspace');
      }
    }

    return this.deps.memberRepo.softDelete(memberId, options);
  }

  /**
   * Get member
   */
  async getMember(userId: string, workspaceId: string) {
    return this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
  }

  /**
   * Get all team members of a workspace with user details (paginated)
   * Returns members sorted by role (owner, admin, member)
   */
  async getTeamMembers(workspaceId: string, page: number = 1, perPage: number = 5) {
    if (!workspaceId) {
      throw new ValidationError('Workspace ID is required');
    }

    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (perPage < 1 || perPage > 100) {
      throw new ValidationError('Per page must be between 1 and 100');
    }

    // Get total count
    const total = await this.deps.memberRepo.countByWorkspace(workspaceId);

    // Get all members (we need to sort them before pagination)
    const allMembers = await this.deps.memberRepo.findByWorkspaceWithUsers(workspaceId);

    // Role priority for sorting
    const roleOrder = { owner: 0, admin: 1, member: 2 };

    // Sort members by role (owner > admin > member)
    const sortedMembers = allMembers.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

    // Apply pagination
    const offset = (page - 1) * perPage;
    const paginatedMembers = sortedMembers.slice(offset, offset + perPage);

    return {
      members: paginatedMembers,
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
      const allMembers = await this.deps.memberRepo.findByWorkspaceWithUsers(workspaceId);
      const ownerCount = allMembers.filter((m) => m.role === 'owner').length;

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
