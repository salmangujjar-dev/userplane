/**
 * Admin middleware for oRPC procedures
 * Checks if the authenticated user has admin access (admin or csm role)
 */

import { adminError } from '@workspace/contract';

import type { AdminService } from '@/api/services/admin.service';

import { type AuthContext, base } from './auth.orpc';

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
      throw adminError.NOT_ADMIN();
    }

    return next({
      context: {
        isAdmin: true as const,
      },
    });
  });
}
