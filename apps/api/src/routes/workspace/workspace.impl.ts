/**
 * Workspace contract implementation using oRPC
 * Implements the workspace contract defined in @workspace/contract
 *
 * INCREMENTAL MIGRATION: Starting with basic CRUD operations
 */

import { authorized } from '@/api/middleware/auth.orpc';
import { workspaceError, inviteError, domainError } from '@workspace/contract';
import {
  createWorkspaceMiddleware,
  createWorkspaceRoleMiddleware,
} from '@/api/middleware/workspace.orpc';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { InviteService } from '@/api/services/invite.service';
import type { ProjectService } from '@/api/services/project.service';
import type { DomainService } from '@/api/services/domain.service';
import { createPaginationMeta } from '@/api/types';
import { getPlanName } from '@workspace/pricing';

/**
 * GET /workspace - List all user workspaces
 * Requires authentication
 */
export const getAllWorkspacesImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.list.handler(async ({ input, context }) => {
    const page = input.query.page || 1;
    const perPage = 5;

    const { workspaces, total } = await workspaceService.getByUserIdPaginated(
      context.user.id,
      page,
      perPage,
      {
        minimal: input.query.minimal,
        includeNotificationPreferences: input.query.include_notification_preference,
        includeWorkspaceMembership: input.query.include_workspace_membership,
      }
    );

    return {
      message: 'Workspaces retrieved successfully',
      data: {
        workspaces: workspaces as any,
        total,
        pagination: createPaginationMeta(page, perPage, total),
      },
    };
  });
};

/**
 * GET /workspace/count - Count user workspaces by role
 * Requires authentication
 */
export const countWorkspacesImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.count.handler(async ({ input, context }) => {
    const count = await workspaceService.countByUserWithRoles(context.user.id, input.query.roles);

    return {
      message: 'Workspace count retrieved successfully',
      data: { count },
    };
  });
};

/**
 * GET /workspace/:workspaceId - Get workspace by ID
 * Requires authentication
 */
export const getWorkspaceByIdImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.getById.handler(async ({ context, input }) => {
    const workspace = await workspaceService.getById(input.params.workspaceId);
    const workspacePlanName = getPlanName(workspace.workspacePlan);

    return {
      message: 'Workspace retrieved successfully',
      data: {
        workspace: {
          ...workspace,
          workspacePlanName,
        },
      },
    };
  });
};

/**
 * PATCH /workspace/:workspaceId - Update workspace name
 * Requires admin or owner role
 */
export const updateWorkspaceNameImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const workspaceRoleMiddleware = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.updateName
    .use(workspaceRoleMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const workspace = await workspaceService.updateName(
        input.params.workspaceId,
        input.body.name
      );

      return {
        message: 'Workspace name updated successfully',
        data: {
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.workspaceName,
        },
      };
    });
};

/**
 * DELETE /workspace/:workspaceId - Delete workspace
 * Requires admin or owner role
 */
export const deleteWorkspaceImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const workspaceRoleMiddleware = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.delete
    .use(workspaceRoleMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await workspaceService.deleteWorkspace(input.params.workspaceId);

      return {
        message: 'Workspace deleted successfully',
        data: {
          workspaceId: input.params.workspaceId,
          success: true,
        },
      };
    });
};

/**
 * POST /workspace/:id/restore - Restore a soft-deleted workspace
 * Requires admin or owner role
 */
export const restoreWorkspaceImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const workspaceRoleMiddleware = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.restore
    .use(workspaceRoleMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const result = await workspaceService.restoreWorkspace(input.params.workspaceId);

      return {
        message: 'Workspace restored successfully',
        data: {
          workspace: {
            workspaceId: result.workspace.workspaceId,
            workspaceName: result.workspace.workspaceName,
            isDeleted: result.workspace.isDeleted,
            deletedAt: result.workspace.deletedAt,
          },
          restoredProjects: result.restoredProjects,
          restoredLinks: result.restoredLinks,
        },
      };
    });
};

