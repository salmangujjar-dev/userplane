/**
 * Account handlers - HTTP request handlers for user account operations
 * Handles user profile management for authenticated users
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { UserService } from '@/api/services/user.service';
import { z } from 'zod';
import { ValidationError, getErrorStatusCode } from '@/api/lib/errors';

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
});

export function getAccountHandler(userService: UserService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to get account information',
          },
          401
        );
      }

      const userData = await userService.getById(user.id);

      return c.json(
        {
          userName: userData.name,
          userEmail: userData.email,
        },
        200
      );
    } catch (error) {
      if (error instanceof Error) {
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          getErrorStatusCode(error)
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

export function updateAccountHandler(userService: UserService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to update account',
          },
          401
        );
      }

      const body = await c.req.json();
      const { name } = updateAccountSchema.parse(body);

      const updatedUser = await userService.updateName(user.id, name);

      return c.json(
        {
          userName: updatedUser.name,
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
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          getErrorStatusCode(error)
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
