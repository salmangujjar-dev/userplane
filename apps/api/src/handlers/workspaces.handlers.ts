/**
 * Workspace handlers - HTTP request handlers for workspace operations
 * Handles workspace-specific actions like rotating invite URLs and getting invite URLs
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { WorkspaceService } from '@/api/services/workspace.service';
import { InviteService } from '@/api/services/invite.service';
import type { RotateInviteUrlResult, GetInviteUrlResult } from '@/api/types';

export function rotateInviteUrlHandler(workspaceService: WorkspaceService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to rotate invite URL',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to rotate invite URL',
          },
          403
        );
      }

      const updatedWorkspace = await workspaceService.rotateInviteUrl(workspaceId);

      const result: RotateInviteUrlResult = {
        workspaceId: updatedWorkspace.id,
        workspaceSlug: updatedWorkspace.workspaceSlug,
        message:
          'Workspace invite URL rotated successfully. All previous invite links are now invalid.',
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

export function getInviteUrlHandler(
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
            message: 'You must be logged in to get invite URL',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to get invite URL',
          },
          403
        );
      }

      const inviteUrl = await inviteService.getInviteUrl(workspaceId, user.id);

      const workspace = await workspaceService.getById(workspaceId);

      const result: GetInviteUrlResult = {
        inviteUrl,
        workspaceId: workspace.id,
        workspaceSlug: workspace.workspaceSlug,
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
