/**
 * Workspace routes - HTTP routes for workspace operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { requireWorkspaceMember, requireWorkspaceRole } from '@/api/middleware/workspace';
import { sendInvitesHandler } from '@/api/handlers/invite.handlers';
import {
  inviteActionHandler,
  getAllWorkspacesHandler,
  getWorkspaceByIdHandler,
  getWorkspacePreferencesHandler,
  updateWorkspacePreferencesHandler,
  getWorkspaceTeamHandler,
  updateMemberRoleHandler,
  removeMemberHandler,
  leaveWorkspaceHandler,
  updateNotificationPreferencesHandler,
  getWorkspaceDomainsHandler,
  addDomainHandler,
} from '@/api/handlers/workspace.handlers';
import {
  createProjectHandler,
  getProjectsHandler,
  updateProjectHandler,
  replaceProjectHandler,
} from '@/api/handlers/projects.handlers';
import type { InviteService } from '@/api/services/invite.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { ProjectService } from '@/api/services/project.service';
import type { DomainService } from '@/api/services/domain.service';

export function createWorkspaceRoutes(
  inviteService: InviteService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService,
  projectService: ProjectService,
  domainService: DomainService
) {
  const workspaceRoutes = new Hono<AppEnv>();

  // Get all workspaces for authenticated user
  workspaceRoutes.get('/', requireAuth, getAllWorkspacesHandler(workspaceService));

  // Get specific workspace by ID - returns basic info only
  workspaceRoutes.get('/:id', requireAuth, getWorkspaceByIdHandler(workspaceService));

  // Get workspace preferences - returns recording settings
  workspaceRoutes.get(
    '/:id/preferences',
    requireAuth,
    getWorkspacePreferencesHandler(workspaceService)
  );

  // Update workspace preferences - updates recording settings
  workspaceRoutes.patch(
    '/:workspaceId/preferences',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateWorkspacePreferencesHandler(workspaceService)
  );

  // Get workspace team - returns team members and invite token
  workspaceRoutes.get(
    '/:id/team',
    requireAuth,
    getWorkspaceTeamHandler(workspaceService, workspaceMemberService)
  );

  // Update team member role - requires admin or owner
  workspaceRoutes.patch(
    '/:workspaceId/team/:workspaceMemberId',
    requireAuth,
    requireWorkspaceRole(workspaceMemberService, workspaceService, ['admin', 'owner']),
    updateMemberRoleHandler(workspaceMemberService)
  );

  // Remove team member - requires admin or owner
  workspaceRoutes.delete(
    '/:workspaceId/team/:workspaceMemberId',
    requireAuth,
    requireWorkspaceRole(workspaceMemberService, workspaceService, ['admin', 'owner']),
    removeMemberHandler(workspaceMemberService)
  );

  // Leave workspace - member removes themselves
  workspaceRoutes.post(
    '/:workspaceId/leave',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    leaveWorkspaceHandler(workspaceMemberService)
  );

  // Update notification preferences - member updates their own preferences
  workspaceRoutes.patch(
    '/:workspaceId/notifications',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateNotificationPreferencesHandler(workspaceMemberService)
  );

  // Invite routes - unified endpoint with action query parameter
  // GET /workspace/:id/invite?action=get (default) - Get current invite URL
  // GET /workspace/:id/invite?action=rotate - Rotate token and get new URL
  workspaceRoutes.get(
    '/:workspaceId/invite',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    inviteActionHandler(workspaceService, inviteService)
  );

  // POST /workspace/:id/invite - Send invite emails
  workspaceRoutes.post(
    '/:workspaceId/invite',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    sendInvitesHandler(inviteService)
  );

  // Project routes
  workspaceRoutes.get(
    '/:workspaceId/projects',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getProjectsHandler(projectService)
  );

  workspaceRoutes.post(
    '/:workspaceId/projects',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    createProjectHandler(projectService, workspaceService)
  );

  workspaceRoutes.patch(
    '/:workspaceId/projects/:projectId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateProjectHandler(projectService)
  );

  workspaceRoutes.put(
    '/:id/project/:projectId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    replaceProjectHandler(projectService)
  );

  // Domain routes
  workspaceRoutes.get(
    '/:workspaceId/domains',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getWorkspaceDomainsHandler(domainService)
  );

  workspaceRoutes.post(
    '/:workspaceId/domains',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    addDomainHandler(domainService)
  );

  return workspaceRoutes;
}
