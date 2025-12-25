/**
 * Workspace errors
 * From WorkspaceService, WorkspaceMemberService
 */
export const WorkspaceErrors = {
  WORKSPACE_NOT_FOUND: {
    message: 'Workspace not found',
  },
  WORKSPACE_GONE: {
    message: 'Workspace has been deleted',
  },
  WORKSPACE_NAME_REQUIRED: {
    message: 'Workspace name is required',
  },
  WORKSPACE_NAME_TOO_LONG: {
    message: 'Workspace name must be less than 255 characters',
  },
  WORKSPACE_USER_ID_REQUIRED: {
    message: 'User ID is required',
  },
  WORKSPACE_SEARCH_TERM_REQUIRED: {
    message: 'Search term is required',
  },
  WORKSPACE_SEARCH_TYPE_INVALID: {
    message: 'Invalid search type',
  },
  WORKSPACE_SEARCH_UNAVAILABLE: {
    message: 'Search is not available for this resource type',
  },
  WORKSPACE_DELETE_FAILED: {
    message: 'Failed to delete workspace',
  },

  // Workspace Member errors
  WORKSPACE_MEMBER_IDS_REQUIRED: {
    message: 'User ID and Workspace ID are required',
  },
  WORKSPACE_MEMBER_ID_REQUIRED: {
    message: 'Member ID is required',
  },
  WORKSPACE_MEMBER_NOT_FOUND: {
    message: 'Workspace member not found',
  },
  WORKSPACE_MEMBER_ALREADY_EXISTS: {
    message: 'User is already a member of this workspace',
  },
  WORKSPACE_MEMBER_NOT_IN_WORKSPACE: {
    message: 'You are not a member of this workspace',
  },
  WORKSPACE_MEMBER_WRONG_WORKSPACE: {
    message: 'Member does not belong to this workspace',
  },
  WORKSPACE_MEMBER_CANNOT_CHANGE_OWN_ROLE: {
    message: 'You cannot change your own role',
  },
  WORKSPACE_MEMBER_CANNOT_REMOVE_SELF: {
    message: 'You cannot remove yourself. Use the leave workspace endpoint instead.',
  },
  WORKSPACE_MEMBER_LAST_OWNER_ROLE_CHANGE: {
    message: 'Cannot change role of the last owner. Promote another member to owner first.',
  },
  WORKSPACE_MEMBER_LAST_OWNER_REMOVE: {
    message: 'Cannot remove the last owner from workspace',
  },
  WORKSPACE_MEMBER_LAST_OWNER_LEAVE: {
    message:
      'Cannot leave workspace as the last owner. Transfer ownership or delete the workspace first.',
  },
} as const;
