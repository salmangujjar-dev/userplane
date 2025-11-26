/**
 * Invite handlers - HTTP request handlers for workspace invitations
 * Handles sending and accepting invitations
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { InviteService } from '@/api/services/invite.service';
import { emailArraySchema, nonEmptyString } from '@/api/lib/validation';
import { z } from 'zod';

export const sendInvitesSchema = z.object({
  emails: emailArraySchema,
});

export const acceptInviteSchema = z.object({
  inviteToken: nonEmptyString,
});

export function sendInvitesHandler(inviteService: InviteService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to send invites',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to send invites',
          },
          403
        );
      }

      const body = await c.req.json();
      const { emails } = sendInvitesSchema.parse(body);

      const result = await inviteService.sendInvites({
        workspaceId,
        emails,
        invitedBy: user.id,
      });

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

export function acceptInviteHandler(inviteService: InviteService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to accept an invite',
          },
          401
        );
      }

      const body = await c.req.json();
      const { inviteToken } = acceptInviteSchema.parse(body);

      const result = await inviteService.acceptInvite({
        inviteToken,
        userId: user.id,
      });

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
