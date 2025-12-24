/**
 * Recording contract implementation using oRPC
 * Implements the recording contract defined in @workspace/contract
 */

import { authorized } from '@/api/middleware/auth.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { RecordingService } from '@/api/services/recording.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
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
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const filters = {
        createdBy: input.query.created_by,
        projectId: input.query.project_id,
        linkId: input.query.link_id,
      };

      const sort = {
        field: input.query.sort_by || 'created_at',
        direction: input.query.sort_direction || 'desc',
      };

      const { recordings, total } = await recordingService.getByWorkspaceIdPaginated(
        input.params.workspaceId,
        input.query.page || 1,
        input.query.per_page || 10,
        filters,
        sort as any
      );

      return {
        message: 'Recordings retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          recordings,
          pagination: createPaginationMeta(
            input.query.page || 1,
            input.query.per_page || 10,
            total
          ),
        },
      };
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
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const recording = await recordingService.getById(
        input.params.recordingId,
        input.params.workspaceId
      );

      return {
        message: 'Recording retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          recording,
        },
      };
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
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      await recordingService.delete(input.params.recordingId, input.params.workspaceId);

      return {
        message: 'Recording deleted successfully',
        data: {
          workspaceId: input.params.workspaceId,
          recordingId: input.params.recordingId,
        },
      };
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
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getVideoResource(
        input.params.recordingId,
        input.params.workspaceId
      );

      return {
        message: 'Recording video URL retrieved successfully',
        data: {
          recordingId: input.params.recordingId,
          resource,
        },
      };
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
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getThumbnailResource(
        input.params.recordingId,
        input.params.workspaceId
      );

      return {
        message: 'Recording thumbnail URL retrieved successfully',
        data: {
          recordingId: input.params.recordingId,
          resource,
        },
      };
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
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getConsoleLogResource(
        input.params.recordingId,
        input.params.workspaceId
      );

      return {
        message: 'Recording console log URL retrieved successfully',
        data: {
          recordingId: input.params.recordingId,
          resource,
        },
      };
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
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getNetworkLogResource(
        input.params.recordingId,
        input.params.workspaceId
      );

      return {
        message: 'Recording network log URL retrieved successfully',
        data: {
          recordingId: input.params.recordingId,
          resource,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/recordings/:recordingId/action - Get recording client action
 * Requires workspace member
 */
export const getRecordingActionImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.recording.resources.action
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getActionResource(
        input.params.recordingId,
        input.params.workspaceId
      );

      return {
        message: 'Recording client action URL retrieved successfully',
        data: {
          recordingId: input.params.recordingId,
          resource,
        },
      };
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
      action: getRecordingActionImpl(recordingService, workspaceMemberService, workspaceService),
    },
  };
};
