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
   */
  async addOwner(params: AddOwnerParams, options?: { tx?: Transaction }) {
    if (!params.userId || !params.workspaceId) {
      throw new ValidationError('User ID and Workspace ID are required');
    }

    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw new ConflictError('User is already a member of this workspace');
    }

    return this.deps.memberRepo.create(
      {
        id: nanoid(),
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
   */
  async addMember(params: AddMemberParams, options?: { tx?: Transaction }) {
    if (!params.userId || !params.workspaceId) {
      throw new ValidationError('User ID and Workspace ID are required');
    }

    const existing = await this.deps.memberRepo.findByUserAndWorkspace(
      params.userId,
      params.workspaceId
    );

    if (existing) {
      throw new ConflictError('User is already a member of this workspace');
    }

    return this.deps.memberRepo.create(
      {
        id: nanoid(),
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
   * Get member
   */
  async getMember(userId: string, workspaceId: string) {
    return this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
  }
}
