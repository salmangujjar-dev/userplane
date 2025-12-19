/**
 * Session handlers - HTTP request handlers for session/upload operations
 * Handles session initialization, upload initialization, and upload completion
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import type { SessionService } from '@/api/services/session.service';
import {
  getErrorStatusCode,
  ValidationError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
  GoneError,
} from '@/api/lib/errors';
import type {
  ApiResponse,
  ApiErrorResponse,
  SessionInitData,
  UploadInitData,
  UploadCompleteData,
} from '@/api/types';
import { z } from 'zod';
import {
  getSessionQuerySchema,
  initUploadSchema,
  completeUploadSchema,
  SESSION_CONSTRAINTS,
} from '@/api/schema';
import { REQUEST_HEADERS, RESPONSE_HEADERS } from '@/api/constants/headers';

/**
 * Handler factory for GET /api/v1/session
 * Initializes a recording session and returns session token
 */
export function getSessionHandler(sessionService: SessionService) {
  return async (c: Context<AppEnv>) => {
    try {
      // Parse and validate query params
      const queryParams = c.req.query();
      const parsed = getSessionQuerySchema.parse(queryParams);

      // Initialize session with link token
      const result = await sessionService.initSession(parsed.token);

      // Set response headers for token expiry
      c.header(RESPONSE_HEADERS.SESSION_TOKEN_EXPIRES_IN, String(result.expiresIn));
      c.header(
        RESPONSE_HEADERS.SESSION_TOKEN_EXPIRES_AT,
        new Date(Date.now() + result.expiresIn * 1000).toISOString()
      );

      const response: ApiResponse<SessionInitData> = {
        message: 'Session initialized successfully',
        data: {
          sessionToken: result.sessionToken,
          expiresIn: result.expiresIn,
        },
      };

      return c.json(response, 200);
    } catch (error) {
      // 400 - Bad Request: Invalid parameters
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request parameters',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      // 400 - Validation Error: Business rule violation
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: error.message,
        };
        return c.json(response, 400);
      }

      // 404 - Not Found: Link doesn't exist
      if (error instanceof NotFoundError) {
        const response: ApiErrorResponse = {
          error: 'Not Found',
          message: error.message,
        };
        return c.json(response, 404);
      }

      // 409 - Conflict: Link already used (single-use)
      if (error instanceof ConflictError) {
        const response: ApiErrorResponse = {
          error: 'Conflict',
          message: error.message,
        };
        return c.json(response, 409);
      }

      // 410 - Gone: Link was deleted
      if (error instanceof GoneError) {
        const response: ApiErrorResponse = {
          error: 'Gone',
          message: error.message,
        };
        return c.json(response, 410);
      }

      // Fallback for other AppError types
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      // 500 - Internal Server Error: Unexpected error
      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

/**
 * Handler factory for POST /api/v1/session
 * Initializes upload with presigned URLs
 *
 * Headers:
 * - x-session-token (required): Valid session token from GET /api/v1/session
 */
export function initUploadHandler(sessionService: SessionService) {
  return async (c: Context<AppEnv>) => {
    try {
      // Get session token from x-session-token header
      const sessionToken = c.req.header(REQUEST_HEADERS.SESSION_TOKEN);
      if (!sessionToken) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: `Session token required in ${REQUEST_HEADERS.SESSION_TOKEN} header`,
        };
        return c.json(response, 401);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const parsed = initUploadSchema.parse(body);

      // Map files to expected format
      const files = parsed.files.map((f) => ({
        type: f.type,
        name: f.name,
        size: f.size,
        mime_type: f.mime_type,
      }));

      // Initialize upload with client metadata
      const result = await sessionService.initUpload(
        sessionToken,
        parsed.recording_duration,
        files,
        parsed.metadata
      );

      // Set response headers for token expiry
      c.header(RESPONSE_HEADERS.UPLOAD_TOKEN_EXPIRES_IN, String(result.uploadTokenExpiresIn));
      c.header(
        RESPONSE_HEADERS.UPLOAD_TOKEN_EXPIRES_AT,
        new Date(Date.now() + result.uploadTokenExpiresIn * 1000).toISOString()
      );
      c.header(
        RESPONSE_HEADERS.PRESIGNED_URL_EXPIRES_IN,
        String(SESSION_CONSTRAINTS.PRESIGNED_URL_EXPIRY)
      );

      // Set header for excluded files if any (format: type1|type2|...)
      if (result.excludedFiles.length > 0) {
        const excludedTypes = result.excludedFiles.map((f) => f.type).join('|');
        c.header(RESPONSE_HEADERS.EXCLUDED, excludedTypes);
      }

      const response: ApiResponse<UploadInitData> = {
        message:
          result.excludedFiles.length > 0
            ? `Upload initialized with ${result.excludedFiles.length} file(s) excluded`
            : 'Upload initialized successfully',
        data: {
          recordingId: result.recordingId,
          uploadToken: result.uploadToken,
          presignedUrls: result.presignedUrls,
        },
      };

      return c.json(response, 200);
    } catch (error) {
      // 400 - Bad Request: Invalid JSON or schema validation failed
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      // 400 - Validation Error: Business rule violation (file type, size, MIME, etc.)
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: error.message,
        };
        return c.json(response, 400);
      }

      // 401 - Unauthorized: Invalid or expired session token
      if (error instanceof ForbiddenError) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: error.message,
        };
        return c.json(response, 401);
      }

      // 404 - Not Found: Link doesn't exist
      if (error instanceof NotFoundError) {
        const response: ApiErrorResponse = {
          error: 'Not Found',
          message: error.message,
        };
        return c.json(response, 404);
      }

      // 409 - Conflict: Link already used (single-use)
      if (error instanceof ConflictError) {
        const response: ApiErrorResponse = {
          error: 'Conflict',
          message: error.message,
        };
        return c.json(response, 409);
      }

      // 410 - Gone: Link was deleted
      if (error instanceof GoneError) {
        const response: ApiErrorResponse = {
          error: 'Gone',
          message: error.message,
        };
        return c.json(response, 410);
      }

      // Fallback for other AppError types
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      // 500 - Internal Server Error: Unexpected error
      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

