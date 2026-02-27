/**
 * Share contract implementation using oRPC
 * Implements public share link generation and viewing
 */

import { implement } from '@orpc/server';
import { contract, shareError } from '@workspace/contract';

import { createLogger } from '@/api/lib/logger';
import type { InitialContext } from '@/api/middleware/auth.orpc';
import { authorizedRateLimited } from '@/api/middleware/rate-limit.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { RecordingService } from '@/api/services/recording.service';
import type { TokenService } from '@/api/services/token.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';

const logger = createLogger('share');

/**
 * POST /workspace/:workspaceId/recordings/:recordingId/share-token
 * Generate a public share token for a recording
 * Requires authenticated workspace member
 */
export const generateShareTokenImpl = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  tokenService: TokenService,
  dashboardUrl: string
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.share.generateToken
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const { workspaceId, recordingId } = input.params;
      const { expiresInSeconds } = input.body;

      // Verify recording exists and is available (throws RECORDING_NOT_FOUND or RECORDING_GONE)
      await recordingService.getById(recordingId, workspaceId);

      const { token, expiresAt } = tokenService.signShareToken(
        {
          rid: recordingId,
          wid: workspaceId,
          wmid: context.workspaceMemberId,
        },
        expiresInSeconds
      );

      const shareUrl = `${dashboardUrl}/share/recording?token=${token}`;

      logger.debug({ workspaceId, recordingId, expiresAt }, 'Share token generated');

      return {
        message: 'Share token generated successfully',
        data: {
          shareUrl,
          expiresAt,
        },
      };
    });
};

/**
 * Public base for share endpoints (no auth required)
 */
const base = implement(contract).$context<InitialContext>();

/**
 * GET /share/recording?token=<jwt>
 * View a shared recording using a public share token
 * Public endpoint - no authentication required
 */
export const viewSharedRecordingImpl = (
  recordingService: RecordingService,
  workspaceMemberRepo: WorkspaceMemberRepository,
  tokenService: TokenService
) => {
  return base.share.view.handler(async ({ input }) => {
    const { token } = input.query;

    // Verify the share token
    const result = tokenService.verifyShareToken(token);

    if (result.expired) {
      throw shareError.SHARE_TOKEN_EXPIRED();
    }

    if (!result.payload) {
      throw shareError.SHARE_TOKEN_INVALID();
    }

    const { rid, wid, wmid } = result.payload;

    // Fetch recording detail (throws appropriate errors if not found/deleted)
    let recording;
    try {
      recording = await recordingService.getById(rid, wid);
    } catch {
      // Map recording errors to share-specific errors
      throw shareError.RECORDING_NOT_FOUND();
    }

    // Fetch all resources in parallel
    const [video, thumbnail, consoleLog, networkLog, action] = await Promise.all([
      recordingService.getVideoResource(rid, wid),
      recordingService.getThumbnailResource(rid, wid),
      recordingService.getConsoleLogResource(rid, wid),
      recordingService.getNetworkLogResource(rid, wid),
      recordingService.getActionResource(rid, wid),
    ]);

    // Get sharer info
    const sharer = await workspaceMemberRepo.findByIdWithUser(wmid);
    const sharerName = sharer?.userName || 'A team member';

    logger.debug({ recordingId: rid, workspaceId: wid }, 'Shared recording viewed');

    return {
      message: 'Shared recording retrieved successfully',
      data: {
        recording,
        resources: {
          video,
          thumbnail,
          consoleLog,
          networkLog,
          action,
        },
        sharedBy: {
          name: sharerName,
        },
        expiresAt: new Date(result.payload.exp * 1000),
      },
    };
  });
};

/**
 * Create the share procedures object
 */
export const createShareProcedures = (
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceMemberRepo: WorkspaceMemberRepository,
  workspaceService: WorkspaceService,
  tokenService: TokenService,
  dashboardUrl: string
) => {
  return {
    generateToken: generateShareTokenImpl(
      recordingService,
      workspaceMemberService,
      workspaceService,
      tokenService,
      dashboardUrl
    ),
    view: viewSharedRecordingImpl(recordingService, workspaceMemberRepo, tokenService),
  };
};
