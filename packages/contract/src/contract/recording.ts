import { oc } from '@orpc/contract';
import {
  ListRecordingsQuerySchema,
  RecordingsListDataSchema,
  RecordingDetailDataSchema,
  RecordingResourceDataSchema,
  RecordingDeleteDataSchema,
  ApiResponseSchema,
} from '../schemas';

/**
 * Recording contract
 * Endpoints for recording operations
 */

/**
 * GET /api/v1/workspace/:workspaceId/recordings
 * List recordings with pagination and filtering
 */
export const getRecordings = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/recordings',
    summary: 'List recordings',
    description: 'Retrieve paginated list of recordings with optional filters',
    tags: ['Recordings'],
  })
  .input(ListRecordingsQuerySchema)
  .output(ApiResponseSchema(RecordingsListDataSchema));

/**
 * GET /api/v1/workspace/:workspaceId/recordings/:recordingId
 * Get recording details by ID
 */
export const getRecordingById = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/recordings/:recordingId',
    summary: 'Get recording by ID',
    description: 'Retrieve complete recording details with presigned URLs',
    tags: ['Recordings'],
  })
  .output(ApiResponseSchema(RecordingDetailDataSchema));

/**
 * DELETE /api/v1/workspace/:workspaceId/recordings/:recordingId
 * Delete a recording
 */
export const deleteRecording = oc
  .route({
    method: 'DELETE',
    path: '/api/v1/workspace/:workspaceId/recordings/:recordingId',
    summary: 'Delete recording',
    description: 'Soft delete a recording',
    tags: ['Recordings'],
  })
  .output(ApiResponseSchema(RecordingDeleteDataSchema));

/**
 * GET /api/v1/workspace/:workspaceId/recordings/:recordingId/video
 * Get recording video presigned URL
 */
export const getRecordingVideo = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/recordings/:recordingId/video',
    summary: 'Get recording video',
    description: 'Retrieve presigned URL for recording video',
    tags: ['Recordings'],
  })
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /api/v1/workspace/:workspaceId/recordings/:recordingId/thumbnail
 * Get recording thumbnail presigned URL
 */
export const getRecordingThumbnail = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/recordings/:recordingId/thumbnail',
    summary: 'Get recording thumbnail',
    description: 'Retrieve presigned URL for recording thumbnail',
    tags: ['Recordings'],
  })
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /api/v1/workspace/:workspaceId/recordings/:recordingId/console-log
 * Get recording console log presigned URL
 */
export const getRecordingConsoleLog = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/recordings/:recordingId/console-log',
    summary: 'Get recording console log',
    description: 'Retrieve presigned URL for recording console log',
    tags: ['Recordings'],
  })
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /api/v1/workspace/:workspaceId/recordings/:recordingId/network-log
 * Get recording network log presigned URL
 */
export const getRecordingNetworkLog = oc
  .route({
    method: 'GET',
    path: '/api/v1/workspace/:workspaceId/recordings/:recordingId/network-log',
    summary: 'Get recording network log',
    description: 'Retrieve presigned URL for recording network log',
    tags: ['Recordings'],
  })
  .output(ApiResponseSchema(RecordingResourceDataSchema));
