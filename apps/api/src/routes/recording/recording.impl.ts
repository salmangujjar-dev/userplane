/**
 * Recording contract implementation using oRPC
 * Implements the recording contract defined in @userplane/contract
 */

import { billingError, recordingError } from '@userplane/contract';

import { authorizedRateLimited } from '@/api/middleware/rate-limit.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { BillingService } from '@/api/services/billing.service';
import type { EmailService } from '@/api/services/email.service';
import type { InviteService } from '@/api/services/invite.service';
import type { RecordingService } from '@/api/services/recording.service';
import type { TokenService } from '@/api/services/token.service';
import type { UserService } from '@/api/services/user.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { createPaginationMeta, type RecordingSortOptions } from '@/api/types';

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

  return authorizedRateLimited.recording.list
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const filters = {
        createdBy: input.query.created_by,
        projectId: input.query.project_id,
        linkId: input.query.link_id,
      };

      const sort: RecordingSortOptions = {
        field: input.query.sort_by || 'created_at',
        direction: input.query.sort_direction || 'desc',
      };

      const { recordings, total } = await recordingService.getByWorkspaceIdPaginated(
        input.params.workspaceId,
        input.query.page || 1,
        input.query.per_page || 10,
        filters,
        sort
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

  return authorizedRateLimited.recording.getById
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
 * Requires workspace member with admin/owner role OR creator of the recording
 */
export const deleteRecordingImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.recording.delete
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      // Fetch recording to check creator
      const recording = await recordingService.getById(
        input.params.recordingId,
        input.params.workspaceId
      );

      // Check permission: admin/owner OR creator
      const isAdminOrOwner = context.workspaceRole === 'admin' || context.workspaceRole === 'owner';
      const isCreator = recording.meta.creator.workspaceMemberId === context.workspaceMemberId;

      if (!isAdminOrOwner && !isCreator) {
        throw recordingError.RECORDING_DELETE_FORBIDDEN();
      }

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
 * PATCH /workspace/:workspaceId/recordings/:recordingId - Update recording
 * Requires workspace member
 */
export const updateRecordingImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.recording.update
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const expiresAt = input.body.expiresAt;

      const updated = await recordingService.updateExpiresAt(
        input.params.recordingId,
        input.params.workspaceId,
        expiresAt !== undefined ? expiresAt : null
      );

      return {
        message: 'Recording updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          recordingId: input.params.recordingId,
          expiresAt: updated.expiresAt,
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

  return authorizedRateLimited.recording.resources.video
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

  return authorizedRateLimited.recording.resources.thumbnail
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

  return authorizedRateLimited.recording.resources.consoleLog
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

  return authorizedRateLimited.recording.resources.networkLog
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

  return authorizedRateLimited.recording.resources.action
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
 * POST /workspace/:workspaceId/recordings/:recordingId/share - Share recording via email
 * Requires workspace member
 */
export const shareRecordingImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService,
  inviteService: InviteService,
  userService: UserService,
  tokenService: TokenService,
  billingService: BillingService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.recording.share
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const { workspaceId, recordingId } = input.params;
      const { emails } = input.body;

      const featureGates = await billingService.getFeatureGates(workspaceId);
      if (!featureGates.sendOutboundEmails) {
        throw billingError.PLAN_FEATURE_UNAVAILABLE({ feature: 'sendOutboundEmails' });
      }

      // Verify recording exists (throws RECORDING_NOT_FOUND or RECORDING_GONE)
      await recordingService.getById(recordingId, workspaceId);

      // Get sender info
      const sender = await userService.getById(context.user.id);
      const senderName = sender.name || sender.email;

      // Get workspace info for invite URL generation
      const workspace = await workspaceService.getById(workspaceId);
      const inviteToken = await workspaceService.getInviteToken(workspaceId);

      type ResultItem = { email: string; success: boolean; isMember: boolean };
      const sent: ResultItem[] = [];
      const failed: ResultItem[] = [];

      for (const email of emails) {
        try {
          // Check if user exists and is a workspace member
          const user = await userService.findByEmail(email);
          let isMember = false;

          if (user) {
            const member = await workspaceMemberService.getMember(user.id, workspaceId);
            isMember = !!member;
          }

          if (isMember) {
            // Send member email with direct recording link
            await emailService.sendSafeShareRecordingMember(
              { to: email },
              { senderName, workspaceId, recordingId }
            );
          } else {
            // Generate invite URL for non-members
            const inviteUrl = tokenService.generateInviteUrl({
              wi: workspace.workspaceId,
              wn: workspace.workspaceName,
              wt: inviteToken,
              in: sender.name,
              ie: sender.email,
            });

            // Send external email with invite + recording link
            await emailService.sendSafeShareRecordingExternal(
              { to: email },
              { senderName, inviteUrl, workspaceId, recordingId }
            );
          }

          sent.push({ email, success: true, isMember });
        } catch {
          failed.push({ email, success: false, isMember: false });
        }
      }

      return {
        message: 'Recording shared successfully',
        data: { sent, failed },
      };
    });
};

/**
 * Create the recording procedures object
 */
export const createRecordingProcedures = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  emailService: EmailService,
  inviteService: InviteService,
  userService: UserService,
  tokenService: TokenService,
  billingService: BillingService
) => {
  return {
    list: getRecordingsImpl(recordingService, workspaceMemberService, workspaceService),
    getById: getRecordingByIdImpl(recordingService, workspaceMemberService, workspaceService),
    update: updateRecordingImpl(recordingService, workspaceMemberService, workspaceService),
    delete: deleteRecordingImpl(recordingService, workspaceMemberService, workspaceService),
    share: shareRecordingImpl(
      recordingService,
      workspaceMemberService,
      workspaceService,
      emailService,
      inviteService,
      userService,
      tokenService,
      billingService
    ),
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
