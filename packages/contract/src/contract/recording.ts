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
} from '../schemas';

/**
 * Recording contract
 * Endpoints for recording operations
 */

/**
 * GET /workspace/:workspaceId/recordings
 * List recordings with pagination and filtering
 */
export const getRecordings = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/recordings',
    summary: 'List recordings',
    description: 'Retrieve paginated list of recordings with optional filters',
    tags: ['Recordings'],
  })
  .input(ListRecordingsQuerySchema)
  .output(ApiResponseSchema(RecordingsListDataSchema));

/**
 * GET /workspace/:workspaceId/recordings/:recordingId
 * Get recording details by ID
 */
export const getRecordingById = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/recordings/:recordingId',
    summary: 'Get recording by ID',
    description: 'Retrieve complete recording details with presigned URLs',
    tags: ['Recordings'],
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingDetailDataSchema));

/**
 * DELETE /workspace/:workspaceId/recordings/:recordingId
 * Delete a recording
 */
export const deleteRecording = oc
  .route({
    method: 'DELETE',
    path: '/workspace/:workspaceId/recordings/:recordingId',
    summary: 'Delete recording',
    description: 'Soft delete a recording',
    tags: ['Recordings'],
  })
  .input(DeleteRecordingSchema)
  .output(ApiResponseSchema(RecordingDeleteDataSchema));

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/video
 * Get recording video presigned URL
 */
export const getRecordingVideo = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/recordings/:recordingId/video',
    summary: 'Get recording video',
    description: 'Retrieve presigned URL for recording video',
    tags: ['Recordings'],
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/thumbnail
 * Get recording thumbnail presigned URL
 */
export const getRecordingThumbnail = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/recordings/:recordingId/thumbnail',
    summary: 'Get recording thumbnail',
    description: 'Retrieve presigned URL for recording thumbnail',
    tags: ['Recordings'],
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/console-log
 * Get recording console log presigned URL
 */
export const getRecordingConsoleLog = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/recordings/:recordingId/console-log',
    summary: 'Get recording console log',
    description: 'Retrieve presigned URL for recording console log',
    tags: ['Recordings'],
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/network-log
 * Get recording network log presigned URL
 */
export const getRecordingNetworkLog = oc
  .route({
    method: 'GET',
    path: '/workspace/:workspaceId/recordings/:recordingId/network-log',
    summary: 'Get recording network log',
    description: 'Retrieve presigned URL for recording network log',
    tags: ['Recordings'],
  })
  .input(RecordingByIdSchema)
  .output(ApiResponseSchema(RecordingResourceDataSchema));
