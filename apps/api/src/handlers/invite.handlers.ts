/**
 * Invite handlers - HTTP request handlers for workspace invitations
 * Handles sending and accepting invitations
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import type {
  ApiResponse,
  ApiErrorResponse,
  SendInvitesResult,
  InviteActionResult,
} from '@/api/types';
import { InviteService } from '@/api/services/invite.service';
import { z } from 'zod';
import { getErrorStatusCode } from '@/api/lib/errors';
import { sendInvitesSchema, tokenQuerySchema } from '@/api/schema';

export function sendInvitesHandler(inviteService: InviteService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to send invites',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to send invites',
        };
        return c.json(response, 403);
      }

      const body = await c.req.json();
      const { emails } = sendInvitesSchema.parse(body);

      const result = await inviteService.sendInvites({
        workspaceId,
        emails,
        invitedBy: user.id,
      });

      const response: ApiResponse<SendInvitesResult> = {
        message: 'Invites sent successfully',
        data: result,
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

export function inviteActionHandler(inviteService: InviteService) {
  return async (c: Context<AppEnv>) => {
    try {
      const action = c.req.query('action') || 'validate';

      if (action !== 'validate' && action !== 'accept') {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid action parameter. Must be "validate" or "accept"',
        };
        return c.json(response, 400);
      }

      const queryParams = c.req.query();
      const { token } = tokenQuerySchema.parse(queryParams);

      // For accept action, require authentication
      if (action === 'accept') {
        const user = c.get('user');
        if (!user) {
          const response: ApiErrorResponse = {
            error: 'Unauthorized',
            message: 'You must be logged in to accept an invite',
          };
          return c.json(response, 401);
        }

        const result = await inviteService.handleInviteAction(token, user.id);
        const response: ApiResponse<InviteActionResult> = {
          message: 'Invite accepted successfully',
          data: result,
        };
        return c.json(response, 200);
      }

      // For validate action, no auth required
      const result = await inviteService.handleInviteAction(token);
      const response: ApiResponse<InviteActionResult> = {
        message: 'Invite validated successfully',
        data: result,
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
