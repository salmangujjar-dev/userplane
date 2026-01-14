/**
 * Admin middleware for oRPC procedures
 * Checks if the authenticated user has admin access (admin or csm role)
 */

import { ORPCError } from '@orpc/server';
import { base, type AuthContext } from './auth.orpc';
import type { AdminService } from '@/api/services/admin.service';

export type AdminContext = AuthContext & {
  isAdmin: true;
};

/**
 * Create admin middleware that checks if user has admin access
 * Grants access to users with 'admin' or 'csm' role
 */
export function createAdminMiddleware(adminService: AdminService) {
  return base.$context<AuthContext>().middleware(async ({ context, next }) => {
    const hasAdminAccess = adminService.isAdmin(context.user.id, context.user.role);

    if (!hasAdminAccess) {
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
