/**
 * Account routes - HTTP routes for user account operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { getAccountHandler, updateAccountHandler } from '@/api/handlers/account.handlers';
import type { UserService } from '@/api/services/user.service';

export function createAccountRoutes(userService: UserService) {
  const accountRoutes = new Hono<AppEnv>();

  // Get current user's account info
  accountRoutes.get('/', requireAuth, getAccountHandler(userService));

  // Update current user's account
  accountRoutes.patch('/', requireAuth, updateAccountHandler(userService));

  return accountRoutes;
}
