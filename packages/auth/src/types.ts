// Export permission types for type-safe permission checking
export type UserResource =
  | 'create'
  | 'list'
  | 'set-role'
  | 'ban'
  | 'impersonate'
  | 'delete'
  | 'set-password';
export type SessionResource = 'list' | 'revoke' | 'delete';

export type Resource = 'user' | 'session';
export type Action = UserResource | SessionResource;

// Define the permission map structure
export interface PermissionMap {
  user: UserResource[];
  session: SessionResource[];
}

// Role names
export type RoleName = 'admin' | 'csm' | 'user';

/**
 * Type guard to check if a string is a valid RoleName
 */
export function isValidRoleName(role: string | null | undefined): role is RoleName {
  return role === 'admin' || role === 'csm' || role === 'user';
}

// Helper type to extract permissions from a role
export type RolePermissions<R extends Resource> = R extends 'user'
  ? UserResource[]
  : SessionResource[];
