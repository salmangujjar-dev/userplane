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
} as const;
