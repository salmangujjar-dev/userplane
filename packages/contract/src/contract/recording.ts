import { oc } from '@orpc/contract';
import {
  ListRecordingsQuerySchema,
  RecordingsListDataSchema,
  RecordingByIdSchema,
  RecordingDetailDataSchema,
  RecordingResourceDataSchema,
  DeleteRecordingSchema,
  RecordingDeleteDataSchema,
  ApiResponseSchema,
  RecordingErrors,
} from '../schemas';

/**
 * Recording contract
 * Endpoints for recording operations
 * All endpoints require cookie-based authentication (userplane.session_token)
 */

/**
 * GET /workspace/{workspaceId}/recordings
 * List recordings with pagination and filtering
 */
export const getRecordings = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/recordings',
    inputStructure: 'detailed',
    summary: 'List recordings',
    description: 'Retrieve paginated list of recordings with optional filters',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_PAGE_INVALID: RecordingErrors.RECORDING_PAGE_INVALID,
    RECORDING_PER_PAGE_INVALID: RecordingErrors.RECORDING_PER_PAGE_INVALID,
  })
  .input(ListRecordingsQuerySchema)
  .output(ApiResponseSchema(RecordingsListDataSchema));

/**
 * GET /workspace/{workspaceId}/recordings/{recordingId}
 * Get recording details by ID
 */
export const getRecordingById = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/recordings/{recordingId}',
    inputStructure: 'detailed',
    summary: 'Get recording by ID',
    description: 'Retrieve complete recording details with presigned URLs',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingDetailDataSchema));

/**
 * DELETE /workspace/{workspaceId}/recordings/{recordingId}
 * Delete a recording
 */
export const deleteRecording = oc
  .route({
    method: 'DELETE',
    path: '/workspace/{workspaceId}/recordings/{recordingId}',
    inputStructure: 'detailed',
    summary: 'Delete recording',
    description: 'Soft delete a recording',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
    RECORDING_WORKSPACE_MISMATCH: RecordingErrors.RECORDING_WORKSPACE_MISMATCH,
    RECORDING_DELETE_FAILED: RecordingErrors.RECORDING_DELETE_FAILED,
  })
  .input(DeleteRecordingSchema)
  .output(ApiResponseSchema(RecordingDeleteDataSchema));

/**
 * GET /workspace/{workspaceId}/recordings/{recordingId}/video
 * Get recording video presigned URL
 */
export const getRecordingVideo = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/recordings/{recordingId}/video',
    inputStructure: 'detailed',
    summary: 'Get recording video',
    description: 'Retrieve presigned URL for recording video',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /workspace/{workspaceId}/recordings/{recordingId}/thumbnail
 * Get recording thumbnail presigned URL
 */
export const getRecordingThumbnail = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/recordings/{recordingId}/thumbnail',
    inputStructure: 'detailed',
    summary: 'Get recording thumbnail',
    description: 'Retrieve presigned URL for recording thumbnail',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /workspace/{workspaceId}/recordings/{recordingId}/console-log
 * Get recording console log presigned URL
 */
export const getRecordingConsoleLog = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/recordings/{recordingId}/console-log',
    inputStructure: 'detailed',
    summary: 'Get recording console log',
    description: 'Retrieve presigned URL for recording console log',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /workspace/{workspaceId}/recordings/{recordingId}/network-log
 * Get recording network log presigned URL
 */
export const getRecordingNetworkLog = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/recordings/{recordingId}/network-log',
    inputStructure: 'detailed',
    summary: 'Get recording network log',
    description: 'Retrieve presigned URL for recording network log',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /workspace/{workspaceId}/recordings/{recordingId}/action
 * Get recording client action presigned URL
 */
export const getRecordingAction = oc
  .route({
    method: 'GET',
    path: '/workspace/{workspaceId}/recordings/{recordingId}/action',
    inputStructure: 'detailed',
    summary: 'Get recording client action',
    description: 'Retrieve presigned URL for recording client action log',
    tags: ['Recordings'],
  })
  .errors({
    RECORDING_NOT_FOUND: RecordingErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: RecordingErrors.RECORDING_GONE,
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));
