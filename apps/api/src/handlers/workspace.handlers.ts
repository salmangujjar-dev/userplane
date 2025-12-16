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
import { getErrorStatusCode, ValidationError } from '@/api/lib/errors';
import type {
  ApiResponse,
  ApiErrorResponse,
  TeamMember,
  DomainItem,
  InviteUrlData,
  WorkspacesListData,
  WorkspaceTeamData,
  WorkspaceDomainsData,
  DomainAddData,
  DomainUpdateData,
  DomainDeleteData,
  DomainByIdData,
  WorkspacePreferencesUpdateData,
  WorkspacePreferencesGetData,
  WorkspaceByIdData,
  WorkspaceNameUpdateData,
  WorkspaceDeleteData,
  MemberRoleUpdateData,
  MemberRemoveData,
  LinkSettingsData,
  LeaveWorkspaceData,
  NotificationPreferencesUpdateData,
  WorkspaceCountData,
} from '@/api/types';
import { createPaginationMeta } from '@/api/types';
import { z } from 'zod';
import type { WorkspaceRole } from '@workspace/db';
import { tasks } from '@trigger.dev/sdk/v3';
import { TASK_IDS } from '@/api/trigger/constants';
import { buildWorkspaceDeletionKey } from '@/api/trigger/idempotency';
import {
  idParamSchema as workspaceIdParamSchema,
  paginationQuerySchema,
  addDomainSchema,
  updateDomainSchema,
  updateWorkspacePreferencesSchema,
  updateLinkSettingsSchema,
  updateWorkspaceNameSchema,
  updateMemberRoleSchema,
  updateNotificationPreferencesSchema,
  countWorkspacesQuerySchema,
  workspaceSearchQuerySchema,
} from '@/api/schema';
import { getAssetsStorage } from '@/api/clients/storage';
import { ASSETS_ALLOWED_CONTENT_TYPES, type AssetsContentType } from '@workspace/storage';
import { MAX_LOGO_SIZE_BYTES } from '@/api/constants/limits';