/**
 * GET /workspace/:id/preferences - Get workspace preferences
 * Requires authentication
 */
export const getWorkspacePreferencesImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.preferences.get.handler(async ({ input }) => {
    const preferences = await workspaceService.getPreferencesById(input.params.workspaceId);

    return {
      message: 'Workspace preferences retrieved successfully',
      data: { preferences },
    };
  });
};

/**
 * PATCH /workspace/:id/preferences - Update workspace preferences
 * Requires workspace membership
 */
export const updateWorkspacePreferencesImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const workspaceMemberMiddleware = createWorkspaceMiddleware(
    workspaceMemberService,
    workspaceService
  );

  return authorized.workspace.preferences.update
    .use(workspaceMemberMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const preferences = await workspaceService.updatePreferences(
        input.params.workspaceId,
        input.body
      );

      return {
        message: 'Workspace preferences updated successfully',
        data: { preferences },
      };
    });
};

/**
 * GET /workspace/:id/members - Get workspace members
 * Requires authentication
 */
export const getWorkspaceMembersImpl = (workspaceMemberService: WorkspaceMemberService) => {
  return authorized.workspace.members.list.handler(async ({ input, context }) => {
    const page = input.query.page || 1;
    const perPage = input.query.per_page || 5;
    const { members, total } = await workspaceMemberService.getTeamMembers(
      input.params.workspaceId,
      page,
      perPage
    );

    const teamMembers = members.map((member) => ({
      workspaceMemberId: member.workspaceMemberId,
      memberName: member.userName,
      memberEmail: member.userEmail,
      workspaceRole: member.role,
    }));

    return {
      message: 'Workspace members retrieved successfully',
      data: {
        workspaceId: input.params.workspaceId,
        workspaceMembers: teamMembers,
        pagination: createPaginationMeta(page, perPage, total),
      },
    };
  });
};

/**
 * GET /workspace/:id/membership - Get current user's workspace membership
 * Requires authentication
 * Returns only the current user's membership and role without fetching the full members list
 */
export const getWorkspaceMembershipImpl = (workspaceMemberService: WorkspaceMemberService) => {
  return authorized.workspace.members.getMembership.handler(async ({ input, context }) => {
    const membership = await workspaceMemberService.getMember(
      context.user.id,
      input.params.workspaceId
    );

    if (!membership) {
      throw workspaceError.WORKSPACE_MEMBER_NOT_IN_WORKSPACE();
    }

    return {
      message: 'Workspace membership retrieved successfully',
      data: {
        workspaceId: input.params.workspaceId,
        workspaceMembership: {
          workspaceMemberId: membership.workspaceMemberId,
          workspaceRole: membership.workspaceRole,
        },
      },
    };
  });
};

/**
 * PATCH /workspace/:id/members/:workspaceMemberId - Update member role
 * Requires admin or owner role
 */
export const updateMemberRoleImpl = (
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.members.updateRole
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      await workspaceMemberService.updateMemberRole({
        memberId: input.params.workspaceMemberId,
        newRole: input.body.role,
        userId: context.user.id,
        workspaceId: input.params.workspaceId,
      });

      return {
        message: 'Member role updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          workspaceMemberId: input.params.workspaceMemberId,
          workspaceRole: input.body.role,
        },
      };
    });
};

/**
 * DELETE /workspace/:id/members/:workspaceMemberId - Remove member
 * Requires admin or owner role
 */
export const removeMemberImpl = (
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.members.remove
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      await workspaceMemberService.removeMember({
        memberId: input.params.workspaceMemberId,
        workspaceId: input.params.workspaceId,
        userId: context.user.id,
      });

      return {
        message: 'Member removed successfully',
        data: {
          workspaceId: input.params.workspaceId,
          workspaceMemberId: input.params.workspaceMemberId,
        },
      };
    });
};

/**
 * POST /workspace/:workspaceId/leave - Leave workspace
 * Requires authentication, allows member to remove themselves
 * If user is the sole owner with no other members, the workspace is deactivated
 */
