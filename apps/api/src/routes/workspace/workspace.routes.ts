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
  getInviteUrlHandler,
  rotateInviteTokenHandler,
  getAllWorkspacesHandler,
  countWorkspacesHandler,
  getWorkspaceByIdHandler,
  getWorkspacePreferencesHandler,
  updateWorkspacePreferencesHandler,
  updateLinkSettingsHandler,
  getWorkspaceMembersHandler,
  updateMemberRoleHandler,
  removeMemberHandler,
  leaveWorkspaceHandler,
  updateNotificationPreferencesHandler,
  getWorkspaceDomainsHandler,
  getDomainByIdHandler,
  addDomainHandler,
  updateDomainHandler,
  deleteDomainHandler,
  getDomainVerificationUrlHandler,
  updateWorkspaceNameHandler,
  deleteWorkspaceHandler,
  workspaceSearchHandler,
} from '@/api/handlers/workspace.handlers';
import {
  getDomainRecordingPreferencesHandler,
  updateDomainRecordingPreferencesHandler,
  replaceDomainRecordingPreferencesHandler,
} from '@/api/handlers/domains.handlers';
import {
  createProjectHandler,
  getProjectsHandler,
  updateProjectHandler,
  replaceProjectHandler,
  deleteProjectHandler,
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

  // Count workspaces for authenticated user with optional role filtering
  // Note: This must come before /:id route to avoid /count being interpreted as an id
  workspaceRoutes.get('/count', requireAuth, countWorkspacesHandler(workspaceService));

  // Get specific workspace by ID - returns basic info only
  workspaceRoutes.get('/:id', requireAuth, getWorkspaceByIdHandler(workspaceService));

  // Update workspace name - requires admin or owner role
  workspaceRoutes.patch(
    '/:workspaceId',
    requireAuth,
    requireWorkspaceRole(workspaceMemberService, workspaceService, ['admin', 'owner']),
    updateWorkspaceNameHandler(workspaceService)
  );

  // Delete workspace - requires admin or owner role
  workspaceRoutes.delete(
    '/:workspaceId',
    requireAuth,
    requireWorkspaceRole(workspaceMemberService, workspaceService, ['admin', 'owner']),
    deleteWorkspaceHandler(workspaceService)
  );

  // Get workspace preferences - returns recording settings
  workspaceRoutes.get(
    '/:id/preferences',
    requireAuth,
    getWorkspacePreferencesHandler(workspaceService)
  );

  // Update workspace preferences - toggles recording behavior flags
  workspaceRoutes.patch(
    '/:workspaceId/preferences',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateWorkspacePreferencesHandler(workspaceService)
  );

  // Update link settings - branding, customization, and logo upload
  workspaceRoutes.put(
    '/:workspaceId/preferences/link',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateLinkSettingsHandler(workspaceService)
  );

  // Get workspace members - returns workspace members with pagination
  workspaceRoutes.get(
    '/:id/members',
    requireAuth,
    getWorkspaceMembersHandler(workspaceMemberService)
  );

  // Update member role - requires admin or owner
  workspaceRoutes.patch(
    '/:workspaceId/members/:workspaceMemberId',
    requireAuth,
    requireWorkspaceRole(workspaceMemberService, workspaceService, ['admin', 'owner']),
    updateMemberRoleHandler(workspaceMemberService)
  );

  // Remove member - requires admin or owner
  workspaceRoutes.delete(
    '/:workspaceId/members/:workspaceMemberId',
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

  // Invite routes
  // GET /workspace/:workspaceId/invite - Get current invite URL (all members)
  workspaceRoutes.get(
    '/:workspaceId/invite',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getInviteUrlHandler(inviteService)
  );

  // POST /workspace/:workspaceId/invite/rotate - Rotate invite token (admin/owner only)
  workspaceRoutes.post(
    '/:workspaceId/invite/rotate',
    requireAuth,
    requireWorkspaceRole(workspaceMemberService, workspaceService, ['admin', 'owner']),
    rotateInviteTokenHandler(inviteService)
  );

  // POST /workspace/:workspaceId/invite - Send invite emails (all members)
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
    createProjectHandler(projectService)
  );

  workspaceRoutes.patch(
    '/:workspaceId/projects/:projectId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateProjectHandler(projectService)
  );

  workspaceRoutes.put(
    '/:workspaceId/projects/:projectId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    replaceProjectHandler(projectService)
  );

  workspaceRoutes.delete(
    '/:workspaceId/projects/:projectId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    deleteProjectHandler(projectService)
  );

  // Domain routes
  workspaceRoutes.get(
    '/:workspaceId/domains',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getWorkspaceDomainsHandler(domainService)
  );

  workspaceRoutes.get(
    '/:workspaceId/domains/:domainId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getDomainByIdHandler(domainService)
  );

  workspaceRoutes.post(
    '/:workspaceId/domains',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    addDomainHandler(domainService)
  );

  workspaceRoutes.patch(
    '/:workspaceId/domains/:domainId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateDomainHandler(domainService)
  );

  workspaceRoutes.delete(
    '/:workspaceId/domains/:domainId',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    deleteDomainHandler(domainService)
  );

  workspaceRoutes.get(
    '/:workspaceId/domains/:domainId/verify',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getDomainVerificationUrlHandler(domainService)
  );

  // Domain recording preferences routes
  workspaceRoutes.get(
    '/:workspaceId/domains/:domainId/preferences',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    getDomainRecordingPreferencesHandler(domainService)
  );

  workspaceRoutes.patch(
    '/:workspaceId/domains/:domainId/preferences',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    updateDomainRecordingPreferencesHandler(domainService)
  );

  workspaceRoutes.put(
    '/:workspaceId/domains/:domainId/preferences',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    replaceDomainRecordingPreferencesHandler(domainService)
  );

  // Search route
  workspaceRoutes.get(
    '/:workspaceId/search',
    requireAuth,
    requireWorkspaceMember(workspaceMemberService, workspaceService),
    workspaceSearchHandler(workspaceService)
  );

  return workspaceRoutes;
}