export function getInviteUrlHandler(inviteService: InviteService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to access invite URL',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to access invite URL',
        };
        return c.json(response, 403);
      }

      const inviteUrl = await inviteService.getInviteUrl(workspaceId, user.id);

      const response: ApiResponse<InviteUrlData> = {
        message: 'Invite URL retrieved successfully',
        data: {
          inviteUrl,
          workspaceId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function rotateInviteTokenHandler(inviteService: InviteService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to rotate invite token',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to rotate invite token',
        };
        return c.json(response, 403);
      }

      const inviteUrl = await inviteService.regenerateInviteUrl(workspaceId, user.id);

      const response: ApiResponse<InviteUrlData> = {
        message: 'Invite token rotated successfully',
        data: {
          inviteUrl,
          workspaceId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function inviteActionHandler(inviteService: InviteService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to access invite URL',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to access invite URL',
        };
        return c.json(response, 403);
      }

      const action = c.req.query('action') || 'get';

      let inviteUrl: string;
      let actionMessage: string;

      if (action === 'rotate') {
        inviteUrl = await inviteService.regenerateInviteUrl(workspaceId, user.id);
        actionMessage = 'Invite token rotated successfully';
      } else if (action === 'get') {
        inviteUrl = await inviteService.getInviteUrl(workspaceId, user.id);
        actionMessage = 'Invite URL retrieved successfully';
      } else {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid action parameter. Must be "get" or "rotate"',
        };
        return c.json(response, 400);
      }

      const response: ApiResponse<InviteUrlData> = {
        message: actionMessage,
        data: {
          inviteUrl,
          workspaceId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function getAllWorkspacesHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get workspaces',
        };
        return c.json(response, 401);
      }

      // Check for query parameters
      const includeNotifications = c.req.query('include_notification_preference') === 'true';
      const includeMembership = c.req.query('include_workspace_membership') === 'true';

      // Parse pagination query params
      const pageParam = c.req.query('page');
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const perPage = 5;

      const { workspaces, total } = await workspaceService.getByUserIdPaginated(
        user.id,
        page,
        perPage,
        {
          includeNotificationPreferences: includeNotifications,
          includeWorkspaceMembership: includeMembership,
        }
      );

      const response: ApiResponse<WorkspacesListData> = {
        message: 'Workspaces retrieved successfully',
        data: {
          workspaces,
          total,
          pagination: createPaginationMeta(page, perPage, total),
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function countWorkspacesHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to count workspaces',
        };
        return c.json(response, 401);
      }

      // Parse and validate query parameters
      const queryParams = c.req.query();
      const { roles } = countWorkspacesQuerySchema.parse(queryParams);

      const count = await workspaceService.countByUserWithRoles(user.id, roles);

      const response: ApiResponse<WorkspaceCountData> = {
        message: 'Workspace count retrieved successfully',
        data: {
          count,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function getWorkspaceByIdHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get workspace',
        };
        return c.json(response, 401);
      }

      const params = c.req.param();
      const { id } = workspaceIdParamSchema.parse(params);

      const workspace = await workspaceService.getById(id);

      const response: ApiResponse<WorkspaceByIdData> = {
        message: 'Workspace retrieved successfully',
        data: { workspace },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid workspace ID',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function getWorkspacePreferencesHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get workspace preferences',
        };
        return c.json(response, 401);
      }

      const params = c.req.param();
      const { id } = workspaceIdParamSchema.parse(params);

      const preferences = await workspaceService.getPreferencesById(id);

      const response: ApiResponse<WorkspacePreferencesGetData> = {
        message: 'Workspace preferences retrieved successfully',
        data: { preferences },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid workspace ID',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function getWorkspaceMembersHandler(workspaceMemberService: WorkspaceMemberService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get workspace members',
        };
        return c.json(response, 401);
      }

      const params = c.req.param();
      const { id } = workspaceIdParamSchema.parse(params);

      const queryParams = c.req.query();
      const { page } = paginationQuerySchema.parse(queryParams);

      // Check for include_me query parameter
      const includeMe = c.req.query('include_me') === 'true';

      const perPage = 5;

      // Get team members sorted by role with pagination
      const { members, total } = await workspaceMemberService.getTeamMembers(id, page, perPage);

      // Map to team member response format
      const teamMembers: TeamMember[] = members.map((member) => ({
        workspaceMemberId: member.id,
        memberName: member.userName,
        memberEmail: member.userEmail,
        workspaceRole: member.role,
      }));

      let teamData: WorkspaceTeamData = {
        workspaceId: id,
        workspaceMembers: teamMembers,
        pagination: createPaginationMeta(page, perPage, total),
      };

      // If include_me is true, add the requesting user's membership info
      if (includeMe) {
        const myMembership = await workspaceMemberService.getMember(user.id, id);
        if (myMembership) {
          teamData = {
            workspaceId: id,
            workspaceMembers: teamMembers,
            workspaceMembership: {
              workspaceMemberId: myMembership.id,
              workspaceRole: myMembership.workspaceRole,
            },
            pagination: createPaginationMeta(page, perPage, total),
          };
        }
      }

      const response: ApiResponse<WorkspaceTeamData> = {
        message: 'Workspace members retrieved successfully',
        data: teamData,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request parameters',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

// Keep old handler name for backward compatibility
export const getWorkspaceTeamHandler = getWorkspaceMembersHandler;

export function getWorkspaceDomainsHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get workspace domains',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to get workspace domains',
        };
        return c.json(response, 403);
      }

      // Parse pagination query params
      const pageParam = c.req.query('page');
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const perPage = 5;

      const { domains, total } = await domainService.getByWorkspaceIdPaginated(
        workspaceId,
        page,
        perPage
      );

      const domainItems: DomainItem[] = domains.map((domain) => ({
        domainId: domain.id,
        domainUrl: domain.domainUrl,
        domainStatus: domain.domainStatus,
      }));

      const domainsData: WorkspaceDomainsData = {
        workspaceId,
        domains: domainItems,
        pagination: createPaginationMeta(page, perPage, total),
      };

      const response: ApiResponse<WorkspaceDomainsData> = {
        message: 'Workspace domains retrieved successfully',
        data: domainsData,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function getDomainByIdHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const domainId = c.req.param('domainId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get domain',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to get domain',
        };
        return c.json(response, 403);
      }

      if (!domainId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Domain ID is required',
        };
        return c.json(response, 400);
      }

      const domain = await domainService.getByIdWithPreferences(domainId, workspaceId);

      const response: ApiResponse<DomainByIdData> = {
        message: 'Domain retrieved successfully',
        data: {
          workspaceId,
          domain: {
            domainId: domain.id,
            domainUrl: domain.domainUrl,
            domainStatus: domain.domainStatus,
            recordingHideSensitive: domain.recordingHideSensitive,
            recordingCaptureClientLog: domain.recordingCaptureClientLog,
            recordingCaptureServerLog: domain.recordingCaptureServerLog,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
          },
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function addDomainHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to add a domain',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to add a domain',
        };
        return c.json(response, 403);
      }

      const body = await c.req.json();
      const { url } = addDomainSchema.parse(body);

      const domain = await domainService.create({
        workspaceId,
        url,
        status: 'pending',
      });

      if (!domain) {
        const response: ApiErrorResponse = {
          error: 'Internal Server Error',
          message: 'Failed to create domain',
        };
        return c.json(response, 500);
      }

      const response: ApiResponse<DomainAddData> = {
        message: 'Domain added successfully',
        data: {
          workspaceId,
          domain: {
            domainId: domain.id,
            domainUrl: domain.domainUrl,
            domainStatus: domain.domainStatus,
          },
        },
      };
      return c.json(response, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function updateDomainHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const domainId = c.req.param('domainId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update a domain',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update a domain',
        };
        return c.json(response, 403);
      }

      if (!domainId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Domain ID is required',
        };
        return c.json(response, 400);
      }

      const body = await c.req.json();
      const { url } = updateDomainSchema.parse(body);

      const updated = await domainService.updateDomainUrl(domainId, workspaceId, url);

      const response: ApiResponse<DomainUpdateData> = {
        message: 'Domain updated successfully',
        data: {
          workspaceId,
          domain: {
            domainId: updated.id,
            domainUrl: updated.domainUrl,
            domainStatus: updated.domainStatus,
          },
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function deleteDomainHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const domainId = c.req.param('domainId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to delete a domain',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to delete a domain',
        };
        return c.json(response, 403);
      }

      if (!domainId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Domain ID is required',
        };
        return c.json(response, 400);
      }

      await domainService.deleteDomain(domainId, workspaceId);

      const response: ApiResponse<DomainDeleteData> = {
        message: 'Domain deleted successfully',
        data: {
          workspaceId,
          domainId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function getDomainVerificationUrlHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const domainId = c.req.param('domainId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get domain verification URL',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to get domain verification URL',
        };
        return c.json(response, 403);
      }

      if (!domainId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Domain ID is required',
        };
        return c.json(response, 400);
      }

      const domains = await domainService.getByWorkspaceId(workspaceId);
      const domain = domains.find((d) => d.id === domainId);

      if (!domain) {
        const response: ApiErrorResponse = {
          error: 'Not Found',
          message: 'Domain not found',
        };
        return c.json(response, 404);
      }

      const token = domainService.generateVerificationToken(
        workspaceId,
        domainId,
        domain.domainUrl
      );

      // Construct verification URL: https://{domain}?userplane-action=verify&userplane-token={token}
      const verificationUrl = `${domain.domainUrl}?userplane-action=verify&userplane-token=${token}`;

      const response: ApiResponse<{ verificationUrl: string; domainUrl: string }> = {
        message: 'Domain verification URL generated successfully',
        data: {
          verificationUrl,
          domainUrl: domain.domainUrl,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function updateWorkspacePreferencesHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update workspace preferences',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update workspace preferences',
        };
        return c.json(response, 403);
      }

      const body = await c.req.json();
      const updates = updateWorkspacePreferencesSchema.parse(body);

      await workspaceService.updatePreferences(workspaceId, updates);

      const response: ApiResponse<WorkspacePreferencesUpdateData> = {
        message: 'Workspace preferences updated successfully',
        data: { workspaceId },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function updateMemberRoleHandler(workspaceMemberService: WorkspaceMemberService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const memberId = c.req.param('workspaceMemberId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update member role',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update member role',
        };
        return c.json(response, 403);
      }

      if (!memberId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Member ID is required',
        };
        return c.json(response, 400);
      }

      const body = await c.req.json();
      const { role } = updateMemberRoleSchema.parse(body);

      await workspaceMemberService.updateMemberRole({
        memberId,
        newRole: role,
        userId: user.id,
        workspaceId,
      });

      const response: ApiResponse<MemberRoleUpdateData> = {
        message: 'Member role updated successfully',
        data: {
          workspaceId,
          workspaceMemberId: memberId,
          workspaceRole: role,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
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
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to remove a member',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to remove a member',
        };
        return c.json(response, 403);
      }

      if (!memberId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Member ID is required',
        };
        return c.json(response, 400);
      }

      await workspaceMemberService.removeMember({
        memberId,
        workspaceId,
        userId: user.id,
      });

      const response: ApiResponse<MemberRemoveData> = {
        message: 'Member removed successfully',
        data: {
          workspaceId,
          workspaceMemberId: memberId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function leaveWorkspaceHandler(workspaceMemberService: WorkspaceMemberService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to leave a workspace',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to leave a workspace',
        };
        return c.json(response, 403);
      }

      await workspaceMemberService.leaveWorkspace(user.id, workspaceId);

      const response: ApiResponse<LeaveWorkspaceData> = {
        message: 'Successfully left workspace',
        data: {
          workspaceId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function updateNotificationPreferencesHandler(
  workspaceMemberService: WorkspaceMemberService
) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update notification preferences',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update notification preferences',
        };
        return c.json(response, 403);
      }

      const body = await c.req.json();
      const preferences = updateNotificationPreferencesSchema.parse(body);

      await workspaceMemberService.updateNotificationPreferences(user.id, workspaceId, preferences);

      const response: ApiResponse<NotificationPreferencesUpdateData> = {
        message: 'Notification preferences updated successfully',
        data: {
          workspaceId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

// Helper to parse nullable form field - converts empty string or 'null' to null
function parseNullableField(value: unknown): string | null {
  if (value === undefined || value === '' || value === 'null') return null;
  return String(value);
}

// Helper to parse nullable integer from form field
function parseNullableInt(value: unknown): number | null {
  if (value === undefined || value === '' || value === 'null') return null;
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// Helper to validate logo file, returns error response or null if valid
function validateLogoFile(file: File): { error: string; message: string } | null {
  if (!ASSETS_ALLOWED_CONTENT_TYPES.includes(file.type as AssetsContentType)) {
    return {
      error: 'Bad Request',
      message: `Invalid file type. Allowed: ${ASSETS_ALLOWED_CONTENT_TYPES.join(', ')}`,
    };
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return { error: 'Bad Request', message: 'Logo file size must not exceed 4MB' };
  }
  return null;
}

/**
 * Handler for updating recording link branding and customization settings
 * Accepts multipart form data with optional logo file
 */
export function updateLinkSettingsHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update recording link settings',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update recording link settings',
        };
        return c.json(response, 403);
      }

      const body = await c.req.parseBody();
      const file = body['logo'];

      // Parse form fields into settings object
      const settings = updateLinkSettingsSchema.parse({
        recordingCompanyName: parseNullableField(body['recordingCompanyName']),
        recordingHeader: parseNullableField(body['recordingHeader']),
        recordingFootnote: parseNullableField(body['recordingFootnote']),
        recordingPrimaryColor: parseNullableField(body['recordingPrimaryColor']),
        recordingMaxDurationMs: parseNullableInt(body['recordingMaxDuration']),
      });

      const updates: Record<string, unknown> = { ...settings };

      // Handle optional logo upload
      if (file && file instanceof File) {
        const fileError = validateLogoFile(file);
        if (fileError) {
          const response: ApiErrorResponse = {
            error: fileError.error,
            message: fileError.message,
          };
          return c.json(response, 400);
        }

        try {
          const assetsStorage = getAssetsStorage();
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const { path } = await assetsStorage.putWorkspaceLogo(workspaceId, fileBuffer, file.type);

          const logoUrl = assetsStorage.getWorkspaceLogoUrl(path);
          updates.recordingCompanyLogoPath = logoUrl;
        } catch (uploadError) {
          const response: ApiErrorResponse = {
            error: 'Upload Failed',
            message: uploadError instanceof Error ? uploadError.message : 'Failed to upload logo',
          };
          return c.json(response, 500);
        }
      }

      const updatedWorkspace = await workspaceService.updatePreferences(workspaceId, updates);

      const response: ApiResponse<LinkSettingsData> = {
        message: 'Link settings updated successfully',
        data: {
          workspaceId: updatedWorkspace.id,
          recordingCompanyName: updatedWorkspace.recordingCompanyName,
          recordingCompanyLogoPath: updatedWorkspace.recordingCompanyLogoPath,
          recordingHeader: updatedWorkspace.recordingHeader,
          recordingFootnote: updatedWorkspace.recordingFootnote,
          recordingPrimaryColor: updatedWorkspace.recordingPrimaryColor,
          recordingMaxDurationMs: updatedWorkspace.recordingMaxDurationMs,
          recordingCustomizeLink: updatedWorkspace.recordingCustomizeLink,
          recordingSlug: updatedWorkspace.recordingSlug,
        },
      };

      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function updateWorkspaceNameHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.req.param('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update workspace name',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Workspace ID is required',
        };
        return c.json(response, 400);
      }

      const body = await c.req.json();
      const { name } = updateWorkspaceNameSchema.parse(body);

      const updated = await workspaceService.updateName(workspaceId, name);

      const response: ApiResponse<WorkspaceNameUpdateData> = {
        message: 'Workspace name updated successfully',
        data: {
          workspaceId: updated.id,
          workspaceName: updated.workspaceName,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function deleteWorkspaceHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.req.param('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to delete a workspace',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Workspace ID is required',
        };
        return c.json(response, 400);
      }

      await workspaceService.deleteWorkspace(workspaceId);

      // Trigger background cleanup task (best effort - fire and forget)
      try {
        await tasks.trigger(
          TASK_IDS.DELETE_WORKSPACE_RESOURCES,
          { workspaceId },
          { idempotencyKey: buildWorkspaceDeletionKey(workspaceId) }
        );
      } catch (triggerError) {
        // Log error but don't fail the request - sweep job will catch it
        console.error('[Workspace Delete - Trigger Failed]', {
          workspaceId,
          error: triggerError instanceof Error ? triggerError.message : 'Unknown error',
        });
      }

      const response: ApiResponse<WorkspaceDeleteData> = {
        message: 'Workspace deleted successfully',
        data: {
          workspaceId,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

export function workspaceSearchHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.req.param('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to search workspace',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Workspace ID is required',
        };
        return c.json(response, 400);
      }

      const rawQuery = c.req.query();
      const validatedQuery = workspaceSearchQuerySchema.parse(rawQuery);

      const results = await workspaceService.search(
        workspaceId,
        validatedQuery.q,
        validatedQuery.type,
        validatedQuery.limit
      );

      const response: ApiResponse<{ results: unknown[] }> = {
        message: 'Search completed successfully',
        data: {
          results,
        },
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: firstError?.message || 'Invalid query parameters',
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}