export const leaveWorkspaceImpl = (
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.members.leave
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const result = await workspaceMemberService.leaveWorkspace(
        context.user.id,
        input.params.workspaceId
      );

      // If sole owner with no other members, deactivate the workspace
      if (result.shouldDeleteWorkspace) {
        await workspaceService.deleteWorkspace(input.params.workspaceId);
      }

      return {
        message: result.shouldDeleteWorkspace
          ? 'Successfully left and deactivated workspace'
          : 'Successfully left workspace',
        data: {
          workspaceId: input.params.workspaceId,
          workspaceDeleted: result.shouldDeleteWorkspace,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/notifications - Get notification preferences
 * Requires workspace member
 */
export const getNotificationPreferencesImpl = (
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.notifications.get
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const notificationPreferences = await workspaceMemberService.getNotificationPreferences(
        context.user.id,
        input.params.workspaceId
      );

      return {
        message: 'Notification preferences retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          notificationPreferences,
        },
      };
    });
};

/**
 * PATCH /workspace/:workspaceId/notifications - Update notification preferences
 * Requires workspace member
 */
export const updateNotificationPreferencesImpl = (
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.notifications.update
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      await workspaceMemberService.updateNotificationPreferences(
        context.user.id,
        input.params.workspaceId,
        input.body
      );

      return {
        message: 'Notification preferences updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
        },
      };
    });
};

/**
 * PUT /workspace/:workspaceId/preferences/link - Update link branding settings
 * Requires admin or owner role
 */
export const updateLinkSettingsImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.linkSettings.update
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const updated = await workspaceService.updatePreferences(input.params.workspaceId, {
        recordingCompanyName: input.body.recordingCompanyName,
        recordingHeader: input.body.recordingHeader,
        recordingFootnote: input.body.recordingFootnote,
        recordingPrimaryColor: input.body.recordingPrimaryColor,
        recordingMaxDurationMs: input.body.recordingMaxDurationMs,
      });

      return {
        message: 'Link settings updated successfully',
        data: {
          workspaceId: updated.workspaceId,
          recordingCustomizeLink: updated.recordingCustomizeLink,
          recordingCompanyName: updated.recordingCompanyName,
          recordingCompanyLogoPath: updated.recordingCompanyLogoPath,
          recordingHeader: updated.recordingHeader,
          recordingFootnote: updated.recordingFootnote,
          recordingPrimaryColor: updated.recordingPrimaryColor,
          recordingMaxDurationMs: updated.recordingMaxDurationMs,
          recordingSlug: updated.recordingSlug,
        },
      };
    });
};

/**
 * GET /workspace/:id/invite - Get invite URL
 * Requires workspace member
 */
export const getInviteUrlImpl = (
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.invite.getUrl
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const inviteUrl = await inviteService.getInviteUrl(input.params.workspaceId, context.user.id);

      return {
        message: 'Invite URL retrieved successfully',
        data: {
          inviteUrl,
          workspaceId: input.params.workspaceId,
        },
      };
    });
};

/**
 * POST /workspace/:id/invite/rotate - Rotate invite token
 * Requires admin or owner role
 */
export const rotateInviteTokenImpl = (
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.invite.rotate
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const inviteUrl = await inviteService.regenerateInviteUrl(
        input.params.workspaceId,
        context.user.id
      );

      return {
        message: 'Invite token rotated successfully',
        data: {
          inviteUrl,
          workspaceId: input.params.workspaceId,
        },
      };
    });
};

/**
 * POST /workspace/:id/invite/send - Send workspace invitations
 * Requires workspace member
 */
export const sendWorkspaceInvitesImpl = (
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.invite.send
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const result = await inviteService.sendInvites({
        workspaceId: input.params.workspaceId,
        emails: input.body.emails,
        invitedBy: context.user.id,
      });

      const sent = result.sentEmails.map((email) => ({
        email,
        success: true,
      }));

      const failed = result.failedEmails.map((item) => ({
        email: item.email,
        success: false,
        error: item.reason,
      }));

      return {
        message: 'Invites processed successfully',
        data: {
          sent,
          failed,
        },
      };
    });
};

