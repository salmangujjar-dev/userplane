import { MAX_EMAIL_DOMAINS } from '../constants';

/**
 * Workspace errors
 * From WorkspaceService, WorkspaceMemberService, auth middleware, and workspace middleware
 * Status codes follow HTTP semantics and match actual service implementation:
 *   400 - Bad Request (validation errors)
 *   401 - Unauthorized (authentication errors)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 *   409 - Conflict (resource already exists)
 *   410 - Gone (resource permanently deleted)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const WorkspaceErrors = {
  // Validation errors
  WORKSPACE_ID_REQUIRED: {
    status: 400,
    message: 'Workspace ID is required',
  },
  WORKSPACE_NAME_REQUIRED: {
    status: 400,
    message: 'Workspace name is required',
  },
  WORKSPACE_NAME_TOO_LONG: {
    status: 400,
    message: 'Workspace name must be less than 255 characters',
  },
  WORKSPACE_USER_ID_REQUIRED: {
    status: 400,
    message: 'User ID is required',
  },
  WORKSPACE_SEARCH_TERM_REQUIRED: {
    status: 400,
    message: 'Search term is required',
  },
  WORKSPACE_SEARCH_TYPE_INVALID: {
    status: 400,
    message: 'Invalid search type',
  },

  // Authentication errors (from auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Authorization errors (from workspace middleware)
  FORBIDDEN: {
    status: 403,
    message: 'Insufficient permissions',
  },

  // Not found errors
  WORKSPACE_NOT_FOUND: {
    status: 404,
    message: 'Workspace not found',
  },

  // Gone errors
  WORKSPACE_GONE: {
    status: 410,
    message: 'Workspace has been deleted',
  },

  // Restoration errors
  WORKSPACE_NOT_DELETED: {
    status: 400,
    message: 'Workspace is not deleted and cannot be restored',
  },
  WORKSPACE_RESTORE_TIME_EXPIRED: {
    status: 410,
    message: 'Workspace restoration window has expired',
  },

  // Infrastructure errors
  WORKSPACE_SEARCH_UNAVAILABLE: {
    status: 500,
    message: 'Search is not available for this resource type',
  },
  WORKSPACE_DELETE_FAILED: {
    status: 500,
    message: 'Failed to delete workspace',
  },
  WORKSPACE_RESTORE_FAILED: {
    status: 500,
    message: 'Failed to restore workspace',
  },

  // Workspace Member errors

  // Validation errors
  WORKSPACE_MEMBER_IDS_REQUIRED: {
    status: 400,
    message: 'User ID and Workspace ID are required',
  },
  WORKSPACE_MEMBER_ID_REQUIRED: {
    status: 400,
    message: 'Member ID is required',
  },

  // Authorization errors
  WORKSPACE_MEMBER_WRONG_WORKSPACE: {
    status: 403,
    message: 'Member does not belong to this workspace',
  },
  WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE: {
    status: 403,
    message: 'You cannot change your own role',
  },
  WORKSPACE_MEMBER_CANNOT_REMOVE_SELF: {
    status: 403,
    message: 'You cannot remove yourself. Use the leave workspace endpoint instead.',
  },
  WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE: {
    status: 403,
    message: 'Cannot change role of the last owner. Promote another member to owner first.',
  },
  WORKSPACE_MEMBER_LAST_OWNER_REMOVE: {
    status: 403,
    message: 'Cannot remove the last owner from workspace',
  },
  WORKSPACE_MEMBER_LAST_OWNER_LEAVE: {
    status: 403,
    message:
      'Cannot leave workspace as the last owner. Transfer ownership or delete the workspace first.',
  },
  WORKSPACE_MEMBER_SOLE_OWNER_WITH_MEMBERS: {
    status: 403,
    message: 'You are the only owner. Please make someone else an owner before leaving.',
  },

  // Not found errors
  WORKSPACE_MEMBER_NOT_FOUND: {
    status: 404,
    message: 'Workspace member not found',
  },
  WORKSPACE_MEMBER_NOT_IN_WORKSPACE: {
    status: 404,
    message: 'You are not a member of this workspace',
  },

  // Conflict errors
  WORKSPACE_MEMBER_ALREADY_EXISTS: {
    status: 409,
    message: 'User is already a member of this workspace',
  },

  // Entitlement errors
  WORKSPACE_SEAT_LIMIT_EXCEEDED: {
    status: 403,
    message: "You've reached your seat limit. Upgrade your plan to add more members.",
  },

  // Workspace invite policy errors
  WORKSPACE_INVITE_POLICY_DOMAIN_MISMATCH: {
    status: 403,
    message: 'Your email domain is not allowed to join this workspace',
  },
  WORKSPACE_INVITE_POLICY_PRIVATE: {
    status: 403,
    message: 'This workspace is private and cannot be joined directly',
  },
  WORKSPACE_INVITE_POLICY_DOMAINS_REQUIRED: {
    status: 400,
    message: 'At least one email domain is required for whitelisted or protected policies',
  },
  WORKSPACE_INVITE_POLICY_DISPOSABLE_DOMAIN: {
    status: 400,
    message: 'Disposable email domains are not allowed',
  },
  WORKSPACE_INVITE_POLICY_TOO_MANY_DOMAINS: {
    status: 400,
    message: `Maximum ${MAX_EMAIL_DOMAINS} email domains allowed per workspace`,
  },
  WORKSPACE_ACCESS_REQUEST_INVALID: {
    status: 400,
    message: 'Invalid or expired access request token',
  },
  WORKSPACE_ACCESS_REQUEST_NOT_OWNER: {
    status: 403,
    message: 'Only workspace owners can approve access requests',
  },

  // Integration errors
  INTEGRATION_ALREADY_CONNECTED: {
    status: 409,
    message: 'Intercom is already connected to this workspace',
  },
  INTEGRATION_NOT_FOUND: {
    status: 404,
    message: 'Integration not found',
  },
  INTEGRATION_PROVIDER_WORKSPACE_CONFLICT: {
    status: 409,
    message: 'This Intercom workspace is already connected to another account',
  },
} as const;
