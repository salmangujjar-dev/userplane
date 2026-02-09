/**
 * Centralized service initialization
 *
 * This file initializes all services in a single location to avoid circular
 * dependencies between route modules. Services are initialized in dependency
 * order to ensure all dependencies are available when needed.
 *
 * All route modules should import services from this file, not create their
 * own instances or import from other route modules.
 */

import { db } from '@/api/clients/db';
import { getDodoClient } from '@/api/clients/dodo';
import { cacheService } from '@/api/clients/redis';
import {
  getClientActionsStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
  getThumbnailsStorage,
  getVideoStorage,
} from '@/api/clients/storage';
import { env } from '@/api/env';
import { AdminRepository } from '@/api/repositories/admin.repository';
import { AdminRecordingRepository } from '@/api/repositories/admin-recording.repository';
import { AdminWorkspaceRepository } from '@/api/repositories/admin-workspace.repository';
import { DisputeRepository } from '@/api/repositories/disputes.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { EntitlementRepository } from '@/api/repositories/entitlements.repository';
import { IntegrationRepository } from '@/api/repositories/integrations.repository';
import { LinkRepository } from '@/api/repositories/links.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { RefundRepository } from '@/api/repositories/refunds.repository';
import { SubscriptionRepository } from '@/api/repositories/subscriptions.repository';
import { UserRepository } from '@/api/repositories/users.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
// Repositories
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { AdminService } from '@/api/services/admin.service';
import { AdminProjectService } from '@/api/services/admin-project.service';
import { AdminRecordingService } from '@/api/services/admin-recording.service';
import { AdminWorkspaceService } from '@/api/services/admin-workspace.service';
import { BillingService } from '@/api/services/billing.service';
import { DomainService } from '@/api/services/domain.service';
import { emailService } from '@/api/services/email.service';
import { EntitlementService } from '@/api/services/entitlement.service';
import { IntercomCanvasService } from '@/api/services/intercom-canvas.service';
import { IntercomService } from '@/api/services/intercom-oauth.service';
import { InviteService } from '@/api/services/invite.service';
import { LinkService } from '@/api/services/link.service';
import { ProjectService } from '@/api/services/project.service';
import { ProvisionerService } from '@/api/services/provisioner.service';
import { RecordingService } from '@/api/services/recording.service';
import { SessionService } from '@/api/services/session.service';
import { tokenService } from '@/api/services/token.service';
import { UserService } from '@/api/services/user.service';
import { WorkspaceService } from '@/api/services/workspace.service';
// Services
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';

// Initialize repositories
const workspaceRepo = new WorkspaceRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);
const userRepo = new UserRepository(db);
const projectRepo = new ProjectRepository(db);
const domainRepo = new DomainRepository(db);
const linkRepo = new LinkRepository(db);
const recordingRepo = new RecordingRepository(db);
const subscriptionRepo = new SubscriptionRepository(db);
const entitlementRepo = new EntitlementRepository(db);
const disputeRepo = new DisputeRepository(db);
const refundRepo = new RefundRepository(db);
const adminRepo = new AdminRepository(db);
const adminWorkspaceRepo = new AdminWorkspaceRepository(db);
const adminRecordingRepo = new AdminRecordingRepository(db);
const integrationRepo = new IntegrationRepository(db);

// Initialize services in dependency order
// Level 0: Services with only repository dependencies (no other services)
export const billingService = new BillingService({
  subscriptionRepo,
  disputeRepo,
  refundRepo,
  dodoClient: getDodoClient(),
  cacheService,
});

export const entitlementService = new EntitlementService({
  entitlementRepo,
  billingService,
  subscriptionRepo,
  cacheService,
});

// Level 1: Services with no dependencies on other services
export const workspaceMemberService = new WorkspaceMemberService({
  memberRepo: workspaceMemberRepo,
  entitlementService,
  cacheService,
});

export const userService = new UserService({
  userRepo,
});

export const adminRecordingService = new AdminRecordingService({
  adminRecordingRepo,
});

export const recordingService = new RecordingService({
  recordingRepo,
  linkRepo,
  workspaceMemberRepo,
  thumbnailsStorage: getThumbnailsStorage(),
  videoStorage: getVideoStorage(),
  consoleLogsStorage: getConsoleLogsStorage(),
  networkLogsStorage: getNetworkLogsStorage(),
  clientActionsStorage: getClientActionsStorage(),
});

// Level 2: Services that depend on level 1
export const projectService = new ProjectService({
  projectRepo,
  db,
  recordingService,
  linkRepo,
  recordingRepo,
  workspaceRepo,
  cacheService,
});

// Admin project service - initialized after project service is available
export const adminProjectService = new AdminProjectService({
  projectService,
});

export const linkService = new LinkService({
  linkRepo,
  workspaceMemberRepo,
  projectRepo,
  domainRepo,
  workspaceRepo,
  entitlementService,
  cacheService,
});

// Level 3: Services that depend on level 2
export const workspaceService = new WorkspaceService({
  workspaceRepo,
  tokenService,
  db,
  workspaceMemberRepo,
  projectRepo,
  domainRepo,
  linkRepo,
  recordingRepo,
  projectService,
  subscriptionRepo,
  dodoClient: getDodoClient(),
  cacheService,
  integrationRepo,
});

// Admin service - initialized after workspace service is available
export const adminService = new AdminService({
  adminRepo,
  adminUserIds: env.admin.userIds,
  workspaceService,
  workspaceMemberRepo,
});

// Admin workspace service - initialized after workspace service is available
export const adminWorkspaceService = new AdminWorkspaceService({
  adminWorkspaceRepo,
  workspaceService,
});

// Domain service - initialized after workspace and user services are available
export const domainService = new DomainService({
  domainRepo,
  tokenService,
  emailService,
  workspaceService,
  userService,
  linkRepo,
  cacheService,
});

export const inviteService = new InviteService({
  workspaceMemberService,
  workspaceService,
  userService,
  emailService,
  tokenService,
  db,
});

export const provisionerService = new ProvisionerService({
  workspaceService,
  projectService,
  workspaceMemberService,
  domainService,
  tokenService,
  entitlementService,
  workspaceRepo,
  memberRepo: workspaceMemberRepo,
  db,
});

export const sessionService = new SessionService({
  linkRepo,
  recordingRepo,
  projectRepo,
  workspaceRepo,
  domainRepo,
  billingService,
  videoStorage: getVideoStorage(),
  thumbnailsStorage: getThumbnailsStorage(),
  consoleLogsStorage: getConsoleLogsStorage(),
  networkLogsStorage: getNetworkLogsStorage(),
  clientActionsStorage: getClientActionsStorage(),
  linkService,
  entitlementService,
  cacheService,
});

// Intercom OAuth service
export const intercomService = new IntercomService({
  tokenService,
  integrationRepo,
  provisionerService,
  inviteService,
  cacheService,
  memberRepo: workspaceMemberRepo,
});

// Intercom Canvas service
export const intercomCanvasService = new IntercomCanvasService({
  integrationRepo,
  userRepo,
  workspaceMemberRepo,
  linkService,
  projectRepo,
  domainRepo,
  entitlementService,
  workspaceRepo,
  cacheService,
});

// Export tokenService, emailService, and repositories for use in routes
export { emailService, tokenService };
export {
  disputeRepo,
  domainRepo,
  entitlementRepo,
  integrationRepo,
  linkRepo,
  recordingRepo,
  subscriptionRepo,
  workspaceMemberRepo,
};
