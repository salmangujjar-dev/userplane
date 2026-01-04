/**
 * oRPC API Router
 *
 * Combines all contract implementations for the API.
 *
 * Structure:
 * - Each domain has its own implementation file (e.g., session.impl.ts)
 * - Implementation files export procedure creators that accept service dependencies
 * - This router assembles all implementations with proper dependency injection
 * - Shared auth middleware is in middleware/auth.middleware.ts
 *
 * Usage:
 * The router is mounted at /api/v1 with OpenAPIHandler to respect REST paths
 * defined in the contract (e.g., GET /api/v1/session)
 */

// Services
import {
  sessionService,
  userService,
  workspaceService,
  workspaceMemberService,
  inviteService,
  projectService,
  domainService,
  recordingService,
  linkService,
  provisionerService,
  adminService,
  adminWorkspaceService,
  adminRecordingService,
} from '@/api/services';

// Implementations
import { createSessionProcedures } from './session/session.impl';
import { createAccountProcedures } from './account/account.impl';
import { createWorkspaceProcedures } from './workspace/workspace.impl';
import { createRecordingProcedures } from './recording/recording.impl';
import { createLinkProcedures } from './link/link.impl';
import { createDomainProcedures } from './domain/domain.impl';
import { createInviteProcedures } from './invite/invite.impl';
import { createProvisionerProcedures } from './provisioner/provisioner.impl';
import { createStatusProcedures } from './status/status.impl';
import { createProjectProcedures } from './project/project.impl';
import { createAdminProcedures } from './admin/admin.impl';

// Export context types for use in implementations
export type { InitialContext, AuthContext } from '@/api/middleware/auth.orpc';
export type { WorkspaceContext } from '@/api/middleware/workspace.orpc';

/**
 * Implemented procedures
 * Add new implementations here as endpoints are migrated to v2
 */
const sessionProcedures = createSessionProcedures(sessionService);
const accountProcedures = createAccountProcedures(userService);
const workspaceProcedures = createWorkspaceProcedures(
  inviteService,
  workspaceMemberService,
  workspaceService,
  projectService,
  domainService
);
const recordingProcedures = createRecordingProcedures(
  recordingService,
  workspaceMemberService,
  workspaceService
);
const linkProcedures = createLinkProcedures(linkService, workspaceMemberService, workspaceService);
const domainProcedures = createDomainProcedures(domainService);
const inviteProcedures = createInviteProcedures(inviteService);
const provisionerProcedures = createProvisionerProcedures(provisionerService);
const statusProcedures = createStatusProcedures();
const adminProcedures = createAdminProcedures(
  adminService,
  adminWorkspaceService,
  adminRecordingService
);
const projectProcedures = createProjectProcedures(
  projectService,
  workspaceMemberService,
  workspaceService
);

/**
 * Complete router export
 *
 * All API endpoints implemented with oRPC:
 * - status: API info and health check (public)
 * - session: Session initialization and upload management
 * - account: User account management
 * - provisioner: Workspace creation
 * - workspace: Workspace management, members, domains, settings
 * - project: Project management
 * - recording: Recording management and resources
 * - link: Recording link management
 * - domain: Public domain verification
 * - invite: Public invite validation and acceptance
 */
export const apiRouter = {
  status: statusProcedures,
  session: sessionProcedures,
  account: accountProcedures,
  admin: adminProcedures,
  provisioner: provisionerProcedures,
  workspace: workspaceProcedures,
  project: projectProcedures,
  recording: recordingProcedures,
  link: linkProcedures,
  domain: domainProcedures,
  invite: inviteProcedures,
};

export type ApiRouter = typeof apiRouter;

// Re-export for external consumption
export type { ApiRouter as router };
