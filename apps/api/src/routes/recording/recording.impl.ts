/**
 * Recording contract implementation using oRPC
 * Implements the recording contract defined in @workspace/contract
 */

import { ORPCError } from '@orpc/server';
import { authorized } from '@/api/middleware/auth.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { RecordingService } from '@/api/services/recording.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import { z } from 'zod';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { createPaginationMeta } from '@/api/types';

/**
 * GET /workspace/:workspaceId/recordings - List recordings
 * Requires workspace member
 */
export const getRecordingsImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.list
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const filters = {
          createdBy: input.created_by,
          projectId: input.project_id,
          linkId: input.link_id,
        };

        const sort = {
          field: input.sort_by || 'created_at',
          direction: input.sort_direction || 'desc',
        };

        const { recordings, total } = await recordingService.getByWorkspaceIdPaginated(
          input.workspaceId,
          input.page || 1,
          input.per_page || 10,
          filters,
          sort as any
        );

        return {
          message: 'Recordings retrieved successfully',
          data: {
            workspaceId: input.workspaceId,
            recordings,
            pagination: createPaginationMeta(input.page || 1, input.per_page || 10, total),
          },
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * GET /workspace/:workspaceId/recordings/:recordingId - Get recording by ID
 * Requires workspace member
 */
export const getRecordingByIdImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.getById
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const recording = await recordingService.getById(input.recordingId, input.workspaceId);

        return {
          message: 'Recording retrieved successfully',
          data: {
            workspaceId: input.workspaceId,
            recording,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * DELETE /workspace/:workspaceId/recordings/:recordingId - Delete recording
 * Requires workspace member
 */
export const deleteRecordingImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.delete
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input, context }) => {
      try {
        await recordingService.delete(input.recordingId, input.workspaceId);

        return {
          message: 'Recording deleted successfully',
          data: {
            workspaceId: input.workspaceId,
            recordingId: input.recordingId,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/video - Get recording video
 * Requires workspace member
 */
export const getRecordingVideoImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.resources.video
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const resource = await recordingService.getVideoResource(
          input.recordingId,
          input.workspaceId
        );

        return {
          message: 'Recording video URL retrieved successfully',
          data: {
            recordingId: input.recordingId,
            resource,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/thumbnail - Get recording thumbnail
 * Requires workspace member
 */
export const getRecordingThumbnailImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.resources.thumbnail
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const resource = await recordingService.getThumbnailResource(
          input.recordingId,
          input.workspaceId
        );

        return {
          message: 'Recording thumbnail URL retrieved successfully',
          data: {
            recordingId: input.recordingId,
            resource,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/console-log - Get recording console log
 * Requires workspace member
 */
export const getRecordingConsoleLogImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.resources.consoleLog
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const resource = await recordingService.getConsoleLogResource(
          input.recordingId,
          input.workspaceId
        );

        return {
          message: 'Recording console log URL retrieved successfully',
          data: {
            recordingId: input.recordingId,
            resource,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/network-log - Get recording network log
 * Requires workspace member
 */
export const getRecordingNetworkLogImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.resources.networkLog
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const resource = await recordingService.getNetworkLogResource(
          input.recordingId,
          input.workspaceId
        );

        return {
          message: 'Recording network log URL retrieved successfully',
          data: {
            recordingId: input.recordingId,
            resource,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * Create the recording procedures object
 */
export const createRecordingProcedures = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  return {
    list: getRecordingsImpl(recordingService, workspaceMemberService, workspaceService),
    getById: getRecordingByIdImpl(recordingService, workspaceMemberService, workspaceService),
    delete: deleteRecordingImpl(recordingService, workspaceMemberService, workspaceService),
    resources: {
      video: getRecordingVideoImpl(recordingService, workspaceMemberService, workspaceService),
      thumbnail: getRecordingThumbnailImpl(
        recordingService,
        workspaceMemberService,
        workspaceService
      ),
      consoleLog: getRecordingConsoleLogImpl(
        recordingService,
        workspaceMemberService,
        workspaceService
      ),
      networkLog: getRecordingNetworkLogImpl(
        recordingService,
        workspaceMemberService,
        workspaceService
      ),
    },
  };
};
