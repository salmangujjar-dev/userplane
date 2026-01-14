// Client-safe permission exports
// This file contains only types and constants - no Better Auth imports
import type { PermissionMap, RoleName } from './types';

// Permission maps for each role - used for client-side permission checks
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

// Re-export types
export type {
  PermissionMap,
  RoleName,
  Resource,
  Action,
  UserResource,
  SessionResource,
} from './types';
