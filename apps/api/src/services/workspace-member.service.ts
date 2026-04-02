/**
 * WorkspaceMemberService - Domain service for workspace member operations
 * Contains business logic for workspace membership management
 */

import type { CacheService } from '@userplane/cache';
import type { IncomingEventChannels, WorkspaceRole } from '@userplane/contract';
import {
  billingError,
  getDefaultNotificationPreferences,
  getEditableNotificationKeys,
  getLockedNotificationOverrides,
  workspaceError,
} from '@userplane/contract';

import { generateWorkspaceMemberId } from '@/api/lib/id';
import { createLogger } from '@/api/lib/logger';
import { captureException } from '@/api/posthog';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { WorkspaceMemberIdentityRepository } from '@/api/repositories/workspace-member-identities.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { NotificationChannelService } from '@/api/services/notification-channel.service';
import type { Transaction } from '@/api/types';

const logger = createLogger('workspace-member-service');

export interface WorkspaceMemberServiceDeps {
  memberRepo: WorkspaceMemberRepository;
  memberIdentityRepo: WorkspaceMemberIdentityRepository;
  integrationRepo: IntegrationRepository;
  entitlementService: EntitlementService;
  cacheService: CacheService;
  notificationChannelService: NotificationChannelService;
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
  async addOwner(
    params: { userId: string; workspaceId: string; userEmail: string },
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

    let member;
    const notificationDefaults = getDefaultNotificationPreferences('owner');

    // If soft-deleted member exists, restore them as owner
    if (deletedMember && deletedMember.isDeleted) {
      member = await this.deps.memberRepo.restore(deletedMember.workspaceMemberId, 'owner', {
        ...options,
        notificationDefaults,
      });
    } else {
      // Otherwise, create new member as owner
      member = await this.deps.memberRepo.create(
        {
          workspaceMemberId: generateWorkspaceMemberId(),
          userId: params.userId,
          workspaceId: params.workspaceId,
          workspaceRole: 'owner',
          notificationDefaults,
        },
        options
      );
    }

    // Warm membership cache
    if (member) {
      await this.deps.cacheService.setMembership(params.userId, params.workspaceId, {
        workspaceMemberId: member.workspaceMemberId,
        workspaceRole: member.workspaceRole,
      });

      // Enable notification channels for active integrations
      await this.enableChannelsForActiveIntegrations(
        member.workspaceMemberId,
        params.workspaceId,
        params.userEmail
      );
    }

    return member;
  }

