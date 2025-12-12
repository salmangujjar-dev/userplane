/**
 * Links routes - HTTP routes for link operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { requireWorkspaceMember } from '@/api/middleware/workspace';
import {
  getLinksHandler,
  createLinkHandler,
  updateLinkHandler,
  deleteLinkHandler,
} from '@/api/handlers/links.handlers';
import type { LinkService } from '@/api/services/link.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';

export function createLinksRoutes(
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) {
  const linksRoutes = new Hono<AppEnv>();

  // GET /workspace/:workspaceId/links - List links with pagination and filters
  // Query params: page, per_page, created_by (comma-separated), project_id, domain_id (comma-separated), link_provider_type (comma-separated)
  linksRoutes.get(
    '/',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getLinksHandler(linkService)
  );

  // POST /workspace/:workspaceId/links - Create a link
  // Body: { projectId?, domainId, linkReference?, linkReusable? }
  // If projectId is not provided, uses workspace's default project
  // If linkReference is not provided, uses "{firstName}'s Recording Link"
  linksRoutes.post(
    '/',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    createLinkHandler(linkService)
  );

  // PUT /workspace/:workspaceId/links/:linkId - Update a link
  // Body: { linkTitle?, linkReusable?, linkProviderType?, linkProviderId?, linkProviderRef? }
  linksRoutes.put(
    '/:linkId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateLinkHandler(linkService)
  );

  // DELETE /workspace/:workspaceId/links/:linkId - Delete a link
  // Performs soft delete
  linksRoutes.delete(
    '/:linkId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    deleteLinkHandler(linkService)
  );

  return linksRoutes;
}
