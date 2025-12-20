/**
 * Workspace contract implementation using oRPC
 * Implements the workspace contract defined in @workspace/contract
 *
 * INCREMENTAL MIGRATION: Starting with basic CRUD operations
 */

import { ORPCError } from '@orpc/server';
import { authorized } from '@/api/middleware/auth.orpc';
import {
  createWorkspaceMiddleware,
  createWorkspaceRoleMiddleware,
} from '@/api/middleware/workspace.orpc';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { InviteService } from '@/api/services/invite.service';
import type { ProjectService } from '@/api/services/project.service';
import type { DomainService } from '@/api/services/domain.service';
import { z } from 'zod';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { createPaginationMeta } from '@/api/types';
import { getPlanName } from '@workspace/pricing';

/**
 * GET /workspace - List all user workspaces
 * Requires authentication
 */
export const getAllWorkspacesImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.list.handler(async ({ input, context }) => {
    try {
      const page = input.query.page || 1;
      const perPage = 5;

      const { workspaces, total } = await workspaceService.getByUserIdPaginated(
        context.user.id,
        page,
        perPage,
        {
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
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
  });
};

/**
 * GET /workspace/count - Count user workspaces by role
 * Requires authentication
 */
export const countWorkspacesImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.count.handler(async ({ input, context }) => {
    try {
      const count = await workspaceService.countByUserWithRoles(context.user.id, input.query.roles);

      return {
        message: 'Workspace count retrieved successfully',
        data: { count },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
  });
};

/**
 * GET /workspace/:workspaceId - Get workspace by ID
 * Requires authentication
 */
export const getWorkspaceByIdImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.getById.handler(async ({ context, input }) => {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof GoneError) {
        throw new ORPCError('GONE', {
          status: 410,
          message: error.message,
        });
      }
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
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
      try {
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        await workspaceService.deleteWorkspace(input.params.workspaceId);

        return {
          message: 'Workspace deleted successfully',
          data: {
            workspaceId: input.params.workspaceId,
            success: true,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * GET /workspace/:id/preferences - Get workspace preferences
 * Requires authentication
 */
export const getWorkspacePreferencesImpl = (workspaceService: WorkspaceService) => {
  return authorized.workspace.preferences.get.handler(async ({ input }) => {
    try {
      const preferences = await workspaceService.getPreferencesById(input.params.workspaceId);

      return {
        message: 'Workspace preferences retrieved successfully',
        data: { preferences },
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
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
      try {
        const preferences = await workspaceService.updatePreferences(
          input.params.workspaceId,
          input.body
        );

        return {
          message: 'Workspace preferences updated successfully',
          data: { preferences },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * GET /workspace/:id/members - Get workspace members
 * Requires authentication
 */
export const getWorkspaceMembersImpl = (workspaceMemberService: WorkspaceMemberService) => {
  return authorized.workspace.members.list.handler(async ({ input, context }) => {
    try {
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

      let teamData: any = {
        workspaceId: input.params.workspaceId,
        workspaceMembers: teamMembers,
        pagination: createPaginationMeta(page, perPage, total),
      };

      if (input.query.include_me) {
        const myMembership = await workspaceMemberService.getMember(
          context.user.id,
          input.params.workspaceId
        );
        if (myMembership) {
          teamData.workspaceMembership = {
            workspaceMemberId: myMembership.workspaceMemberId,
            workspaceRole: myMembership.workspaceRole,
          };
        }
      }

      return {
        message: 'Workspace members retrieved successfully',
        data: teamData,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
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
      try {
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
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        const inviteUrl = await inviteService.getInviteUrl(
          input.params.workspaceId,
          context.user.id
        );

        return {
          message: 'Invite URL retrieved successfully',
          data: {
            inviteUrl,
            workspaceId: input.params.workspaceId,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
    try {
      // Verify the token is for the correct workspace
      const validation = await inviteService.validateInvite(input.body.token);

      if (validation.status !== 'valid') {
        throw new ValidationError(validation.message || 'Invalid invitation token');
      }

      // Ensure the token's workspace matches the requested workspace
      if (validation.workspaceId !== input.params.workspaceId) {
        throw new ValidationError('Invitation token does not match the requested workspace');
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid request body',
        });
      }
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
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
      try {
        const page = input.query.page || 1;
        const perPage = input.query.per_page || 5;
        const { domains, total } = await domainService.getByWorkspaceIdPaginated(
          input.params.workspaceId,
          page,
          perPage
        );

        return {
          message: 'Workspace domains retrieved successfully',
          data: {
            workspaceId: input.params.workspaceId,
            domains,
            pagination: createPaginationMeta(page, perPage, total),
          },
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        const domain = await domainService.create({
          workspaceId: input.params.workspaceId,
          url: input.body.url,
          status: 'pending',
        });

        if (!domain) {
          throw new Error('Failed to create domain');
        }

        return {
          message: 'Domain added successfully',
          data: {
            workspaceId: input.params.workspaceId,
            domain,
          },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * DELETE /workspace/:id/domains/:domainId - Delete domain
 * Requires workspace member
 */
export const deleteDomainImpl = (
  domainService: DomainService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.workspace.domains.delete
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      try {
        await domainService.deleteDomain(input.params.domainId, input.params.workspaceId);

        return {
          message: 'Domain deleted successfully',
          data: {
            workspaceId: input.params.workspaceId,
            domainId: input.params.domainId,
          },
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
            recordingCaptureServerLog: domain.recordingCaptureServerLog,
            recordingCaptureNetworkLog: domain.recordingCaptureNetworkLog,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        await domainService.updateRecordingPreferences(
          input.params.domainId,
          input.params.workspaceId,
          {
            recordingHideSensitive: input.body.recordingHideSensitive,
            recordingCaptureClientLog: input.body.recordingCaptureClientLog,
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
        await domainService.replaceRecordingPreferences(
          input.params.domainId,
          input.params.workspaceId,
          {
            recordingHideSensitive: input.body.recordingHideSensitive,
            recordingCaptureClientLog: input.body.recordingCaptureClientLog,
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
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
      try {
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
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
    updateName: updateWorkspaceNameImpl(workspaceService, workspaceMemberService),
    delete: deleteWorkspaceImpl(workspaceService, workspaceMemberService),
    search: workspaceSearchImpl(workspaceService, workspaceMemberService),

    preferences: {
      get: getWorkspacePreferencesImpl(workspaceService),
      update: updateWorkspacePreferencesImpl(workspaceService, workspaceMemberService),
    },

    members: {
      list: getWorkspaceMembersImpl(workspaceMemberService),
      updateRole: updateMemberRoleImpl(workspaceMemberService, workspaceService),
      remove: removeMemberImpl(workspaceMemberService, workspaceService),
    },

    invite: {
      getUrl: getInviteUrlImpl(inviteService, workspaceMemberService, workspaceService),
      rotate: rotateInviteTokenImpl(inviteService, workspaceMemberService, workspaceService),
      send: sendWorkspaceInvitesImpl(inviteService, workspaceMemberService, workspaceService),
      accept: acceptInviteImpl(inviteService, workspaceService),
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

    // TODO: Add remaining endpoints incrementally
    notifications: {} as any,
    linkSettings: {} as any,
  };
};
