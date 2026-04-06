/**
 * Workspace contract implementation using oRPC
 * Implements the workspace contract defined in @userplane/contract
 *
 * INCREMENTAL MIGRATION: Starting with basic CRUD operations
 */

import { billingError, domainError, inviteError, workspaceError } from '@userplane/contract';

import { authorizedRateLimited } from '@/api/middleware/rate-limit.orpc';
import {
  createWorkspaceMiddleware,
  createWorkspaceRestoreMiddleware,
  createWorkspaceRoleMiddleware,
} from '@/api/middleware/workspace.orpc';
import { IntegrationHelper } from '@/api/repositories/integrations.repository';
import type { BillingService } from '@/api/services/billing.service';
import type { DomainService } from '@/api/services/domain.service';
import type { EmailService } from '@/api/services/email.service';
import type { IntercomService } from '@/api/services/intercom-oauth.service';
import type { InviteService } from '@/api/services/invite.service';
import type { LinkService } from '@/api/services/link.service';
import type { NotificationChannelService } from '@/api/services/notification-channel.service';
import type { ProjectService } from '@/api/services/project.service';
import type { RecordingService } from '@/api/services/recording.service';
import type { SlackCanvasService } from '@/api/services/slack-canvas.service';
import type { SlackService } from '@/api/services/slack-oauth.service';
import type { TokenService } from '@/api/services/token.service';
import type { UserService } from '@/api/services/user.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { ZendeskService } from '@/api/services/zendesk-oauth.service';
import { createPaginationMeta } from '@/api/types';
import { calculateDaysSince, getRestorationMaxWindowDays } from '@/api/utils/date';
import { formatDeletionDate } from '@/api/utils/format';

/**
 * GET /workspace - List all user workspaces
 * Requires authentication
 */
