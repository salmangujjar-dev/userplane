/**
 * Session contract implementation using oRPC
 * Implements the session contract defined in @workspace/contract
 */

import { implement, ORPCError } from '@orpc/server';
import { sessionContract } from '@workspace/contract';
import type { SessionService } from '@/api/services/session.service';
import { REQUEST_HEADERS } from '@/api/constants/headers';
import type { InitialContext } from '@/api/middleware/auth.orpc';

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
 * Service throws ORPCError directly, no error mapping needed
 */
export const getSessionImpl = (sessionService: SessionService) => {
  return os.init.handler(async ({ input }) => {
    const result = await sessionService.initSession(input.query.token);

    return {
      message: 'Session initialized successfully',
      data: {
        sessionToken: result.sessionToken,
        expiresIn: result.expiresIn,
      },
    };
  });
};

/**
 * POST /session - Initialize upload with presigned URLs
 * Requires session token from previous step
 * Service throws ORPCError directly, no error mapping needed
 */
export const initUploadImpl = (sessionService: SessionService) => {
  return os.upload.init.use(requireSessionToken).handler(async ({ input, context }) => {
    const files = input.body.files.map((f) => ({
      type: f.type,
      name: f.name,
      size: f.size,
      mime_type: f.mime_type,
    }));

    const result = await sessionService.initUpload(
      context.sessionToken,
      input.body.recording_duration,
      files,
      input.body.metadata
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
  });
};

/**
 * PATCH /session - Mark upload as available
 * Requires upload token from initUpload
 * Service throws ORPCError directly, no error mapping needed
 */
export const completeUploadImpl = (sessionService: SessionService) => {
  return os.upload.complete.use(requireUploadToken).handler(async ({ input, context }) => {
    const result = await sessionService.markAsAvailable(
      context.uploadToken,
      input.body.recording_id
    );

    return {
      message: 'Recording available',
      data: {
        success: result.success,
        recordingId: result.recordingId,
        status: result.status,
      },
    };
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
