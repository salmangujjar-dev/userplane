/**
 * Account contract implementation using oRPC
 * Implements the account contract defined in @workspace/contract
 */

import { ORPCError } from '@orpc/server';
import { authorized } from '@/api/middleware/auth.orpc';
import type { UserService } from '@/api/services/user.service';
import { z } from 'zod';
import { ValidationError } from '@/api/lib/errors';

/**
 * GET /account - Get current user's account information
 * Requires authentication
 */
export const getAccountImpl = (userService: UserService) => {
  return authorized.account.get.handler(async ({ context }) => {
    try {
      const userData = await userService.getById(context.user.id);

      return {
        message: 'Account retrieved successfully',
        data: {
          userName: userData.name,
          userEmail: userData.email,
        },
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
 * PATCH /account - Update current user's account
 * Requires authentication
 */
export const updateAccountImpl = (userService: UserService) => {
  return authorized.account.update.handler(async ({ input, context }) => {
    try {
      const updatedUser = await userService.updateName(context.user.id, input.body.name);

      return {
        message: 'Account updated successfully',
        data: {
          userName: updatedUser.name,
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
 * Create the account procedures object
 * This exports the implemented procedures for the account endpoints
 * These can be combined with other implementations to form the complete API router
 */
export const createAccountProcedures = (userService: UserService) => {
  return {
    get: getAccountImpl(userService),
    update: updateAccountImpl(userService),
  };
};