/**
 * POST /workspace/:workspaceId/invite/accept - Accept workspace invitation
 * Requires authentication
 * Validates token matches the workspace and adds user as member
 */
export const acceptInviteImpl = (
  inviteService: InviteService,
  workspaceService: WorkspaceService
) => {
  return authorized.workspace.invite.accept.handler(async ({ input, context }) => {
    // Verify the token is for the correct workspace
    const validation = await inviteService.validateInvite(input.body.token);

    // Ensure the token's workspace matches the requested workspace
    if (validation.workspaceId !== input.params.workspaceId) {
      throw inviteError.INVITE_TOKEN_INVALID();
    }

    // Accept the invite
    const result = await inviteService.acceptInvite({
      inviteToken: input.body.token,
      userId: context.user.id,
    });

    return {
      message: 'Invitation accepted successfully',
      data: {
        workspaceId: result.workspace.workspaceId,
        workspaceName: result.workspace.workspaceName,
      },
    };
  });
};

/**
 * GET /workspace/:id/domains - Get workspace domains
 * Requires workspace member
 */
export const getWorkspaceDomainsImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.list
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const page = input.query.page || 1;
      const perPage = input.query.per_page || 5;
      const sortBy = input.query.sort_by || 'created_at';
      const sortDirection = input.query.sort_direction || 'desc';

      const { domains, total } = await domainService.getByWorkspaceIdPaginated(
        input.params.workspaceId,
        page,
        perPage,
        sortBy,
        sortDirection
      );

      return {
        message: 'Workspace domains retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          domains,
          pagination: createPaginationMeta(page, perPage, total),
        },
      };
    });
};

/**
 * GET /workspace/:id/domains/:domainId - Get domain by ID
 * Requires workspace member
 */
export const getDomainByIdImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.getById
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const domain = await domainService.getByIdWithPreferences(
        input.params.domainId,
        input.params.workspaceId
      );

      return {
        message: 'Domain retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          domain,
        },
      };
    });
};

/**
 * POST /workspace/:id/domains - Add domain
 * Requires workspace member
 */
export const addDomainImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.add
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const domain = await domainService.create({
        workspaceId: input.params.workspaceId,
        url: input.body.url,
        status: 'pending',
      });

      if (!domain) {
        throw domainError.DOMAIN_CREATE_FAILED();
      }

      return {
        message: 'Domain added successfully',
        data: {
          workspaceId: input.params.workspaceId,
          domain,
        },
      };
    });
};

/**
 * PATCH /workspace/:id/domains/:domainId - Update domain
 * Requires workspace member
 */
export const updateDomainImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.update
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const domain = await domainService.updateDomainUrl(
        input.params.domainId,
        input.params.workspaceId,
        input.body.url
      );

      return {
        message: 'Domain updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          domain,
        },
      };
    });
};

/**
 * DELETE /workspace/:id/domains/:domainId - Delete domain
 * Requires admin or owner role
 */
export const deleteDomainImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.domains.delete
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await domainService.deleteDomain(input.params.domainId, input.params.workspaceId);

      return {
        message: 'Domain deleted successfully',
        data: {
          workspaceId: input.params.workspaceId,
          domainId: input.params.domainId,
        },
      };
    });
};

/**
 * GET /workspace/:id/domains/:domainId/verify - Get domain verification URL
 * Requires workspace member
 */
export const getDomainVerificationUrlImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.getVerificationUrl
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const domain = await domainService.getByIdWithPreferences(
        input.params.domainId,
        input.params.workspaceId
      );
      const token = domainService.generateVerificationToken(
        input.params.workspaceId,
        domain.domainId,
        domain.domainUrl
      );
      const verificationUrl = `${domain.domainUrl}?userplane-action=verify&userplane-token=${token}`;

      return {
        message: 'Domain verification URL generated successfully',
        data: {
          verificationUrl,
          domainUrl: domain.domainUrl,
        },
      };
    });
};

