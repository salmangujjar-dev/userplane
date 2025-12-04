/**
 * Workspace handlers - HTTP request handlers for workspace operations
 * Handles workspace-specific actions like managing invites, teams, projects, and domains
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { WorkspaceService } from '@/api/services/workspace.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { InviteService } from '@/api/services/invite.service';
import { DomainService } from '@/api/services/domain.service';
import type {
  GetInviteUrlResult,
  GetWorkspaceTeamResult,
  GetWorkspaceDomainsResult,
  AddDomainResult,
  UpdateWorkspacePreferencesResult,
  TeamMember,
  DomainItem,
} from '@/api/types';
import { createPaginationMeta } from '@/api/types';
import { z } from 'zod';
import { ValidationError } from '@/api/lib/errors';
import type { WorkspaceRole } from '@workspace/db';

const workspaceIdParamSchema = z.object({
  id: z.string().min(1),
});

const paginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
});

const addDomainSchema = z.object({
  url: z.string().url('Invalid URL format').min(1, 'URL is required'),
});

const updateWorkspacePreferencesSchema = z.object({
  recordingCustomizeLink: z.boolean().optional(),
  recordingHideSensitive: z.boolean().optional(),
  recordingCaptureClientLog: z.boolean().optional(),
  recordingCaptureServerLog: z.boolean().optional(),
  recordingCompanyName: z.string().nullable().optional(),
  recordingCompanyLogoPath: z.string().nullable().optional(),
  recordingHeader: z.string().nullable().optional(),
  recordingFootnote: z.string().nullable().optional(),
  recordingPrimaryColor: z.string().nullable().optional(),
  recordingMaxDuration: z.number().int().positive().nullable().optional(),
});

export function inviteActionHandler(
  workspaceService: WorkspaceService,
  inviteService: InviteService
) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to access invite URL',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to access invite URL',
          },
          403
        );
      }

      const action = c.req.query('action') || 'get';

      let inviteUrl: string;

      if (action === 'rotate') {
        inviteUrl = await inviteService.regenerateInviteUrl(workspaceId, user.id);
      } else if (action === 'get') {
        inviteUrl = await inviteService.getInviteUrl(workspaceId, user.id);
      } else {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid action parameter. Must be "get" or "rotate"',
          },
          400
        );
      }

      const result: GetInviteUrlResult = {
        inviteUrl,
        workspaceId,
      };

      return c.json(result, 200);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function getAllWorkspacesHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to get workspaces',
          },
          401
        );
      }

      // Check for include_notification_preference query parameter
      const includeNotifications = c.req.query('include_notification_preference') === 'true';

      const workspaces = await workspaceService.getByUserId(user.id, includeNotifications);

      return c.json(
        {
          workspaces,
          total: workspaces.length,
        },
        200
      );
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function getWorkspaceByIdHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to get workspace',
          },
          401
        );
      }

      const params = c.req.param();
      const { id } = workspaceIdParamSchema.parse(params);

      const workspace = await workspaceService.getById(id);

      return c.json({ workspace }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid workspace ID',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function getWorkspacePreferencesHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to get workspace preferences',
          },
          401
        );
      }

      const params = c.req.param();
      const { id } = workspaceIdParamSchema.parse(params);

      const preferences = await workspaceService.getPreferencesById(id);

      return c.json({ preferences }, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid workspace ID',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function getWorkspaceTeamHandler(
  workspaceService: WorkspaceService,
  workspaceMemberService: WorkspaceMemberService
) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to get workspace team',
          },
          401
        );
      }

      const params = c.req.param();
      const { id } = workspaceIdParamSchema.parse(params);

      const queryParams = c.req.query();
      const { page } = paginationQuerySchema.parse(queryParams);

      const perPage = 5;

      // Get team members sorted by role with pagination
      const { members, total } = await workspaceMemberService.getTeamMembers(id, page, perPage);

      // Map to team member response format
      const teamMembers: TeamMember[] = members.map((member) => ({
        id: member.id,
        name: member.userName,
        email: member.userEmail,
        role: member.role,
      }));

      const result: GetWorkspaceTeamResult = {
        workspaceId: id,
        members: teamMembers,
        pagination: createPaginationMeta(page, perPage, total),
      };

      return c.json(result, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request parameters',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function getWorkspaceDomainsHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to get workspace domains',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to get workspace domains',
          },
          403
        );
      }

      const domains = await domainService.getByWorkspaceId(workspaceId);

      const domainItems: DomainItem[] = domains.map((domain) => ({
        url: domain.domainUrl,
        status: domain.domainStatus,
      }));

      const result: GetWorkspaceDomainsResult = {
        workspaceId,
        domains: domainItems,
      };

      return c.json(result, 200);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function addDomainHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to add a domain',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to add a domain',
          },
          403
        );
      }

      const body = await c.req.json();
      const { url } = addDomainSchema.parse(body);

      const domain = await domainService.create({
        workspaceId,
        url,
        status: 'pending',
      });

      if (!domain) {
        return c.json(
          {
            error: 'Internal Server Error',
            message: 'Failed to create domain',
          },
          500
        );
      }

      const result: AddDomainResult = {
        workspaceId,
        domain: {
          url: domain.domainUrl,
          status: domain.domainStatus,
        },
        message: 'Domain added successfully',
      };

      return c.json(result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof ValidationError) {
        return c.json(
          {
            error: 'Validation Error',
            message: error.message,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function updateWorkspacePreferencesHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to update workspace preferences',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to update workspace preferences',
          },
          403
        );
      }

      const body = await c.req.json();
      const updates = updateWorkspacePreferencesSchema.parse(body);

      await workspaceService.updatePreferences(workspaceId, updates);

      const result: UpdateWorkspacePreferencesResult = {
        workspaceId,
        message: 'Workspace preferences updated successfully',
      };

      return c.json(result, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});

export function updateMemberRoleHandler(workspaceMemberService: WorkspaceMemberService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const memberId = c.req.param('workspaceMemberId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to update member role',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to update member role',
          },
          403
        );
      }

      if (!memberId) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Member ID is required',
          },
          400
        );
      }

      const body = await c.req.json();
      const { role } = updateMemberRoleSchema.parse(body);

      await workspaceMemberService.updateMemberRole(memberId, role);

      return c.json(
        {
          workspaceId,
          memberId,
          message: 'Member role updated successfully',
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof ValidationError) {
        return c.json(
          {
            error: 'Validation Error',
            message: error.message,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function removeMemberHandler(workspaceMemberService: WorkspaceMemberService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const memberId = c.req.param('workspaceMemberId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to remove a member',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to remove a member',
          },
          403
        );
      }

      if (!memberId) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Member ID is required',
          },
          400
        );
      }

      await workspaceMemberService.removeMember(memberId, workspaceId);

      return c.json(
        {
          workspaceId,
          memberId,
          message: 'Member removed successfully',
        },
        200
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json(
          {
            error: 'Validation Error',
            message: error.message,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function leaveWorkspaceHandler(workspaceMemberService: WorkspaceMemberService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to leave a workspace',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to leave a workspace',
          },
          403
        );
      }

      await workspaceMemberService.leaveWorkspace(user.id, workspaceId);

      return c.json(
        {
          workspaceId,
          message: 'Successfully left workspace',
        },
        200
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        return c.json(
          {
            error: 'Validation Error',
            message: error.message,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

const updateNotificationPreferencesSchema = z.object({
  notifyOnLinkUsage: z.boolean().optional(),
  notifyOnQuotaReset: z.boolean().optional(),
  notifyOnQuotaLimit: z.boolean().optional(),
  notifyOnInviteAccepted: z.boolean().optional(),
  notifyOnMemberJoin: z.boolean().optional(),
});

export function updateNotificationPreferencesHandler(
  workspaceMemberService: WorkspaceMemberService
) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to update notification preferences',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to update notification preferences',
          },
          403
        );
      }

      const body = await c.req.json();
      const preferences = updateNotificationPreferencesSchema.parse(body);

      await workspaceMemberService.updateNotificationPreferences(user.id, workspaceId, preferences);

      return c.json(
        {
          workspaceId,
          message: 'Notification preferences updated successfully',
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof ValidationError) {
        return c.json(
          {
            error: 'Validation Error',
            message: error.message,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}
