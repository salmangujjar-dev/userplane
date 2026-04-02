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
import { getDodoClient } from '@/api/clients/dodo';
import { cacheService, rateLimiter } from '@/api/clients/redis';
import { env } from '@/api/env';
import {
  adminPlanService,
  adminProjectService,
  adminRecordingService,
  adminService,
  adminSubscriptionService,
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
  notificationChannelService,
  notificationService,
  projectService,
  provisionerService,
  recordingRepo,
  recordingService,
  sessionService,
  slackCanvasService,
  slackService,
  tokenService,
  userService,
  workspaceMemberRepo,
  workspaceMemberService,
  workspaceService,
  zendeskAppService,
  zendeskService,
} from '@/api/services';

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
import { createShareProcedures } from './share/share.impl';
import { createStatusProcedures } from './status/status.impl';
import { createWorkspaceProcedures } from './workspace/workspace.impl';
import { createZendeskAppProcedures } from './zendesk-app/zendesk-app.impl';

// Export context types for use in implementations
export type { AuthContext, InitialContext } from '@/api/middleware/auth.orpc';
export type { WorkspaceContext } from '@/api/middleware/workspace.orpc';

/**
 * Implemented procedures
 */
const sessionProcedures = createSessionProcedures(
  sessionService,
  recordingRepo,
  notificationService
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
  intercomService,
  zendeskService,
  slackService,
  slackCanvasService,
  billingService,
  notificationChannelService
);
const recordingProcedures = createRecordingProcedures(
  recordingService,
  workspaceMemberService,
  workspaceService,
  emailService,
  inviteService,
  userService,
  tokenService,
  billingService
);
const linkProcedures = createLinkProcedures(linkService, workspaceMemberService, workspaceService);
const domainProcedures = createDomainProcedures(domainService);
const inviteProcedures = createInviteProcedures(inviteService);
const provisionerProcedures = createProvisionerProcedures(
  provisionerService,
  emailService,
  intercomService,
  slackService
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
  entitlementService,
  adminPlanService,
  billingService,
  adminSubscriptionService
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
  entitlementService,
  getDodoClient(),
  env.dashboard.baseUrl
);
const shareProcedures = createShareProcedures(
  recordingService,
  workspaceMemberService,
  workspaceMemberRepo,
  workspaceService,
  tokenService,
  env.dashboard.baseUrl
);
const diagnosticsProcedures = createDiagnosticsProcedures(
  cacheService,
  workspaceMemberService,
  workspaceService,
  linkRepo,
  domainRepo,
  integrationRepo
);

const zendeskAppProcedures = createZendeskAppProcedures(
  zendeskAppService,
  env.zendesk.jwtSecret,
  rateLimiter
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
 * - share: Public shareable recording links
 * - link: Recording link management
 * - domain: Public domain verification
 * - invite: Public invite validation and acceptance
 * - billing: Subscription management and billing operations
 * - diagnostics: Workspace diagnostics and maintenance operations
 * - zendeskApp: Zendesk iframe app endpoints (Bearer token auth)
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
  share: shareProcedures,
  link: linkProcedures,
  domain: domainProcedures,
  invite: inviteProcedures,
  zendeskApp: zendeskAppProcedures,
};

export type ApiRouter = typeof apiRouter;

// Re-export for external consumption
export type { ApiRouter as router };
