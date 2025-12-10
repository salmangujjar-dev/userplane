/**
 * Recording links routes - HTTP routes for recording link operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { requireWorkspaceMember } from '@/api/middleware/workspace';
import {
  getRecordingLinksHandler,
  createRecordingLinkHandler,
  updateRecordingLinkHandler,
  deleteRecordingLinkHandler,
} from '@/api/handlers/recording-links.handlers';
import type { RecordingLinkService } from '@/api/services/recording-link.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';

export function createRecordingLinksRoutes(
  recordingLinkService: RecordingLinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) {
  const recordingLinksRoutes = new Hono<AppEnv>();

  // GET /workspace/:workspaceId/recording-links - List recording links with pagination and filters
  // Query params: page, per_page, created_by, project_id, domain_id, link_provider_type
  recordingLinksRoutes.get(
    '/',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getRecordingLinksHandler(recordingLinkService)
  );

  // POST /workspace/:workspaceId/recording-links - Create a recording link
  // Body: { projectId?, domainId, linkReference?, linkReusable? }
  // If projectId is not provided, uses workspace's default project
  // If linkReference is not provided, uses "{firstName}'s Recording Link"
  recordingLinksRoutes.post(
    '/',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    createRecordingLinkHandler(recordingLinkService)
  );

  // PUT /workspace/:workspaceId/recording-links/:recordingLinkId - Update a recording link
  // Body: { linkTitle?, linkReusable?, linkProviderType?, linkProviderId?, linkProviderRef? }
  recordingLinksRoutes.put(
    '/:recordingLinkId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateRecordingLinkHandler(recordingLinkService)
  );

  // DELETE /workspace/:workspaceId/recording-links/:recordingLinkId - Delete a recording link
  // Performs soft delete
  recordingLinksRoutes.delete(
    '/:recordingLinkId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    deleteRecordingLinkHandler(recordingLinkService)
  );

  return recordingLinksRoutes;
}
