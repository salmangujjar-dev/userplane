import { createAccessControl } from 'better-auth/plugins/access';
import type { PermissionMap, RoleName } from './types';

// Define access control statement with all user and session permissions
// This defines all possible actions that can be performed on each resource
const statement = {
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  session: ['list', 'revoke', 'delete'],
} as const;

export const ac = createAccessControl(statement);

// Permission maps for each role - used for both Better Auth and client-side permission checks
export const adminPermissions: PermissionMap = {
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  session: ['list', 'revoke', 'delete'],
} as const;

export const csmPermissions: PermissionMap = {
  user: ['create', 'list', 'impersonate'],
  session: ['list', 'revoke', 'delete'],
} as const;

export const userPermissions: PermissionMap = {
  user: [],
  session: [],
} as const;

// Map role names to their permissions
export const rolePermissionsMap: Record<RoleName, PermissionMap> = {
  admin: adminPermissions,
  csm: csmPermissions,
  user: userPermissions,
} as const;

// Admin role: full control over all user and session operations
// Can perform all actions on users and sessions
export const adminRole = ac.newRole(adminPermissions);

// CSM (Customer Success Manager) role: permissions for onboarding and account management
// Can create users, impersonate for support, and view user lists
// Cannot ban, delete, set roles, or set passwords (admin-only functions)
// Can fully manage sessions for troubleshooting and account management
export const csmRole = ac.newRole(csmPermissions);

// User role: no administrative permissions
// Standard users have no control over other users or sessions
export const userRole = ac.newRole(userPermissions);
