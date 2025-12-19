/**
 * Session contract implementation using oRPC
 * Implements the session contract defined in @workspace/contract
 */

import { implement, ORPCError } from '@orpc/server';
import { sessionContract } from '@workspace/contract';
import type { SessionService } from '@/api/services/session.service';
import { z } from 'zod';
import {
  ValidationError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
  GoneError,
} from '@/api/lib/errors';
import { REQUEST_HEADERS } from '@/api/constants/headers';

/**
 * Initial context type - required dependencies passed from HTTP adapter
 */
type InitialContext = {
  headers: Headers;
};

/**
 * Create the implementer from the session contract with initial context
 */
const os = implement(sessionContract).$context<InitialContext>();

/**
 * Middleware to extract and validate x-session-token header
 */
const requireSessionToken = os.middleware(async ({ context, next }) => {
  const sessionToken = context.headers.get(REQUEST_HEADERS.SESSION_TOKEN);

  if (!sessionToken) {
    throw new ORPCError('UNAUTHORIZED', {
      message: `Session token required in ${REQUEST_HEADERS.SESSION_TOKEN} header`,
    });
  }

  return next({
    context: {
      sessionToken,
    },
  });
});

/**
 * Middleware to extract and validate x-upload-token header
 */
const requireUploadToken = os.middleware(async ({ context, next }) => {
  const uploadToken = context.headers.get(REQUEST_HEADERS.UPLOAD_TOKEN);

  if (!uploadToken) {
    throw new ORPCError('UNAUTHORIZED', {
      message: `Upload token required in ${REQUEST_HEADERS.UPLOAD_TOKEN} header`,
    });
  }

  return next({
    context: {
      uploadToken,
    },
  });
});

/**
 * GET /session - Initialize recording session
 * Converts link token to session token
 */
export const getSessionImpl = (sessionService: SessionService) => {
  return os.init.handler(async ({ input }) => {
    try {
      const result = await sessionService.initSession(input.token);

      return {
        message: 'Session initialized successfully',
        data: {
          sessionToken: result.sessionToken,
          expiresIn: result.expiresIn,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid request parameters',
        });
      }
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof ConflictError) {
        throw new ORPCError('CONFLICT', {
          message: error.message,
        });
      }
      if (error instanceof GoneError) {
        throw new ORPCError('GONE', {
          status: 410,
          message: error.message,
        });
      }
      throw error;
    }
  });
};

/**
 * POST /session - Initialize upload with presigned URLs
 * Requires session token from previous step
 */
export const initUploadImpl = (sessionService: SessionService) => {
  return os.upload.init.use(requireSessionToken).handler(async ({ input, context }) => {
    try {
      const files = input.files.map((f) => ({
        type: f.type,
        name: f.name,
        size: f.size,
        mime_type: f.mime_type,
      }));

      const result = await sessionService.initUpload(
        context.sessionToken,
        input.recording_duration,
        files,
        input.metadata
      );

      const message =
        result.excludedFiles.length > 0
          ? `Upload initialized with ${result.excludedFiles.length} file(s) excluded`
          : 'Upload initialized successfully';

      return {
        message,
        data: {
          recordingId: result.recordingId,
          uploadToken: result.uploadToken,
          presignedUrls: result.presignedUrls,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid request body',
        });
      }
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof ForbiddenError) {
        throw new ORPCError('FORBIDDEN', {
          message: error.message,
        });
      }
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof ConflictError) {
        throw new ORPCError('CONFLICT', {
          message: error.message,
        });
      }
      if (error instanceof GoneError) {
        throw new ORPCError('GONE', {
          status: 410,
          message: error.message,
        });
      }
      throw error;
    }
  });
};

/**
 * PATCH /session - Mark upload as available
 * Requires upload token from initUpload
 */
export const completeUploadImpl = (sessionService: SessionService) => {
  return os.upload.complete.use(requireUploadToken).handler(async ({ input, context }) => {
    try {
      const result = await sessionService.markAsAvailable(context.uploadToken, input.recording_id);

      return {
        message: 'Recording available',
        data: {
          success: result.success,
          recordingId: result.recordingId,
          status: result.status,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid request body',
        });
      }
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof ForbiddenError) {
        throw new ORPCError('FORBIDDEN', {
          message: error.message,
        });
      }
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof ConflictError) {
        throw new ORPCError('CONFLICT', {
          message: error.message,
        });
      }
      if (error instanceof GoneError) {
        throw new ORPCError('GONE', {
          status: 410,
          message: error.message,
        });
      }
      throw error;
    }
  });
};

/**
 * Create the session procedures object
 * This exports the implemented procedures for the session endpoints
 * These can be combined with other implementations to form the complete API router
 */
export const createSessionProcedures = (sessionService: SessionService) => {
  return {
    init: getSessionImpl(sessionService),
    upload: {
      init: initUploadImpl(sessionService),
      complete: completeUploadImpl(sessionService),
    },
  };
};
