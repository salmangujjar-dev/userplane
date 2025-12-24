/**
 * Recording errors
 * From RecordingService
 */
export const RecordingErrors = {
  RECORDING_NOT_FOUND: {
    message: 'Recording not found',
  },
  RECORDING_GONE: {
    message: 'Recording has already been deleted',
  },
  RECORDING_WORKSPACE_MISMATCH: {
    message: 'Recording does not belong to this workspace',
  },
  RECORDING_DELETE_FAILED: {
    message: 'Failed to delete recording',
  },
  RECORDING_PAGE_INVALID: {
    message: 'Page must be greater than 0',
  },
  RECORDING_PER_PAGE_INVALID: {
    message: 'Per page must be between 1 and 20',
  },
} as const;
