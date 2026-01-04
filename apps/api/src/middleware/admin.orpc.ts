/**
 * Admin middleware for oRPC procedures
 * Checks if the authenticated user has admin privileges
 */

import { ORPCError } from '@orpc/server';
import { base, type AuthContext } from './auth.orpc';
import type { AdminService } from '@/api/services/admin.service';

export type AdminContext = AuthContext & {
  isAdmin: true;
};

/**
 * Create admin middleware that checks if user is admin
 */
export function createAdminMiddleware(adminService: AdminService) {
  return base.$context<AuthContext>().middleware(async ({ context, next }) => {
    const isAdmin = adminService.isAdmin(context.user.id, undefined);

    if (!isAdmin) {
      throw new ORPCError('NOT_ADMIN', {
        status: 403,
        message: 'Admin access required',
      });
    }

    return next({
      context: {
        isAdmin: true as const,
      },
    });
  });
}
