/**
 * Account handlers - HTTP request handlers for user account operations
 * Handles user profile management for authenticated users
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import type { ApiResponse, ApiErrorResponse, AccountData, AccountUpdateData } from '@/api/types';
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
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to get account information',
        };
        return c.json(response, 401);
      }

      const userData = await userService.getById(user.id);

      const response: ApiResponse<AccountData> = {
        message: 'Account retrieved successfully',
        data: {
          userName: userData.name,
          userEmail: userData.email,
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

export function updateAccountHandler(userService: UserService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update account',
        };
        return c.json(response, 401);
      }

      const body = await c.req.json();
      const { name } = updateAccountSchema.parse(body);

      const updatedUser = await userService.updateName(user.id, name);

      const response: ApiResponse<AccountUpdateData> = {
        message: 'Account updated successfully',
        data: {
          userName: updatedUser.name,
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
