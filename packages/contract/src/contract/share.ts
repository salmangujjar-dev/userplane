import { oc } from '@orpc/contract';

import {
  ApiResponseSchema,
  GenerateShareTokenDataSchema,
  GenerateShareTokenSchema,
  ShareErrors,
  ViewSharedRecordingDataSchema,
  ViewSharedRecordingSchema,
} from '../schemas';

/**
 * Share contract
 * Endpoints for generating and viewing publicly shareable recording links
 */

/**
 * POST /workspace/{workspaceId}/recordings/{recordingId}/share-token
 * Generate a short-lived public share token for a recording
 * Requires authenticated workspace member
 */
export const generateShareToken = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/recordings/{recordingId}/share-token',
    inputStructure: 'detailed',
    summary: 'Generate share token',
    description: 'Generate a short-lived public share link for a recording',
    tags: ['Share'],
  })
  .errors({
    UNAUTHORIZED: ShareErrors.UNAUTHORIZED,
    FORBIDDEN: ShareErrors.FORBIDDEN,
    RECORDING_NOT_FOUND: ShareErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: ShareErrors.RECORDING_GONE,
    SHARE_TOKEN_GENERATION_FAILED: ShareErrors.SHARE_TOKEN_GENERATION_FAILED,
  })
  .input(GenerateShareTokenSchema)
  .output(ApiResponseSchema(GenerateShareTokenDataSchema));

/**
 * GET /share/recording
 * View a shared recording using a public share token
 * Public endpoint - no authentication required
 */
export const viewSharedRecording = oc
  .route({
    method: 'GET',
    path: '/share/recording',
    inputStructure: 'detailed',
    summary: 'View shared recording',
    description: 'View a recording using a public share token',
    tags: ['Share'],
  })
  .errors({
    SHARE_TOKEN_INVALID: ShareErrors.SHARE_TOKEN_INVALID,
    SHARE_TOKEN_EXPIRED: ShareErrors.SHARE_TOKEN_EXPIRED,
    RECORDING_NOT_FOUND: ShareErrors.RECORDING_NOT_FOUND,
    RECORDING_GONE: ShareErrors.RECORDING_GONE,
  })
  .input(ViewSharedRecordingSchema)
  .output(ApiResponseSchema(ViewSharedRecordingDataSchema));
