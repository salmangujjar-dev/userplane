/**
 * Account contract implementation using oRPC
 * Implements the account contract defined in @workspace/contract
 */

import { authorized } from '@/api/middleware/auth.orpc';
import type { UserService } from '@/api/services/user.service';

/**
 * GET /account - Get current user's account information
 * Requires authentication
 * Service throws ORPCError directly, no error mapping needed
 */
export const getAccountImpl = (userService: UserService) => {
  return authorized.account.get.handler(async ({ context }) => {
    const userData = await userService.getById(context.user.id);

    return {
      message: 'Account retrieved successfully',
      data: {
        userName: userData.name,
        userEmail: userData.email,
      },
    };
  });
};

/**
 * PATCH /account - Update current user's account
 * Requires authentication
 * Service throws ORPCError directly, no error mapping needed
 */
export const updateAccountImpl = (userService: UserService) => {
  return authorized.account.update.handler(async ({ input, context }) => {
    const updatedUser = await userService.updateName(context.user.id, input.body.name);

    return {
      message: 'Account updated successfully',
      data: {
        userName: updatedUser.name,
      },
    };
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
