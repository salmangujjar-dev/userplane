import { oc } from '@orpc/contract';

import {
  ApiResponseSchema,
  CompleteUploadSchema,
  GetSessionQuerySchema,
  InitUploadSchema,
  SessionErrors,
  SessionInitDataSchema,
  UploadCompleteDataSchema,
  UploadInitDataSchema,
} from '../schemas';

/**
 * Session contract
 * Endpoints for recording session and upload management
 */

/**
 * GET /session
 * Initialize recording session
 */
export const getSession = oc
  .route({
    method: 'GET',
    path: '/session',
    inputStructure: 'detailed',
    spec: {
      summary: 'Initialize session',
      description: 'Initialize a recording session and return session token',
      tags: ['Session'],
      security: [],
    },
  })
  .errors({
    LINK_TOKEN_MISSING_ID: SessionErrors.LINK_TOKEN_MISSING_ID,
    LINK_TOKEN_EXPIRED: SessionErrors.LINK_TOKEN_EXPIRED,
    LINK_TOKEN_INVALID: SessionErrors.LINK_TOKEN_INVALID,
    SESSION_LINK_GONE: SessionErrors.SESSION_LINK_GONE,
    SESSION_LINK_NOT_FOUND: SessionErrors.SESSION_LINK_NOT_FOUND,
    SESSION_LINK_INVALID_TYPE: SessionErrors.SESSION_LINK_INVALID_TYPE,
    SESSION_LINK_ALREADY_USED: SessionErrors.SESSION_LINK_ALREADY_USED,
  })
  .input(GetSessionQuerySchema)
  .output(ApiResponseSchema(SessionInitDataSchema));

/**
 * POST /session
 * Initialize upload with presigned URLs
 */
export const initUpload = oc
  .route({
    method: 'POST',
    path: '/session',
    inputStructure: 'detailed',
    spec: {
      summary: 'Initialize upload',
      description: 'Initialize upload and receive presigned URLs for file uploads',
      tags: ['Session'],
      security: [{ sessionTokenHeader: [] }],
    },
  })
  .errors({
    SESSION_TOKEN_MISSING: SessionErrors.SESSION_TOKEN_MISSING,
    SESSION_TOKEN_EXPIRED: SessionErrors.SESSION_TOKEN_EXPIRED,
    SESSION_LINK_GONE: SessionErrors.SESSION_LINK_GONE,
    SESSION_LINK_NOT_FOUND: SessionErrors.SESSION_LINK_NOT_FOUND,
    SESSION_LINK_INVALID_TYPE: SessionErrors.SESSION_LINK_INVALID_TYPE,
    SESSION_LINK_ALREADY_USED: SessionErrors.SESSION_LINK_ALREADY_USED,
    SESSION_DURATION_TOO_SHORT: SessionErrors.SESSION_DURATION_TOO_SHORT,
    SESSION_DURATION_TOO_LONG: SessionErrors.SESSION_DURATION_TOO_LONG,
    SESSION_VIDEO_MISSING: SessionErrors.SESSION_VIDEO_MISSING,
    SESSION_VIDEO_EMPTY: SessionErrors.SESSION_VIDEO_EMPTY,
    SESSION_FILE_FORMAT_UNSUPPORTED: SessionErrors.SESSION_FILE_FORMAT_UNSUPPORTED,
    SESSION_FILE_TOO_LARGE: SessionErrors.SESSION_FILE_TOO_LARGE,
    SESSION_STORAGE_ERROR: SessionErrors.SESSION_STORAGE_ERROR,
    SESSION_DATABASE_ERROR: SessionErrors.SESSION_DATABASE_ERROR,
  })
  .input(InitUploadSchema)
  .output(ApiResponseSchema(UploadInitDataSchema));

/**
 * PATCH /session
 * Mark upload as available
 */
export const completeUpload = oc
  .route({
    method: 'PATCH',
    path: '/session',
    inputStructure: 'detailed',
    spec: {
      summary: 'Mark upload available',
      description: 'Mark upload as available after all files are uploaded',
      tags: ['Session'],
      security: [{ uploadTokenHeader: [] }],
    },
  })
  .errors({
    UPLOAD_TOKEN_MISSING: SessionErrors.UPLOAD_TOKEN_MISSING,
    SESSION_UPLOAD_TOKEN_EXPIRED: SessionErrors.SESSION_UPLOAD_TOKEN_EXPIRED,
    SESSION_UPLOAD_TOKEN_MISMATCH: SessionErrors.SESSION_UPLOAD_TOKEN_MISMATCH,
    SESSION_LINK_GONE: SessionErrors.SESSION_LINK_GONE,
    SESSION_LINK_NOT_FOUND: SessionErrors.SESSION_LINK_NOT_FOUND,
    SESSION_RECORDING_GONE: SessionErrors.SESSION_RECORDING_GONE,
    SESSION_RECORDING_NOT_FOUND: SessionErrors.SESSION_RECORDING_NOT_FOUND,
    SESSION_UPLOAD_FAILED: SessionErrors.SESSION_UPLOAD_FAILED,
    SESSION_FILE_VERIFICATION_FAILED: SessionErrors.SESSION_FILE_VERIFICATION_FAILED,
    SESSION_STORAGE_ERROR: SessionErrors.SESSION_STORAGE_ERROR,
  })
  .input(CompleteUploadSchema)
  .output(ApiResponseSchema(UploadCompleteDataSchema));
