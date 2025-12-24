/**
 * Link errors
 * From LinkService
 */
export const LinkErrors = {
  LINK_NOT_FOUND: {
    message: 'Link not found',
  },
  LINK_GONE: {
    message: 'Link has been deleted',
  },
  LINK_TOKEN_INVALID: {
    message: 'Invalid link token',
  },
  LINK_TOKEN_MISSING_ID: {
    message: 'Invalid link token: missing link ID',
  },
  LINK_TOKEN_EXPIRED: {
    message: 'Link token has expired',
  },
  LINK_WORKSPACE_DELETED: {
    message: 'Workspace has been deleted',
  },
  LINK_MEMBER_NOT_FOUND: {
    message: 'Workspace member not found',
  },
  LINK_MEMBER_WORKSPACE_MISMATCH: {
    message: 'Workspace member does not belong to this workspace',
  },
  LINK_DEFAULT_PROJECT_NOT_FOUND: {
    message: 'No default project found for workspace',
  },
  LINK_PROJECT_DELETED: {
    message: 'Project has been deleted',
  },
  LINK_CREATE_FAILED: {
    message: 'Failed to create link',
  },
  LINK_PAGE_INVALID: {
    message: 'Page must be greater than 0',
  },
  LINK_PER_PAGE_INVALID: {
    message: 'Per page must be between 1 and 20',
  },
  LINK_WORKSPACE_MISMATCH: {
    message: 'Link does not belong to this workspace',
  },
  LINK_UPDATE_FAILED: {
    message: 'Failed to update link',
  },
  LINK_DELETE_FAILED: {
    message: 'Failed to delete link',
  },
} as const;
