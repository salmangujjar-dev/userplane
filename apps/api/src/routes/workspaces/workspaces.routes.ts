/**
 * Workspace routes - HTTP routes for workspace operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { requireWorkspaceMember } from '@/api/middleware/workspace';
import { sendInvitesHandler } from '@/api/handlers/invites.handlers';
import { rotateInviteUrlHandler, getInviteUrlHandler } from '@/api/handlers/workspaces.handlers';
import {
  createProjectHandler,
  getProjectsHandler,
  setDefaultProjectHandler,
} from '@/api/handlers/projects.handlers';
import type { InviteService } from '@/api/services/invite.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { ProjectService } from '@/api/services/project.service';

export function createWorkspaceRoutes(
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  projectService: ProjectService
) {
  const workspaceRoutes = new Hono<AppEnv>();

  workspaceRoutes.post(
    '/:workspaceSlug/invites',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    sendInvitesHandler(inviteService)
  );

  workspaceRoutes.get(
    '/:workspaceSlug/invite-url',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getInviteUrlHandler(workspaceService, inviteService)
  );

  workspaceRoutes.post(
    '/:workspaceSlug/invite-url',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    rotateInviteUrlHandler(workspaceService)
  );

  // Project routes
  workspaceRoutes.get(
    '/:workspaceSlug/projects',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getProjectsHandler(projectService)
  );

  workspaceRoutes.post(
    '/:workspaceSlug/projects',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    createProjectHandler(projectService, workspaceService)
  );

  workspaceRoutes.post(
    '/:workspaceSlug/projects/:projectId/set-default',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    setDefaultProjectHandler(projectService)
  );

  return workspaceRoutes;
}
