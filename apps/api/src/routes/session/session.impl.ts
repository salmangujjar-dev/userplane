/**
 * Session contract implementation using oRPC
 * Implements the session contract defined in @userplane/contract
 */
import { implement } from '@orpc/server';
import { parseLinkProviderData, sessionContract, sessionError } from '@userplane/contract';

import { REQUEST_HEADERS } from '@/api/constants/headers';
import { createLogger } from '@/api/lib/logger';
import type { InitialContext } from '@/api/middleware/auth.orpc';
import { captureException } from '@/api/posthog';
import type { RecordingRepository } from '@/api/repositories/recordings.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { IntercomNotificationService } from '@/api/services/intercom-notification.service';
import type { NotificationService } from '@/api/services/notification.service';
import type { SessionService } from '@/api/services/session.service';
import type { ZendeskNotificationService } from '@/api/services/zendesk-notification.service';
import { emailUrls } from '@/api/utils/email-urls';

/**
 * Create the implementer from the session contract with initial context
 */
const os = implement(sessionContract).$context<InitialContext>();

/**
 * Create a logger for session routes
 */
const sessionLogger = createLogger('session');

/**
 * Middleware to extract and validate x-session-token header
 */
const requireSessionToken = os.middleware(async ({ context, next }) => {
  const sessionToken = context.headers.get(REQUEST_HEADERS.SESSION_TOKEN);

  if (!sessionToken) {
    throw sessionError.SESSION_TOKEN_MISSING();
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
    throw sessionError.UPLOAD_TOKEN_MISSING();
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
    const result = await sessionService.initSession(input.query['userplane-token']);

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
      input.body.metadata,
      input.body.recording_started_at
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
 * Send post-upload notifications for a completed recording.
 * - Email to the recording creator
 * - Admin note to Intercom conversation (if link originated from Intercom)
 */
async function sendRecordingNotifications(
  recordingId: string,
  deps: {
    recordingRepo: RecordingRepository;
    workspaceMemberRepo: WorkspaceMemberRepository;
    notificationService: NotificationService;
    intercomNotificationService: IntercomNotificationService;
    zendeskNotificationService: ZendeskNotificationService;
  }
): Promise<void> {
  const recording = await deps.recordingRepo.findByIdWithDetailsAndStatusGroup(
    recordingId,
    'AVAILABLE'
  );

  if (!recording) {
    sessionLogger.error({ recordingId }, 'Recording not available post upload notifications');
    return;
  }

  // Email notification to the recording creator
  const creator = await deps.workspaceMemberRepo.findByIdWithUser(recording.creatorId);
  if (creator) {
    await deps.notificationService.sendSafeRecordingReceived(
      recording.workspaceId,
      { to: creator.userEmail },
      {
        workspaceId: recording.workspaceId,
        recordingId: recording.recordingId,
      }
    );
  }

  // Admin note to Intercom conversation if link originated from Intercom
  if (recording.linkProviderType === 'intercom' && recording.linkProviderId) {
    const providerData = parseLinkProviderData('intercom', recording.linkProviderData);
    if (providerData?.adminId) {
      const recordingUrl = emailUrls.recording.view(recording.workspaceId, recording.recordingId);
      await deps.intercomNotificationService.notifyRecordingReceived({
        workspaceId: recording.workspaceId,
        conversationId: recording.linkProviderId,
        adminId: providerData.adminId,
        recordingId: recording.recordingId,
        recordingUrl,
      });
    }
  }

  // Internal note on Zendesk ticket if link originated from Zendesk
  if (recording.linkProviderType === 'zendesk' && recording.linkProviderId) {
    const recordingUrl = emailUrls.recording.view(recording.workspaceId, recording.recordingId);
    await deps.zendeskNotificationService.notifyRecordingReceived({
      workspaceId: recording.workspaceId,
      ticketId: recording.linkProviderId,
      recordingId: recording.recordingId,
      recordingUrl,
    });
  }
}

/**
 * PATCH /session - Mark upload as available
 * Requires upload token from initUpload
 * Service throws ORPCError directly, no error mapping needed
 * Sends post-upload notifications (email + provider-specific)
 */
export const completeUploadImpl = (
  sessionService: SessionService,
  recordingRepo: RecordingRepository,
  workspaceMemberRepo: WorkspaceMemberRepository,
  notificationService: NotificationService,
  intercomNotificationService: IntercomNotificationService,
  zendeskNotificationService: ZendeskNotificationService
) => {
  return os.upload.complete.use(requireUploadToken).handler(async ({ input, context }) => {
    const result = await sessionService.markAsAvailable(
      context.uploadToken,
      input.body.recording_id
    );

    // Only send notifications on the first successful transition to available,
    // not on idempotent replays, to avoid duplicate emails and provider messages
    if (result.created) {
      try {
        await sendRecordingNotifications(result.recordingId, {
          recordingRepo,
          workspaceMemberRepo,
          notificationService,
          intercomNotificationService,
          zendeskNotificationService,
        });
      } catch (error) {
        sessionLogger.error({ err: error }, 'Error sending recording notifications');
        captureException(error);
      }
    }

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
export const createSessionProcedures = (
  sessionService: SessionService,
  recordingRepo: RecordingRepository,
  workspaceMemberRepo: WorkspaceMemberRepository,
  notificationService: NotificationService,
  intercomNotificationService: IntercomNotificationService,
  zendeskNotificationService: ZendeskNotificationService
) => {
  return {
    init: getSessionImpl(sessionService),
    upload: {
      init: initUploadImpl(sessionService),
      complete: completeUploadImpl(
        sessionService,
        recordingRepo,
        workspaceMemberRepo,
        notificationService,
        intercomNotificationService,
        zendeskNotificationService
      ),
    },
  };
};
