import {
  type Action,
  type Resource,
  type RoleName,
  rolePermissionsMap,
  type SessionResource,
  type UserResource,
} from '@workspace/auth/permissions-client';

import { useSession } from '@/features/auth';

/**
 * Hook to check if the current user has specific permissions
 * Based on their role defined in Better Auth
 *
 * Why this matters:
 * - Admin: full control over all user and session operations
 * - CSM (Customer Success Manager): can impersonate, manage sessions, but not ban/delete users
 * - User: no administrative permissions
 *
 * What permissions mean:
 * - user.create: Create new user accounts
 * - user.list: View list of all users
 * - user.impersonate: Log in as another user
 * - user.ban: Ban users from the platform
 * - user.delete: Permanently delete user accounts
 * - user.set-role: Change user roles
 * - user.set-password: Reset user passwords
 * - session.list: View user sessions
 * - session.revoke: End a specific session
 * - session.delete: Delete session records
 */
export function usePermissions() {
  const { user } = useSession();

  // Get the user's role, default to 'user' if not set
  const userRole = (user?.role as RoleName) || 'user';

  // Get the permission map for the user's role
  const permissions = rolePermissionsMap[userRole];

  /**
   * Check if the user has permission to perform an action on a resource
   */
  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (resource === 'user') {
      return permissions.user.includes(action as UserResource);
    }
    if (resource === 'session') {
      return permissions.session.includes(action as SessionResource);
    }
    return false;
  };

  /**
   * Check multiple permissions at once
   */
  const hasAllPermissions = (checks: Array<{ resource: Resource; action: Action }>): boolean => {
    return checks.every((check) => hasPermission(check.resource, check.action));
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (checks: Array<{ resource: Resource; action: Action }>): boolean => {
    return checks.some((check) => hasPermission(check.resource, check.action));
  };

  // Convenience checks for common permissions
  const can = {
    // User resource permissions
    createUser: hasPermission('user', 'create'),
    listUsers: hasPermission('user', 'list'),
    impersonateUser: hasPermission('user', 'impersonate'),
    banUser: hasPermission('user', 'ban'),
    deleteUser: hasPermission('user', 'delete'),
    setUserRole: hasPermission('user', 'set-role'),
    setUserPassword: hasPermission('user', 'set-password'),

    // Session resource permissions
    listSessions: hasPermission('session', 'list'),
    revokeSession: hasPermission('session', 'revoke'),
    deleteSession: hasPermission('session', 'delete'),
  };

  return {
    // The user's role
    role: userRole,

    // Permission map for the role
    permissions,

    // Permission checking functions
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,

    // Convenience permission checks
    can,

    // Quick role checks
    isAdmin: userRole === 'admin',
    isCsm: userRole === 'csm',
    isUser: userRole === 'user',
  };
}

/**
 * Type guard to check if a role name is valid
 */
export function isValidRole(role: string | null | undefined): role is RoleName {
  return role === 'admin' || role === 'csm' || role === 'user';
}
