/**
 * Workspace authorization middleware
 * Checks workspace membership and attaches workspace context
 */

import type { Context, Next } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { WorkspaceService } from '@/api/services/workspace.service';
import { createAppLogger } from '@workspace/logger';
import type { WorkspaceRole } from '@workspace/db';

const logger = createAppLogger('workspace-middleware');

/**
 * Require user to be a member of the workspace
 * Attaches workspaceId and membership to context
 */
export function requireWorkspaceMember(
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource',
        },
        401
      );
    }

    const workspaceId = c.req.param('workspaceId');

    if (!workspaceId) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Workspace ID is required',
        },
        400
      );
    }

    const workspace = await workspaceService.getById(workspaceId);

    if (!workspace) {
      return c.json(
        {
          error: 'Not Found',
          message: 'Workspace not found',
        },
        404
      );
    }

    const member = await workspaceMemberService.getMember(user.id, workspace.id);

    if (!member) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You are not a member of this workspace',
        },
        403
      );
    }

    c.set('workspaceId', workspace.id);
    c.set('workspaceRole', member.workspaceRole);

    logger.debug(
      {
        userId: user.id,
        workspaceId: workspace.id,
        role: member.workspaceRole,
      },
      'Workspace member verified'
    );

    await next();
  };
}

/**
 * Require user to have a specific role in the workspace
 */
export function requireWorkspaceRole(
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  allowedRoles: WorkspaceRole[]
) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource',
        },
        401
      );
    }

    const workspaceId = c.req.param('workspaceId');

    if (!workspaceId) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Workspace ID is required',
        },
        400
      );
    }

    const workspace = await workspaceService.getById(workspaceId);

    if (!workspace) {
      return c.json(
        {
          error: 'Not Found',
          message: 'Workspace not found',
        },
        404
      );
    }

    const member = await workspaceMemberService.getMember(user.id, workspace.id);

    if (!member) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You are not a member of this workspace',
        },
        403
      );
    }

    if (!allowedRoles.includes(member.workspaceRole)) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to perform this action',
        },
        403
      );
    }

    c.set('workspaceId', workspace.id);
    c.set('workspaceRole', member.workspaceRole);

    await next();
  };
}