  /**
   * Add user as workspace member
   * Used when accepting invites
   * Always creates 'member' role - upgrades handled separately
   * If user was previously soft-deleted, restores them instead
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED if params are invalid
   * Throws WORKSPACE_MEMBER_ALREADY_EXISTS if user is already a member
   * Throws PLAN_LIMIT_EXCEEDED if seat limit reached
   */
  async addMember(
    params: { userId: string; workspaceId: string; role: WorkspaceRole; userEmail: string },
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

    let member;
    const notificationDefaults = getDefaultNotificationPreferences(params.role);

    // If soft-deleted member exists, restore them
    if (deletedMember && deletedMember.isDeleted) {
      member = await this.deps.memberRepo.restore(deletedMember.workspaceMemberId, params.role, {
        ...options,
        notificationDefaults,
      });
    } else {
      // Otherwise, create new member
      member = await this.deps.memberRepo.create(
        {
          workspaceMemberId: generateWorkspaceMemberId(),
          userId: params.userId,
          workspaceId: params.workspaceId,
          workspaceRole: params.role,
          notificationDefaults,
        },
        options
      );
    }

    // Atomically check and consume seat entitlement inside the caller's transaction
    const seatResult = await this.deps.entitlementService.tryConsumeSeats(
      params.workspaceId,
      1,
      options
    );
    if (!seatResult.allowed) {
      throw billingError.PLAN_LIMIT_EXCEEDED({
        resource: 'seats',
        current: seatResult.current,
        limit: seatResult.limit,
        reason: seatResult.reason,
      });
    }

    // Warm cache with new membership
    if (member) {
      await this.deps.cacheService.setMembership(params.userId, params.workspaceId, {
        workspaceMemberId: member.workspaceMemberId,
        workspaceRole: member.workspaceRole,
      });

      // Enable notification channels for active integrations
      await this.enableChannelsForActiveIntegrations(
        member.workspaceMemberId,
        params.workspaceId,
        params.userEmail
      );
    }

    return member;
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

    // Compute locked notification overrides for the new role.
    // Hidden preferences are forced to their default (e.g. owner always gets
    // notifyAdminEvents=true, member always gets notifyAdminEvents=false).
    const notificationOverrides = getLockedNotificationOverrides(params.newRole);

    const updated = await this.deps.memberRepo.updateRole(params.memberId, params.newRole, {
      ...options,
      notificationOverrides,
    });

    // Invalidate membership cache - role has changed
    if (updated) {
      await this.deps.cacheService.invalidateMembership(member.userId, params.workspaceId);
    }

    return updated;
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
    params: { memberId: string; workspaceId: string; userId: string; deletedAt: Date },
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

    // Reset notification channels before soft-deleting
    await this.deps.memberRepo.resetIncomingEventChannels(params.memberId, options);

    // Soft-delete associated identities with same timestamp
    await this.deps.memberIdentityRepo.softDeleteByMemberId(
      params.memberId,
      params.deletedAt,
      options
    );

    const result = await this.deps.memberRepo.softDelete(
      params.memberId,
      params.deletedAt,
      options
    );

    // Release seat entitlement after successfully removing member
    try {
      await this.deps.entitlementService.releaseSeats(params.workspaceId, 1, options);
    } catch (error) {
      // Log but don't fail - member is already removed
      logger.error({ err: error, workspaceId: params.workspaceId }, 'Failed to release seat');
      captureException(error, undefined, {
        operation: 'release_seat',
        workspace_id: params.workspaceId,
      });
    }

    // Invalidate membership cache - member removed
    await this.deps.cacheService.invalidateMembership(member.userId, params.workspaceId);

    return result;
  }

