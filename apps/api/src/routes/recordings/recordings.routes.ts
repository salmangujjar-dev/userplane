/**
 * Recordings routes - HTTP routes for recording operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { requireWorkspaceMember } from '@/api/middleware/workspace';
import {
  getRecordingsHandler,
  getRecordingByIdHandler,
  deleteRecordingHandler,
  getRecordingMediaHandler,
  getRecordingThumbnailHandler,
  getRecordingConsoleLogHandler,
  getRecordingNetworkLogHandler,
} from '@/api/handlers/recordings.handlers';
import type { RecordingService } from '@/api/services/recording.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';

export function createRecordingsRoutes(
  recordingService: RecordingService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) {
  const recordingsRoutes = new Hono<AppEnv>();

  // GET /workspace/:workspaceId/recordings - List recordings with pagination and filters
  // Query params: page, per_page, created_by, project_id, sort_by, sort_direction
  recordingsRoutes.get(
    '/',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getRecordingsHandler(recordingService)
  );

  // GET /workspace/:workspaceId/recordings/:recordingId - Get recording metadata
  recordingsRoutes.get(
    '/:recordingId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getRecordingByIdHandler(recordingService)
  );

  // GET /workspace/:workspaceId/recordings/:recordingId/media - Get media presigned URL
  recordingsRoutes.get(
    '/:recordingId/media',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getRecordingMediaHandler(recordingService)
  );

  // GET /workspace/:workspaceId/recordings/:recordingId/thumbnail - Get thumbnail presigned URL
  recordingsRoutes.get(
    '/:recordingId/thumbnail',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getRecordingThumbnailHandler(recordingService)
  );

  // GET /workspace/:workspaceId/recordings/:recordingId/console-log - Get console log presigned URL
  recordingsRoutes.get(
    '/:recordingId/console-log',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getRecordingConsoleLogHandler(recordingService)
  );

  // GET /workspace/:workspaceId/recordings/:recordingId/network-log - Get network log presigned URL
  recordingsRoutes.get(
    '/:recordingId/network-log',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getRecordingNetworkLogHandler(recordingService)
  );

  // DELETE /workspace/:workspaceId/recordings/:recordingId - Delete a recording
  recordingsRoutes.delete(
    '/:recordingId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    deleteRecordingHandler(recordingService)
  );

  return recordingsRoutes;
}