/**
 * GET /workspace/:id/domains/:domainId/preferences - Get domain recording preferences
 * Requires workspace member
 */
export const getDomainRecordingPreferencesImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.preferences.get
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const domain = await domainService.getByIdWithPreferences(
        input.params.domainId,
        input.params.workspaceId
      );

      return {
        message: 'Domain recording preferences retrieved successfully',
        data: {
          domainId: domain.domainId,
          workspaceId: input.params.workspaceId,
          recordingHideSensitive: domain.recordingHideSensitive,
          recordingCaptureClientLog: domain.recordingCaptureClientLog,
          recordingCaptureClientAction: domain.recordingCaptureClientAction,
          recordingCaptureServerLog: domain.recordingCaptureServerLog,
          recordingCaptureNetworkLog: domain.recordingCaptureNetworkLog,
        },
      };
    });
};

/**
 * PATCH /workspace/:id/domains/:domainId/preferences - Update domain recording preferences
 * Requires workspace member
 */
export const updateDomainRecordingPreferencesImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.preferences.update
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await domainService.updateRecordingPreferences(
        input.params.domainId,
        input.params.workspaceId,
        {
          recordingHideSensitive: input.body.recordingHideSensitive,
          recordingCaptureClientLog: input.body.recordingCaptureClientLog,
          recordingCaptureClientAction: input.body.recordingCaptureClientAction,
          recordingCaptureServerLog: input.body.recordingCaptureServerLog,
          recordingCaptureNetworkLog: input.body.recordingCaptureNetworkLog,
        }
      );

      return {
        message: 'Domain recording preferences updated successfully',
        data: {
          domainId: input.params.domainId,
          workspaceId: input.params.workspaceId,
        },
      };
    });
};

/**
 * PUT /workspace/:id/domains/:domainId/preferences - Replace domain recording preferences
 * Requires workspace member
 */
export const replaceDomainRecordingPreferencesImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.preferences.replace
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await domainService.replaceRecordingPreferences(
        input.params.domainId,
        input.params.workspaceId,
        {
          recordingHideSensitive: input.body.recordingHideSensitive,
          recordingCaptureClientLog: input.body.recordingCaptureClientLog,
          recordingCaptureClientAction: input.body.recordingCaptureClientAction,
          recordingCaptureServerLog: input.body.recordingCaptureServerLog,
          recordingCaptureNetworkLog: input.body.recordingCaptureNetworkLog,
        }
      );

      return {
        message: 'Domain recording preferences replaced successfully',
        data: {
          domainId: input.params.domainId,
          workspaceId: input.params.workspaceId,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/search - Search workspace
 * Requires workspace member
 * Searches across members, projects, domains, and links
 */
export const workspaceSearchImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.search
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const results = await workspaceService.search(
        input.params.workspaceId,
        input.query.q,
        input.query.type,
        input.query.limit || 5
      );

      return {
        message: 'Search results retrieved successfully',
        data: {
          results,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/invite-policy - Get workspace invite policy
 * Requires admin or owner role
 */
export const getInvitePolicyImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.invitePolicy.get
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const policy = await workspaceService.getInvitePolicy(input.params.workspaceId);

      return {
        message: 'Invite policy retrieved successfully',
        data: policy,
      };
    });
};

/**
 * PATCH /workspace/:workspaceId/invite-policy - Update workspace invite policy
 * Requires owner role
 */
export const updateInvitePolicyImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const requireOwner = createWorkspaceRoleMiddleware(workspaceMemberService, workspaceService, [
    'owner',
  ]);

  return authorized.workspace.invitePolicy.update
    .use(requireOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const policy = await workspaceService.updateInvitePolicy(input.params.workspaceId, {
        workspaceInvitePolicy: input.body.workspaceInvitePolicy,
        workspaceInviteDomains: input.body.workspaceInviteDomains,
      });

      return {
        message: 'Invite policy updated successfully',
        data: policy,
      };
    });
};

