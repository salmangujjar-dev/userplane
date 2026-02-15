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

// Services and Repositories
import { cacheService } from '@/api/clients/redis';
import {
  adminProjectService,
  adminRecordingService,
  adminService,
  adminWorkspaceService,
  billingService,
  domainRepo,
  domainService,
  emailService,
  entitlementService,
  integrationRepo,
  intercomService,
  inviteService,
  linkRepo,
  linkService,
  notificationService,
  projectService,
  provisionerService,
  recordingRepo,
  recordingService,
  sessionService,
  tokenService,
  userService,
  workspaceMemberRepo,
  workspaceMemberService,
  workspaceService,
} from '@/api/services';
import { IntercomNotificationService } from '@/api/services/intercom-notification.service';

import { createAccountProcedures } from './account/account.impl';
import { createAdminProcedures } from './admin/admin.impl';
import { createBillingProcedures } from './billing/billing.impl';
import { createDiagnosticsProcedures } from './diagnostics/diagnostics.impl';
import { createDomainProcedures } from './domain/domain.impl';
import { createInviteProcedures } from './invite/invite.impl';
import { createLinkProcedures } from './link/link.impl';
import { createProjectProcedures } from './project/project.impl';
import { createProvisionerProcedures } from './provisioner/provisioner.impl';
import { createRecordingProcedures } from './recording/recording.impl';
// Implementations
import { createSessionProcedures } from './session/session.impl';
import { createStatusProcedures } from './status/status.impl';
import { createWorkspaceProcedures } from './workspace/workspace.impl';

// Export context types for use in implementations
export type { AuthContext, InitialContext } from '@/api/middleware/auth.orpc';
export type { WorkspaceContext } from '@/api/middleware/workspace.orpc';

/**
 * Implemented procedures
 */
const intercomNotificationService = new IntercomNotificationService({ integrationRepo });
const sessionProcedures = createSessionProcedures(
  sessionService,
  recordingRepo,
  workspaceMemberRepo,
  notificationService,
  intercomNotificationService
);
const accountProcedures = createAccountProcedures(userService);
const workspaceProcedures = createWorkspaceProcedures(
  inviteService,
  workspaceMemberService,
  workspaceService,
  projectService,
  domainService,
  recordingService,
  linkService,
  emailService,
  userService,
  tokenService,
  intercomService
);
const recordingProcedures = createRecordingProcedures(
  recordingService,
  workspaceMemberService,
  workspaceService
);
const linkProcedures = createLinkProcedures(linkService, workspaceMemberService, workspaceService);
const domainProcedures = createDomainProcedures(domainService);
const inviteProcedures = createInviteProcedures(inviteService);
const provisionerProcedures = createProvisionerProcedures(
  provisionerService,
  emailService,
  intercomService
);
const statusProcedures = createStatusProcedures();
const adminProcedures = createAdminProcedures(
  adminService,
  adminWorkspaceService,
  adminProjectService,
  adminRecordingService,

  workspaceService,
  workspaceMemberService,
  projectService,
  tokenService,
  emailService,
  entitlementService
);
const projectProcedures = createProjectProcedures(
  projectService,
  workspaceMemberService,
  workspaceService,
  emailService
);
const billingProcedures = createBillingProcedures(
  billingService,
  workspaceMemberService,
  workspaceService,
  entitlementService
);
const diagnosticsProcedures = createDiagnosticsProcedures(
  cacheService,
  workspaceMemberService,
  workspaceService,
  linkRepo,
  domainRepo,
  integrationRepo
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
 * - billing: Subscription management and billing operations
 * - diagnostics: Workspace diagnostics and maintenance operations
 */
export const apiRouter = {
  status: statusProcedures,
  session: sessionProcedures,
  account: accountProcedures,
  admin: adminProcedures,
  billing: billingProcedures,
  diagnostics: diagnosticsProcedures,
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
