import { oc } from '@orpc/contract';
import {
  GetSessionQuerySchema,
  SessionInitDataSchema,
  InitUploadSchema,
  UploadInitDataSchema,
  CompleteUploadSchema,
  UploadCompleteDataSchema,
  ApiResponseSchema,
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
  .input(CompleteUploadSchema)
  .output(ApiResponseSchema(UploadCompleteDataSchema));