/**
 * GET /workspace/suggest - Suggest workspaces based on email domain
 * Requires authentication
 */
export const suggestWorkspacesImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.suggest.handler(async ({ input, context }) => {
    const suggestions = await workspaceService.suggestWorkspaces(
      context.user.email,
      context.user.id,
      input.query.page,
      input.query.per_page
    );

    return {
      message: 'Suggested workspaces retrieved successfully',
      data: suggestions,
    };
  });
};

/**
 * POST /workspace/:workspaceId/join - Join or request access to workspace
 * Requires authentication
 */
export const joinWorkspaceImpl = (inviteService: InviteService) => {
  return authorized.workspace.join.handler(async ({ input, context }) => {
    const result = await inviteService.joinWorkspace({
      workspaceId: input.params.workspaceId,
      userId: context.user.id,
      userEmail: context.user.email,
      userName: context.user.name,
    });

    return {
      message:
        result.status === 'joined'
          ? 'Successfully joined workspace'
          : 'Access request sent to workspace owner',
      data: result,
    };
  });
};

/**
 * GET /workspace/accessRequest/validate - Validate access request token
 * Requires authentication (owner only, validated in service)
 */
export const validateAccessRequestImpl = (inviteService: InviteService) => {
  return authorized.workspace.accessRequest.validate.handler(async ({ input, context }) => {
    const result = await inviteService.validateAccessRequest({
      token: input.query.token,
      viewerId: context.user.id,
    });

    return {
      message: 'Access request validated successfully',
      data: result,
    };
  });
};

/**
 * POST /workspace/accessRequest/approve - Approve access request
 * Requires authentication (owner only, validated in service)
 */
export const approveAccessRequestImpl = (inviteService: InviteService) => {
  return authorized.workspace.accessRequest.approve.handler(async ({ input, context }) => {
    const result = await inviteService.approveAccessRequest({
      token: input.body.token,
      approverId: context.user.id,
    });

    return {
      message: 'Access request approved successfully',
      data: result,
    };
  });
};

/**
 * POST /workspace/accessRequest/decline - Decline access request
 * Requires authentication (owner only, validated in service)
 */
export const declineAccessRequestImpl = (inviteService: InviteService) => {
  return authorized.workspace.accessRequest.decline.handler(async ({ input, context }) => {
    const result = await inviteService.declineAccessRequest({
      token: input.body.token,
      declinerId: context.user.id,
    });

    return {
      message: 'Access request declined',
      data: result,
    };
  });
};

/**
 * GET /workspace/:workspaceId/status - Get workspace status and access info
 * Requires authentication but NOT workspace membership
 * Returns access status for the current user to determine what UI to show
 */
export const getWorkspaceStatusImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.status.handler(async ({ input, context }) => {
    const status = await workspaceService.getStatus(
      input.params.workspaceId,
      context.user.id,
      context.user.email
    );

    return {
      message: 'Workspace status retrieved successfully',
      data: status,
    };
  });
};

/**
 * GET /workspace/:workspaceId/billing-email - Get workspace billing email
 * Available to all authenticated users (who can access the workspace, usually members)
 */
export const getWorkspaceBillingEmailImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.getWorkspaceBillingEmail
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const email = await workspaceService.getWorkspaceBillingEmail(input.params.workspaceId);

      return {
        message: 'Workspace billing email retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          workspaceBillingEmail: email,
        },
      };
    });
};

/**
 * PATCH /workspace/:workspaceId/billing-email - Update workspace billing email
 * Available only to workspace admin and owners
 */
export const updateWorkspaceBillingEmailImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorized.workspace.updateWorkspaceBillingEmail
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const updated = await workspaceService.updateWorkspaceBillingEmail(
        input.params.workspaceId,
        input.body.email
      );

      return {
        message: 'Workspace billing email updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          workspaceBillingEmail: updated.workspaceBillingEmail!,
        },
      };
    });
};

