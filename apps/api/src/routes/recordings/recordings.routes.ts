/**
 * Recordings routes - HTTP routes for recording operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { requireWorkspaceMember } from '@/api/middleware/workspace';
import { getRecordingsHandler, deleteRecordingHandler } from '@/api/handlers/recordings.handlers';
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

  // DELETE /workspace/:workspaceId/recordings/:recordingId - Delete a recording
  // Performs soft delete
  recordingsRoutes.delete(
    '/:recordingId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    deleteRecordingHandler(recordingService)
  );

  return recordingsRoutes;
}