  /**
   * Get member with full data (not cached)
   * Use getMembershipForAuth for auth checks that only need role/memberId
   */
  async getMember(userId: string, workspaceId: string) {
    return this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);
  }

  /**
   * Get minimal membership for auth checks (cached)
   * Returns only workspaceMemberId and workspaceRole
   * Used by middleware for fast workspace access validation
   */
  async getMembershipForAuth(
    userId: string,
    workspaceId: string
  ): Promise<{ workspaceMemberId: string; workspaceRole: WorkspaceRole } | null> {
    // Try cache first
    const cached = await this.deps.cacheService.getMembership(userId, workspaceId);
    if (cached) {
      return {
        workspaceMemberId: cached.workspaceMemberId,
        workspaceRole: cached.workspaceRole as WorkspaceRole,
      };
    }

    // Cache miss - fetch from database
    const member = await this.deps.memberRepo.findByUserAndWorkspace(userId, workspaceId);

    // Cache the result if found
    if (member) {
      await this.deps.cacheService.setMembership(userId, workspaceId, {
        workspaceMemberId: member.workspaceMemberId,
        workspaceRole: member.workspaceRole,
      });
      return {
        workspaceMemberId: member.workspaceMemberId,
        workspaceRole: member.workspaceRole,
      };
    }

    return null;
  }

  /**
   * Get member including soft-deleted ones
   * Used for restore operations where workspace/members may be soft-deleted
   */
  async getMemberIncludingDeleted(userId: string, workspaceId: string) {
    return this.deps.memberRepo.findByUserAndWorkspaceIncludingDeleted(userId, workspaceId);
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
    deletedAt: Date,
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
        // Note: identity cleanup will happen via workspace deletion cascade
        await this.deps.memberRepo.softDelete(member.workspaceMemberId, deletedAt, options);
        // Note: No need to release seat when workspace is being deleted
        return { shouldDeleteWorkspace: true };
      }
    }

    // Reset notification channels and soft-delete identities before leaving
    await this.deps.memberRepo.resetIncomingEventChannels(member.workspaceMemberId, options);
    await this.deps.memberIdentityRepo.softDeleteByMemberId(
      member.workspaceMemberId,
      deletedAt,
      options
    );

    await this.deps.memberRepo.softDelete(member.workspaceMemberId, deletedAt, options);

    // Release seat entitlement after successfully leaving
    try {
      await this.deps.entitlementService.releaseSeats(workspaceId, 1, options);
    } catch (error) {
      // Log but don't fail - member has already left
      logger.error({ err: error, workspaceId }, 'Failed to release seat');
      captureException(error, undefined, { operation: 'release_seat', workspace_id: workspaceId });
    }

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
      notifyFeatureHighlights: member.notifyFeatureHighlights,
      notifyUsageEvents: member.notifyUsageEvents,
      notifyIncomingEvents: this.deps.memberRepo.parseIncomingEventChannels(
        member.notifyIncomingEvents
      ),
      notifyAdminEvents: member.notifyAdminEvents,
    };
  }

  /**
   * Update notification preferences for authenticated user in workspace
   * Member can only update their own preferences.
   * Keys the member's role cannot edit are silently stripped.
   * Throws WORKSPACE_MEMBER_IDS_REQUIRED, WORKSPACE_MEMBER_NOT_IN_WORKSPACE for validation errors
   */
  async updateNotificationPreferences(
    userId: string,
    workspaceId: string,
    preferences: Partial<{
      notifyFeatureHighlights: boolean;
      notifyUsageEvents: boolean;
      notifyIncomingEvents: Partial<IncomingEventChannels>;
      notifyAdminEvents: boolean;
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

    // Strip boolean keys the role cannot edit (hidden = non-editable)
    // notifyIncomingEvents (JSONB channels) is always editable by all roles
    const editableKeys = new Set(getEditableNotificationKeys(member.workspaceRole));
    const { notifyIncomingEvents, ...booleanPrefs } = preferences;

    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(booleanPrefs)) {
      if (editableKeys.has(key as Parameters<typeof editableKeys.has>[0]) && value !== undefined) {
        filtered[key] = value;
      }
    }

    // Include notifyIncomingEvents if provided (all roles can edit channels)
    if (notifyIncomingEvents) {
      filtered.notifyIncomingEvents = notifyIncomingEvents;
    }

    // Nothing editable after filtering -- skip the DB write
    if (Object.keys(filtered).length === 0) {
      return null;
    }

    return this.deps.memberRepo.updateNotificationPreferences(
      member.workspaceMemberId,
      filtered as Parameters<typeof this.deps.memberRepo.updateNotificationPreferences>[1],
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

  /**
   * Enable notification channels for active integrations on a member.
   * Called when a member joins — sets channel preferences based on what's connected.
   * For Slack: resolves identity inline via email lookup before enabling.
   * For other channels: just toggles the JSONB preference.
   * Best-effort: logs errors but doesn't fail member creation.
   */
  private async enableChannelsForActiveIntegrations(
    workspaceMemberId: string,
    workspaceId: string,
    userEmail: string
  ): Promise<void> {
    try {
      const integrations = await this.deps.integrationRepo.findByWorkspaceId(workspaceId);
      if (integrations.length === 0) return;

      const nonSlackDefaults: Record<string, boolean> = {};

      for (const integration of integrations) {
        if (integration.provider === 'slack') {
          // Slack: resolve identity inline so notifications work immediately
          try {
            await this.deps.notificationChannelService.enableChannel(
              workspaceMemberId,
              workspaceId,
              userEmail,
              'slack'
            );
          } catch (error) {
            logger.warn(
              { err: error, workspaceMemberId, workspaceId },
              'Failed to resolve Slack identity for new member, skipping Slack channel'
            );
          }
        } else {
          // Intercom/Zendesk: no identity needed, just toggle JSONB
          nonSlackDefaults[integration.provider] = true;
        }
      }

      if (Object.keys(nonSlackDefaults).length > 0) {
        await this.deps.memberRepo.updateNotificationPreferences(workspaceMemberId, {
          notifyIncomingEvents: nonSlackDefaults,
        });
      }
    } catch (error) {
      logger.error(
        { err: error, workspaceMemberId, workspaceId },
        'Failed to enable channels for active integrations'
      );
      captureException(error, undefined, {
        operation: 'enable_channels_on_member_join',
        workspace_member_id: workspaceMemberId,
        workspace_id: workspaceId,
      });
    }
  }
}