export const getAllWorkspacesImpl = (workspaceService: WorkspaceService) => {
  return authorizedRateLimited.workspace.list.handler(async ({ input, context }) => {
    const page = input.query.page || 1;
    const perPage = 5;

    const { workspaces, total } = await workspaceService.getByUserIdPaginated(
      context.user.id,
      page,
      perPage,
      {
        includeWorkspaceMembership: input.query.include_workspace_membership,
      }
    );

    return {
      message: 'Workspaces retrieved successfully',
      data: {
        workspaces,
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
  return authorizedRateLimited.workspace.count.handler(async ({ input, context }) => {
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
 * Plan is derived from subscription status, not stored on workspace
 */
export const getWorkspaceByIdImpl = (workspaceService: WorkspaceService) => {
  return authorizedRateLimited.workspace.getById.handler(async ({ input }) => {
    const workspace = await workspaceService.getById(input.params.workspaceId);

    return {
      message: 'Workspace retrieved successfully',
      data: {
        workspace,
      },
    };
  });
};

/**
 * GET /workspace/:workspaceId/count - Count workspace resources
 * Requires workspace membership
 */
export const getWorkspaceResourcesCountImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService,
  projectService: ProjectService,
  recordingService: RecordingService,
  linkService: LinkService,
  domainService: DomainService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.getResourcesCount
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const { workspaceId } = input.params;
      const query = input.query;

      const counts: {
        projects?: number;
        recordings?: number;
        activeRecordings?: number;
        links?: number;
        domains?: number;
        members?: number;
      } = {};

      // Fetch counts in parallel for better performance
      const countPromises: Promise<void>[] = [];

      if (query.include_projects) {
        countPromises.push(
          projectService.countByWorkspace(workspaceId).then((count) => {
            counts.projects = count;
          })
        );
      }

      if (query.include_recordings) {
        countPromises.push(
          recordingService
            .countByWorkspace(workspaceId, { statusGroup: 'AVAILABLE' })
            .then((count) => {
              counts.recordings = count;
            })
        );
      }

      if (query.include_active_recordings) {
        countPromises.push(
          recordingService
            .countByWorkspace(workspaceId, { statusGroup: 'PENDING' })
            .then((count) => {
              counts.activeRecordings = count;
            })
        );
      }

      if (query.include_links) {
        countPromises.push(
          linkService.countByWorkspace(workspaceId).then((count) => {
            counts.links = count;
          })
        );
      }

      if (query.include_domains) {
        countPromises.push(
          domainService.countByWorkspace(workspaceId).then((count) => {
            counts.domains = count;
          })
        );
      }

      if (query.include_members) {
        countPromises.push(
          workspaceMemberService.countByWorkspace(workspaceId).then((count) => {
            counts.members = count;
          })
        );
      }

      await Promise.all(countPromises);

      return {
        message: 'Workspace resource counts retrieved successfully',
        data: {
          workspaceId,
          counts,
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

  return authorizedRateLimited.workspace.updateName
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
  workspaceMemberService: WorkspaceMemberService,
  emailService: EmailService
) => {
  const workspaceRoleMiddleware = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.delete
    .use(workspaceRoleMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const workspace = await workspaceService.getById(input.params.workspaceId);
      const deletionDate = new Date();

      await workspaceService.deleteWorkspace(input.params.workspaceId, deletionDate);

      // Calculate deletion date using restoration max window
      const maxWindow = getRestorationMaxWindowDays();
      deletionDate.setDate(deletionDate.getDate() + maxWindow);
      const formattedDeletionDate = formatDeletionDate(deletionDate);

      // Send deletion scheduled email
      await emailService.sendSafeWorkspaceDeletionScheduled(
        { to: context.user.email },
        {
          workspaceName: workspace.workspaceName,
          deletionDate: formattedDeletionDate,
          workspaceId: input.params.workspaceId,
        }
      );

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
 * GET /workspace/:id/restore - Get restore info for a soft-deleted workspace
 * Requires admin or owner role
 */
export const getWorkspaceRestoreInfoImpl = (
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) => {
  const workspaceRestoreMiddleware = createWorkspaceRestoreMiddleware(workspaceMemberService, [
    'admin',
    'owner',
  ]);

  return authorizedRateLimited.workspace.getRestoreInfo
    .use(workspaceRestoreMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const result = await workspaceService.getWorkspaceRestoreInfo(input.params.workspaceId);

      return {
        message: 'Workspace restore info retrieved successfully',
        data: {
          ...result,
          workspace: {
            ...result.workspace,
            deletedAt: result.workspace.deletedAt ? new Date(result.workspace.deletedAt) : null,
          },
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
  workspaceMemberService: WorkspaceMemberService,
  emailService: EmailService
) => {
  const workspaceRestoreMiddleware = createWorkspaceRestoreMiddleware(workspaceMemberService, [
    'admin',
    'owner',
  ]);

  return authorizedRateLimited.workspace.restore
    .use(workspaceRestoreMiddleware, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const result = await workspaceService.restoreWorkspace(input.params.workspaceId);

      // Calculate days since deletion
      let deletedSince: number | null = null;
      if (result.workspace.deletedAt) {
        deletedSince = calculateDaysSince(new Date(result.workspace.deletedAt));
      }

      // Send email to workspace owners that the workspace has been restored
      const owners = await workspaceMemberService.getOwners(input.params.workspaceId);

      // Send appropriate email based on restoration status using batch sending
      const ownerEmails = owners.map((owner) => owner.email);
      const emailMethod =
        result.restorationStatus === 'partial'
          ? emailService.sendSafeWorkspaceRecoveryPartially
          : emailService.sendSafeWorkspaceRecoveryConfirmation;

      // Use batch sending via Resend's batch API for multiple recipients
      await emailMethod(
        { to: ownerEmails },
        {
          workspaceName: result.workspace.workspaceName,
          workspaceId: input.params.workspaceId,
        }
      );

      return {
        message: 'Workspace restored successfully',
        data: {
          restorationStatus: result.restorationStatus,
          workspace: {
            workspaceId: result.workspace.workspaceId,
            workspaceName: result.workspace.workspaceName,
            isDeleted: result.workspace.isDeleted,
            deletedAt: result.workspace.deletedAt ? new Date(result.workspace.deletedAt) : null,
            deletedSince,
          },
          restoredProjects: result.restoredProjects,
          restoredLinks: result.restoredLinks,
          restoredMembers: result.restoredMembers,
          restoredRecordings: result.restoredRecordings,
          restoredIntegrations: result.restoredIntegrations,
        },
      };
    });
};

/**
 * GET /workspace/:id/preferences - Get workspace preferences
 * Requires authentication
 */
export const getWorkspacePreferencesImpl = (workspaceService: WorkspaceService) => {
  return authorizedRateLimited.workspace.preferences.get.handler(async ({ input }) => {
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

  return authorizedRateLimited.workspace.preferences.update
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
  return authorizedRateLimited.workspace.members.list.handler(async ({ input }) => {
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
  return authorizedRateLimited.workspace.members.getMembership.handler(
    async ({ input, context }) => {
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
            workspaceJoinedAt: membership.createdAt,
          },
        },
      };
    }
  );
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

  return authorizedRateLimited.workspace.members.updateRole
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

  return authorizedRateLimited.workspace.members.remove
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      await workspaceMemberService.removeMember({
        memberId: input.params.workspaceMemberId,
        workspaceId: input.params.workspaceId,
        userId: context.user.id,
        deletedAt: new Date(),
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
  workspaceService: WorkspaceService,
  emailService: EmailService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.members.leave
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const deletionDate = new Date();
      const result = await workspaceMemberService.leaveWorkspace(
        context.user.id,
        input.params.workspaceId,
        deletionDate
      );

      // If sole owner with no other members, deactivate the workspace
      if (result.shouldDeleteWorkspace) {
        // Fetch workspace details before deletion
        const workspace = await workspaceService.getById(input.params.workspaceId);

        await workspaceService.deleteWorkspace(input.params.workspaceId, deletionDate);

        // Send deletion scheduled email
        const maxWindow = getRestorationMaxWindowDays();
        deletionDate.setDate(deletionDate.getDate() + maxWindow);
        const formattedDeletionDate = formatDeletionDate(deletionDate);

        await emailService.sendSafeWorkspaceDeletionScheduled(
          { to: context.user.email },
          {
            workspaceName: workspace.workspaceName,
            deletionDate: formattedDeletionDate,
            workspaceId: input.params.workspaceId,
          }
        );
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
  workspaceService: WorkspaceService,
  notificationChannelService: NotificationChannelService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.notifications.get
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const [notificationPreferences, availableChannels] = await Promise.all([
        workspaceMemberService.getNotificationPreferences(
          context.user.id,
          input.params.workspaceId
        ),
        notificationChannelService.getAvailableChannels(input.params.workspaceId),
      ]);

      return {
        message: 'Notification preferences retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          notificationPreferences,
          availableChannels,
        },
      };
    });
};

/**
 * PATCH /workspace/:workspaceId/notifications - Update notification preferences
 * Requires workspace member
 *
 * Accepts boolean fields (feature highlights, usage, admin) and
 * notifyIncomingEvents as a partial channel map { email?, slack?, intercom?, zendesk? }.
 * For Slack, enabling triggers identity resolution (email → Slack user ID).
 */
export const updateNotificationPreferencesImpl = (
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  notificationChannelService: NotificationChannelService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.notifications.update
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const { notifyIncomingEvents, ...booleanPrefs } = input.body;

      // Handle Slack channel toggle separately (requires identity resolution)
      if (notifyIncomingEvents?.slack !== undefined) {
        const member = await workspaceMemberService.getMember(
          context.user.id,
          input.params.workspaceId
        );
        if (member) {
          if (notifyIncomingEvents.slack) {
            await notificationChannelService.enableChannel(
              member.workspaceMemberId,
              input.params.workspaceId,
              context.user.email,
              'slack'
            );
          } else {
            await notificationChannelService.disableChannel(member.workspaceMemberId, 'slack');
          }
        }
      }

      // Build remaining channel updates (excluding slack which was handled above)
      const remainingChannels = notifyIncomingEvents
        ? Object.fromEntries(
            Object.entries(notifyIncomingEvents).filter(([key]) => key !== 'slack')
          )
        : undefined;

      // Update boolean prefs + non-slack channel prefs in one write
      const hasUpdates =
        Object.keys(booleanPrefs).length > 0 ||
        (remainingChannels && Object.keys(remainingChannels).length > 0);

      if (hasUpdates) {
        await workspaceMemberService.updateNotificationPreferences(
          context.user.id,
          input.params.workspaceId,
          {
            ...booleanPrefs,
            ...(remainingChannels && Object.keys(remainingChannels).length > 0
              ? { notifyIncomingEvents: remainingChannels }
              : {}),
          }
        );
      }

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

  return authorizedRateLimited.workspace.linkSettings.update
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

  return authorizedRateLimited.workspace.invite.getUrl
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

  return authorizedRateLimited.workspace.invite.rotate
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
 * Requires workspace member.
 * Email validity is enforced by SendWorkspaceInvitesSchema (EmailSchema); invalid emails are rejected at validation.
 */
export const sendWorkspaceInvitesImpl = (
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  billingService: BillingService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.invite.send
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const featureGates = await billingService.getFeatureGates(input.params.workspaceId);
      if (!featureGates.sendOutboundEmails) {
        throw billingError.PLAN_FEATURE_UNAVAILABLE({ feature: 'sendOutboundEmails' });
      }

      const result = await inviteService.sendInvites({
        workspaceId: input.params.workspaceId,
        emails: input.body.emails,
        invitedByUserId: context.user.id,
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
 * Idempotent operation - returns success if user is already a member
 */
export const acceptInviteImpl = (
  inviteService: InviteService,
  emailService: EmailService,
  workspaceMemberService: WorkspaceMemberService,
  userService: UserService
) => {
  return authorizedRateLimited.workspace.invite.accept.handler(async ({ input, context }) => {
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

    if (result.alreadyMember) {
      return {
        message: 'You are already a member of this workspace',
        data: {
          alreadyMember: true as const,
          workspaceId: result.workspace.workspaceId,
          workspaceName: result.workspace.workspaceName,
        },
      };
    }

    // Send welcome email to the new member
    const newMember = await userService.getById(context.user.id);
    await emailService.sendSafeWelcomeEmailMember(
      { to: newMember.email },
      {
        workspaceName: result.workspace.workspaceName,
        workspaceId: result.workspace.workspaceId,
      }
    );

    return {
      message: 'Invitation accepted successfully',
      data: {
        alreadyMember: false as const,
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

  return authorizedRateLimited.workspace.domains.list
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

  return authorizedRateLimited.workspace.domains.getById
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

  return authorizedRateLimited.workspace.domains.add
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

  return authorizedRateLimited.workspace.domains.update
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

  return authorizedRateLimited.workspace.domains.delete
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

  return authorizedRateLimited.workspace.domains.getVerificationUrl
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

  return authorizedRateLimited.workspace.domains.preferences.get
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

  return authorizedRateLimited.workspace.domains.preferences.update
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

  return authorizedRateLimited.workspace.domains.preferences.replace
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
 * POST /workspace/:workspaceId/domains/:domainId/instructions - Send domain developer instructions
 * Requires workspace member.
 * Email validity is enforced by SendDomainInstructionsSchema (EmailSchema); invalid emails are rejected at validation.
 */
export const sendDomainInstructionsImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.domains.sendInstructions
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      // Validate domain and get domain info
      const domain = await domainService.validateDomainForInstructions({
        domainId: input.params.domainId,
        workspaceId: input.params.workspaceId,
      });

      // Create verification token
      const userplaneToken = domainService.generateVerificationToken(
        input.params.workspaceId,
        input.params.domainId,
        domain.domainUrl
      );

      // Send emails to all provided addresses using batch sending via Resend's batch API
      await emailService.sendSafeDomainDeveloperInstructions(
        { to: input.body.emails },
        {
          userName: context.user.name,
          domainUrl: domain.domainUrl,
          workspaceId: input.params.workspaceId,
          verificationToken: userplaneToken,
        }
      );

      // With batch sending, all emails are sent together
      // sendSafe handles errors internally, so we assume all succeeded
      const sent: Array<{ email: string; success: true }> = input.body.emails.map((email) => ({
        email,
        success: true,
      }));
      const failed: Array<{ email: string; success: false; error: string }> = [];

      return {
        message: 'Developer instructions processed successfully',
        data: {
          sent,
          failed,
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

  return authorizedRateLimited.workspace.search
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

  return authorizedRateLimited.workspace.invitePolicy.get
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

  return authorizedRateLimited.workspace.invitePolicy.update
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
  return authorizedRateLimited.workspace.suggest.handler(async ({ input, context }) => {
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
 * Idempotent operation - returns success if user is already a member
 * Sends confirmation email to requester when access is requested
 */
export const joinWorkspaceImpl = (inviteService: InviteService, emailService: EmailService) => {
  return authorizedRateLimited.workspace.join.handler(async ({ input, context }) => {
    const result = await inviteService.joinWorkspace({
      workspaceId: input.params.workspaceId,
      userId: context.user.id,
      userEmail: context.user.email,
      userName: context.user.name,
    });

    if (result.alreadyMember) {
      return {
        message: 'You are already a member of this workspace',
        data: {
          alreadyMember: true as const,
          workspaceId: result.workspaceId,
          workspaceName: result.workspaceName,
          status: 'joined' as const,
        },
      };
    }

    // Send welcome email to new member if they joined successfully
    if (result.status === 'joined') {
      await emailService.sendSafeWelcomeEmailMember(
        { to: context.user.email },
        {
          workspaceName: result.workspaceName,
          workspaceId: result.workspaceId,
        }
      );
    }

    return {
      message:
        result.status === 'joined'
          ? 'Successfully joined workspace'
          : 'Access request sent to workspace owner',
      data: {
        alreadyMember: false as const,
        workspaceId: result.workspaceId,
        workspaceName: result.workspaceName,
        status: result.status,
      },
    };
  });
};

/**
 * GET /workspace/accessRequest/validate - Validate access request token
 * Requires authentication (owner only, validated in service)
 */
export const validateAccessRequestImpl = (inviteService: InviteService) => {
  return authorizedRateLimited.workspace.accessRequest.validate.handler(
    async ({ input, context }) => {
      const result = await inviteService.validateAccessRequest({
        token: input.query.token,
        viewerId: context.user.id,
      });

      return {
        message: 'Access request validated successfully',
        data: result,
      };
    }
  );
};

/**
 * POST /workspace/accessRequest/approve - Approve access request
 * Requires authentication (owner only, validated in service)
 * Welcome email is sent to requester by the invite service
 */
export const approveAccessRequestImpl = (inviteService: InviteService) => {
  return authorizedRateLimited.workspace.accessRequest.approve.handler(
    async ({ input, context }) => {
      const result = await inviteService.approveAccessRequest({
        token: input.body.token,
        approverId: context.user.id,
      });

      return {
        message: 'Access request approved successfully',
        data: result,
      };
    }
  );
};

/**
 * POST /workspace/accessRequest/decline - Decline access request
 * Requires authentication (owner only, validated in service)
 */
export const declineAccessRequestImpl = (inviteService: InviteService) => {
  return authorizedRateLimited.workspace.accessRequest.decline.handler(
    async ({ input, context }) => {
      const result = await inviteService.declineAccessRequest({
        token: input.body.token,
        declinerId: context.user.id,
      });

      return {
        message: 'Access request declined',
        data: result,
      };
    }
  );
};

/**
 * GET /workspace/:workspaceId/status - Get workspace status and access info
 * Requires authentication but NOT workspace membership
 * Returns access status for the current user to determine what UI to show
 */
export const getWorkspaceStatusImpl = (workspaceService: WorkspaceService) => {
  return authorizedRateLimited.workspace.status.handler(async ({ input, context }) => {
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

// ============================================================================
// INTEGRATION HANDLERS
// ============================================================================

/**
 * GET /workspace/:workspaceId/integrations/intercom - Get Intercom integration status
 * Requires workspace membership
 */
export const getIntercomIntegrationImpl = (
  intercomService: IntercomService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.integrations.intercom.get
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const status = await intercomService.getIntegrationStatus(input.params.workspaceId);

      return {
        message: 'Integration status retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          integration: {
            connected: status.connected,
            providerWorkspaceId: status.providerWorkspaceId,
            connectedAt: status.connectedAt,
          },
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/intercom/authorize - Initiate Intercom OAuth
 * Requires admin or owner role
 */
export const intercomIntegrationAuthorizeImpl = (
  intercomService: IntercomService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.intercom.authorize
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      // Check if already connected
      const existingStatus = await intercomService.getIntegrationStatus(input.params.workspaceId);
      if (existingStatus.connected) {
        throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
      }

      const { authorizationUrl, state } = intercomService.generateAuthorizationUrl(
        context.user.id,
        input.params.workspaceId,
        'integration'
      );

      return {
        message: 'Authorization URL generated successfully',
        data: {
          authorizationUrl,
          state,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/intercom/callback - Handle Intercom OAuth callback
 * Requires admin or owner role
 */
export const intercomIntegrationCallbackImpl = (
  intercomService: IntercomService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.intercom.callback
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const result = await intercomService.handleIntegrationCallback({
        code: input.query.code,
        state: input.query.state,
        userId: context.user.id,
        workspaceId: input.params.workspaceId,
      });

      return {
        message: 'Intercom connected successfully',
        data: {
          workspaceId: input.params.workspaceId,
          connected: result.connected,
          providerWorkspaceId: result.providerWorkspaceId,
        },
      };
    });
};

/**
 * DELETE /workspace/:workspaceId/integrations/intercom - Disconnect Intercom integration
 * Requires admin or owner role
 */
export const deleteIntercomIntegrationImpl = (
  intercomService: IntercomService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.intercom.delete
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await intercomService.disconnectIntegration(input.params.workspaceId);

      return {
        message: 'Intercom disconnected successfully',
        data: {
          workspaceId: input.params.workspaceId,
          disconnected: true as const,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/intercom/admins - Get Intercom admins
 * Requires admin or owner role
 * Returns admins and invite policy (with allowed domains) for UI display
 */
export const getIntercomAdminsImpl = (
  intercomService: IntercomService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.intercom.admins
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      // Fetch admins and invite policy in parallel
      const [admins, invitePolicyData] = await Promise.all([
        intercomService.getAdmins(input.params.workspaceId, input.query.exclude_members),
        workspaceService.getInvitePolicy(input.params.workspaceId),
      ]);

      return {
        message: 'Intercom admins retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          admins,
          invitePolicy: invitePolicyData.workspaceInvitePolicy,
          allowedDomains: invitePolicyData.workspaceInviteDomains,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/intercom/suggestions - Get Intercom admin suggestions
 * Requires workspace membership
 * Returns suggested admins for invite modal, gracefully degrades if not connected
 */
export const getIntercomSuggestionsImpl = (
  intercomService: IntercomService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.integrations.intercom.suggestions
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const status = await intercomService.getIntegrationStatus(input.params.workspaceId);

      if (!status.connected) {
        return {
          message: 'No Intercom integration',
          data: {
            workspaceId: input.params.workspaceId,
            connected: false,
            suggestions: [],
            hasMore: false,
          },
        };
      }

      const { suggestions, hasMore } = await intercomService.suggestAdmins(
        input.params.workspaceId,
        {
          limit: input.query.limit,
        }
      );

      return {
        message: 'Suggestions retrieved',
        data: {
          workspaceId: input.params.workspaceId,
          connected: true,
          suggestions,
          hasMore,
        },
      };
    });
};

// ============================================================================
// ZENDESK INTEGRATION HANDLERS
// ============================================================================

/**
 * GET /workspace/:workspaceId/integrations/zendesk - Get Zendesk integration status
 * Requires workspace membership
 */
export const getZendeskIntegrationImpl = (
  zendeskService: ZendeskService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.integrations.zendesk.get
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const status = await zendeskService.getIntegrationStatus(input.params.workspaceId);

      return {
        message: 'Integration status retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          integration: {
            connected: status.connected,
            providerWorkspaceId: status.providerWorkspaceId,
            connectedAt: status.connectedAt,
          },
        },
      };
    });
};

/**
 * DELETE /workspace/:workspaceId/integrations/zendesk - Disconnect Zendesk integration
 * Requires admin or owner role
 */
export const deleteZendeskIntegrationImpl = (
  zendeskService: ZendeskService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.zendesk.delete
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await zendeskService.disconnectIntegration(input.params.workspaceId);

      return {
        message: 'Zendesk disconnected successfully',
        data: {
          workspaceId: input.params.workspaceId,
          disconnected: true as const,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/zendesk/agents - Get Zendesk agents
 * Requires admin or owner role
 * Returns agents and invite policy for the invite page
 */
export const getZendeskAgentsImpl = (
  zendeskService: ZendeskService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.zendesk.agents
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const [agents, invitePolicyData] = await Promise.all([
        zendeskService.getAgents(input.params.workspaceId, input.query.exclude_members),
        workspaceService.getInvitePolicy(input.params.workspaceId),
      ]);

      return {
        message: 'Zendesk agents retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          agents,
          invitePolicy: invitePolicyData.workspaceInvitePolicy,
          allowedDomains: invitePolicyData.workspaceInviteDomains,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/zendesk/suggestions - Get Zendesk agent suggestions
 * Requires workspace membership
 * Returns suggested agents for invite modal, gracefully degrades if not connected
 */
export const getZendeskSuggestionsImpl = (
  zendeskService: ZendeskService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.integrations.zendesk.suggestions
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const status = await zendeskService.getIntegrationStatus(input.params.workspaceId);

      if (!status.connected) {
        return {
          message: 'No Zendesk integration',
          data: {
            workspaceId: input.params.workspaceId,
            connected: false,
            suggestions: [],
            hasMore: false,
          },
        };
      }

      const { suggestions, hasMore } = await zendeskService.suggestAgents(
        input.params.workspaceId,
        { limit: input.query.limit }
      );

      return {
        message: 'Suggestions retrieved',
        data: {
          workspaceId: input.params.workspaceId,
          connected: true,
          suggestions,
          hasMore,
        },
      };
    });
};

// ============================================================================
// SLACK INTEGRATION HANDLERS
// ============================================================================

/**
 * GET /workspace/:workspaceId/integrations/slack - Get Slack integration status
 * Requires workspace membership
 */
export const getSlackIntegrationImpl = (
  slackService: SlackService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.integrations.slack.get
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const status = await slackService.getIntegrationStatus(input.params.workspaceId);

      return {
        message: 'Integration status retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          integration: {
            connected: status.connected,
            providerWorkspaceId: status.providerWorkspaceId,
            connectedAt: status.connectedAt,
          },
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/slack/authorize - Initiate Slack OAuth
 * Requires admin or owner role
 */
export const slackIntegrationAuthorizeImpl = (
  slackService: SlackService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.slack.authorize
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      // Check if already connected
      const existingStatus = await slackService.getIntegrationStatus(input.params.workspaceId);
      if (existingStatus.connected) {
        throw workspaceError.INTEGRATION_ALREADY_CONNECTED();
      }

      const { authorizationUrl, state } = slackService.generateAuthorizationUrl(
        context.user.id,
        input.params.workspaceId
      );

      return {
        message: 'Authorization URL generated successfully',
        data: {
          authorizationUrl,
          state,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/slack/callback - Handle Slack OAuth callback
 * Requires admin or owner role
 */
export const slackIntegrationCallbackImpl = (
  slackService: SlackService,
  slackCanvasService: SlackCanvasService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.slack.callback
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const result = await slackService.handleIntegrationCallback({
        code: input.query.code,
        state: input.query.state,
        userId: context.user.id,
        workspaceId: input.params.workspaceId,
      });

      // Best-effort: publish connected home tab to the user who just connected
      // so they see a fresh dashboard immediately without reopening the app.
      void slackCanvasService
        .publishConnectedViewForUser(
          result.accessToken,
          input.params.workspaceId,
          result.authedSlackUserId
        )
        .catch(() => {});

      return {
        message: 'Slack connected successfully',
        data: {
          workspaceId: input.params.workspaceId,
          connected: result.connected,
          providerWorkspaceId: result.providerWorkspaceId,
        },
      };
    });
};

/**
 * DELETE /workspace/:workspaceId/integrations/slack - Disconnect Slack integration
 * Requires admin or owner role
 */
export const deleteSlackIntegrationImpl = (
  slackService: SlackService,
  slackCanvasService: SlackCanvasService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.slack.delete
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const integration = await slackService.disconnectIntegration(input.params.workspaceId);

      // Best-effort: broadcast disconnected view to all workspace members in the background.
      // The bot token is still valid on Slack's side after our soft-delete.
      const accessToken = IntegrationHelper.getAccessToken(integration);
      void slackCanvasService.broadcastDisconnectedView(accessToken).catch(() => {});

      return {
        message: 'Slack disconnected successfully',
        data: {
          workspaceId: input.params.workspaceId,
          disconnected: true as const,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/slack/members - Get Slack workspace members
 * Requires admin or owner role
 * Returns members and invite policy (with allowed domains) for UI display
 */
export const getSlackMembersImpl = (
  slackService: SlackService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireAdminOrOwner = createWorkspaceRoleMiddleware(
    workspaceMemberService,
    workspaceService,
    ['admin', 'owner']
  );

  return authorizedRateLimited.workspace.integrations.slack.members
    .use(requireAdminOrOwner, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const [members, invitePolicyData] = await Promise.all([
        slackService.getMembers(input.params.workspaceId, input.query.exclude_members),
        workspaceService.getInvitePolicy(input.params.workspaceId),
      ]);

      return {
        message: 'Slack members retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          members,
          invitePolicy: invitePolicyData.workspaceInvitePolicy,
          allowedDomains: invitePolicyData.workspaceInviteDomains,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/integrations/slack/suggestions - Get Slack member suggestions
 * Requires workspace membership
 * Returns suggested members for invite modal, gracefully degrades if not connected
 */
export const getSlackSuggestionsImpl = (
  slackService: SlackService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.workspace.integrations.slack.suggestions
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const status = await slackService.getIntegrationStatus(input.params.workspaceId);

      if (!status.connected) {
        return {
          message: 'No Slack integration',
          data: {
            workspaceId: input.params.workspaceId,
            connected: false,
            suggestions: [],
            hasMore: false,
          },
        };
      }

      const { suggestions, hasMore } = await slackService.suggestMembers(input.params.workspaceId, {
        limit: input.query.limit,
      });

      return {
        message: 'Suggestions retrieved',
        data: {
          workspaceId: input.params.workspaceId,
          connected: true,
          suggestions,
          hasMore,
        },
      };
    });
};

/**
 * Create the workspace procedures object
 * Complete implementation with CRUD, member management, invites, domains, and integrations
 */
export const createWorkspaceProcedures = (
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  projectService: ProjectService,
  domainService: DomainService,
  recordingService: RecordingService,
  linkService: LinkService,
  emailService: EmailService,
  userService: UserService,
  tokenService: TokenService,
  intercomService: IntercomService,
  zendeskService: ZendeskService,
  slackService: SlackService,
  slackCanvasService: SlackCanvasService,
  billingService: BillingService,
  notificationChannelService: NotificationChannelService
) => {
  return {
    list: getAllWorkspacesImpl(workspaceService),
    count: countWorkspacesImpl(workspaceService),
    getById: getWorkspaceByIdImpl(workspaceService),
    getResourcesCount: getWorkspaceResourcesCountImpl(
      workspaceService,
      workspaceMemberService,
      projectService,
      recordingService,
      linkService,
      domainService
    ),
    status: getWorkspaceStatusImpl(workspaceService),
    updateName: updateWorkspaceNameImpl(workspaceService, workspaceMemberService),
    delete: deleteWorkspaceImpl(workspaceService, workspaceMemberService, emailService),
    getRestoreInfo: getWorkspaceRestoreInfoImpl(workspaceService, workspaceMemberService),
    restore: restoreWorkspaceImpl(workspaceService, workspaceMemberService, emailService),
    search: workspaceSearchImpl(workspaceService, workspaceMemberService),
    suggest: suggestWorkspacesImpl(workspaceService),
    join: joinWorkspaceImpl(inviteService, emailService),
    preferences: {
      get: getWorkspacePreferencesImpl(workspaceService),
      update: updateWorkspacePreferencesImpl(workspaceService, workspaceMemberService),
    },

    members: {
      list: getWorkspaceMembersImpl(workspaceMemberService),
      getMembership: getWorkspaceMembershipImpl(workspaceMemberService),
      updateRole: updateMemberRoleImpl(workspaceMemberService, workspaceService),
      remove: removeMemberImpl(workspaceMemberService, workspaceService),
      leave: leaveWorkspaceImpl(workspaceMemberService, workspaceService, emailService),
    },

    notifications: {
      get: getNotificationPreferencesImpl(
        workspaceMemberService,
        workspaceService,
        notificationChannelService
      ),
      update: updateNotificationPreferencesImpl(
        workspaceMemberService,
        workspaceService,
        notificationChannelService
      ),
    },

    linkSettings: {
      update: updateLinkSettingsImpl(workspaceService, workspaceMemberService),
    },

    invite: {
      getUrl: getInviteUrlImpl(inviteService, workspaceMemberService, workspaceService),
      rotate: rotateInviteTokenImpl(inviteService, workspaceMemberService, workspaceService),
      send: sendWorkspaceInvitesImpl(
        inviteService,
        workspaceMemberService,
        workspaceService,
        billingService
      ),
      accept: acceptInviteImpl(inviteService, emailService, workspaceMemberService, userService),
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
      sendInstructions: sendDomainInstructionsImpl(
        domainService,
        workspaceMemberService,
        workspaceService,
        emailService
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

    integrations: {
      intercom: {
        get: getIntercomIntegrationImpl(intercomService, workspaceMemberService, workspaceService),
        authorize: intercomIntegrationAuthorizeImpl(
          intercomService,
          workspaceMemberService,
          workspaceService
        ),
        callback: intercomIntegrationCallbackImpl(
          intercomService,
          workspaceMemberService,
          workspaceService
        ),
        delete: deleteIntercomIntegrationImpl(
          intercomService,
          workspaceMemberService,
          workspaceService
        ),
        admins: getIntercomAdminsImpl(intercomService, workspaceMemberService, workspaceService),
        suggestions: getIntercomSuggestionsImpl(
          intercomService,
          workspaceMemberService,
          workspaceService
        ),
      },
      zendesk: {
        get: getZendeskIntegrationImpl(zendeskService, workspaceMemberService, workspaceService),
        delete: deleteZendeskIntegrationImpl(
          zendeskService,
          workspaceMemberService,
          workspaceService
        ),
        agents: getZendeskAgentsImpl(zendeskService, workspaceMemberService, workspaceService),
        suggestions: getZendeskSuggestionsImpl(
          zendeskService,
          workspaceMemberService,
          workspaceService
        ),
      },
      slack: {
        get: getSlackIntegrationImpl(slackService, workspaceMemberService, workspaceService),
        authorize: slackIntegrationAuthorizeImpl(
          slackService,
          workspaceMemberService,
          workspaceService
        ),
        callback: slackIntegrationCallbackImpl(
          slackService,
          slackCanvasService,
          workspaceMemberService,
          workspaceService
        ),
        delete: deleteSlackIntegrationImpl(
          slackService,
          slackCanvasService,
          workspaceMemberService,
          workspaceService
        ),
        members: getSlackMembersImpl(slackService, workspaceMemberService, workspaceService),
        suggestions: getSlackSuggestionsImpl(
          slackService,
          workspaceMemberService,
          workspaceService
        ),
      },
    },
  };
};