/**
 * Create the workspace procedures object
 * Complete implementation with CRUD, member management, invites, and domains
 */
export const createWorkspaceProcedures = (
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  projectService: ProjectService,
  domainService: DomainService
) => {
  return {
    list: getAllWorkspacesImpl(workspaceService),
    count: countWorkspacesImpl(workspaceService),
    getById: getWorkspaceByIdImpl(workspaceService),
    status: getWorkspaceStatusImpl(workspaceService),
    updateName: updateWorkspaceNameImpl(workspaceService, workspaceMemberService),
    delete: deleteWorkspaceImpl(workspaceService, workspaceMemberService),
    restore: restoreWorkspaceImpl(workspaceService, workspaceMemberService),
    search: workspaceSearchImpl(workspaceService, workspaceMemberService),
    suggest: suggestWorkspacesImpl(workspaceService),
    join: joinWorkspaceImpl(inviteService),
    getWorkspaceBillingEmail: getWorkspaceBillingEmailImpl(
      workspaceService,
      workspaceMemberService
    ),
    updateWorkspaceBillingEmail: updateWorkspaceBillingEmailImpl(
      workspaceService,
      workspaceMemberService
    ),

    preferences: {
      get: getWorkspacePreferencesImpl(workspaceService),
      update: updateWorkspacePreferencesImpl(workspaceService, workspaceMemberService),
    },

    members: {
      list: getWorkspaceMembersImpl(workspaceMemberService),
      getMembership: getWorkspaceMembershipImpl(workspaceMemberService),
      updateRole: updateMemberRoleImpl(workspaceMemberService, workspaceService),
      remove: removeMemberImpl(workspaceMemberService, workspaceService),
      leave: leaveWorkspaceImpl(workspaceMemberService, workspaceService),
    },

    notifications: {
      get: getNotificationPreferencesImpl(workspaceMemberService, workspaceService),
      update: updateNotificationPreferencesImpl(workspaceMemberService, workspaceService),
    },

    linkSettings: {
      update: updateLinkSettingsImpl(workspaceService, workspaceMemberService),
    },

    invite: {
      getUrl: getInviteUrlImpl(inviteService, workspaceMemberService, workspaceService),
      rotate: rotateInviteTokenImpl(inviteService, workspaceMemberService, workspaceService),
      send: sendWorkspaceInvitesImpl(inviteService, workspaceMemberService, workspaceService),
      accept: acceptInviteImpl(inviteService, workspaceService),
    },

    invitePolicy: {
      get: getInvitePolicyImpl(workspaceService, workspaceMemberService),
      update: updateInvitePolicyImpl(workspaceService, workspaceMemberService),
    },

    accessRequest: {
      validate: validateAccessRequestImpl(inviteService),
      approve: approveAccessRequestImpl(inviteService),
      decline: declineAccessRequestImpl(inviteService),
    },

    domains: {
      list: getWorkspaceDomainsImpl(domainService, workspaceMemberService, workspaceService),
      getById: getDomainByIdImpl(domainService, workspaceMemberService, workspaceService),
      add: addDomainImpl(domainService, workspaceMemberService, workspaceService),
      update: updateDomainImpl(domainService, workspaceMemberService, workspaceService),
      delete: deleteDomainImpl(domainService, workspaceMemberService, workspaceService),
      getVerificationUrl: getDomainVerificationUrlImpl(
        domainService,
        workspaceMemberService,
        workspaceService
      ),
      preferences: {
        get: getDomainRecordingPreferencesImpl(
          domainService,
          workspaceMemberService,
          workspaceService
        ),
        update: updateDomainRecordingPreferencesImpl(
          domainService,
          workspaceMemberService,
          workspaceService
        ),
        replace: replaceDomainRecordingPreferencesImpl(
          domainService,
          workspaceMemberService,
          workspaceService
        ),
      },
    },
  };
};