/**
 * Handler factory for PATCH /api/v1/session
 * Marks upload as available
 *
 * Headers:
 * - x-upload-token (required): Valid upload token from POST /api/v1/session
 */
export function completeUploadHandler(sessionService: SessionService) {
  return async (c: Context<AppEnv>) => {
    try {
      // Get upload token from x-upload-token header
      const uploadToken = c.req.header(REQUEST_HEADERS.UPLOAD_TOKEN);
      if (!uploadToken) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: `Upload token required in ${REQUEST_HEADERS.UPLOAD_TOKEN} header`,
        };
        return c.json(response, 401);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const parsed = completeUploadSchema.parse(body);

      // Get remaining token time and add to response headers
      const remainingTime = sessionService.getUploadTokenRemainingTime(uploadToken);
      if (remainingTime !== null) {
        c.header(RESPONSE_HEADERS.UPLOAD_TOKEN_REMAINING, String(remainingTime));
      }

      // Mark upload as available
      const result = await sessionService.markAsAvailable(uploadToken, parsed.recording_id);

      const response: ApiResponse<UploadCompleteData> = {
        message: 'Recording available',
        data: {
          success: result.success,
          recordingId: result.recordingId,
          status: result.status,
        },
      };

      return c.json(response, 200);
    } catch (error) {
      // 400 - Bad Request: Invalid JSON or schema validation failed
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      // 400 - Validation Error: File verification failed
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: error.message,
        };
        return c.json(response, 400);
      }

      // 401 - Unauthorized: Invalid or expired upload token
      // Note: Token expiry is 401, not 403
      if (error instanceof ForbiddenError && error.message.includes('expired')) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: error.message,
        };
        return c.json(response, 401);
      }

      // 403 - Forbidden: Recording ID mismatch, wrong link, etc.
      if (error instanceof ForbiddenError) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: error.message,
        };
        return c.json(response, 403);
      }

      // 404 - Not Found: Recording or link doesn't exist
      if (error instanceof NotFoundError) {
        const response: ApiErrorResponse = {
          error: 'Not Found',
          message: error.message,
        };
        return c.json(response, 404);
      }

      // 409 - Conflict: Already in terminal state
      if (error instanceof ConflictError) {
        const response: ApiErrorResponse = {
          error: 'Conflict',
          message: error.message,
        };
        return c.json(response, 409);
      }

      // 410 - Gone: Recording or link was deleted
      if (error instanceof GoneError) {
        const response: ApiErrorResponse = {
          error: 'Gone',
          message: error.message,
        };
        return c.json(response, 410);
      }

      // Fallback for other AppError types
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      // 500 - Internal Server Error: Unexpected error
      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}
