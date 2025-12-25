/**
 * Project errors
 * From ProjectService
 */
export const ProjectErrors = {
  PROJECT_NOT_FOUND: {
    message: 'Project not found',
  },
  PROJECT_GONE: {
    message: 'Project has been deleted',
  },
  PROJECT_WORKSPACE_ID_REQUIRED: {
    message: 'Workspace ID is required',
  },
  PROJECT_DEFAULT_NOT_FOUND: {
    message: 'No default project found for workspace',
  },
  PROJECT_WORKSPACE_MISMATCH: {
    message: 'Project does not belong to this workspace',
  },
  PROJECT_LAST_PROJECT_DELETE_FORBIDDEN: {
    message: 'Cannot delete the only project in a workspace',
  },
  PROJECT_DELETE_FAILED: {
    message: 'Failed to delete project',
  },
} as const;
