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
import {
  getThumbnailsStorage,
  getVideoStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
  getClientActionsStorage,
} from '@/api/clients/storage';

import { tokenService } from '@/api/services/token.service';
import { emailService } from '@/api/services/email.service';

// Repositories
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { UserRepository } from '@/api/repositories/users.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { LinkRepository } from '@/api/repositories/links.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { AdminRepository } from '@/api/repositories/admin.repository';
import { AdminWorkspaceRepository } from '@/api/repositories/admin-workspace.repository';
import { AdminRecordingRepository } from '@/api/repositories/admin-recording.repository';

// Services
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { UserService } from '@/api/services/user.service';
import { RecordingService } from '@/api/services/recording.service';
import { ProjectService } from '@/api/services/project.service';
import { WorkspaceService } from '@/api/services/workspace.service';
import { DomainService } from '@/api/services/domain.service';
import { InviteService } from '@/api/services/invite.service';
import { LinkService } from '@/api/services/link.service';
import { ProvisionerService } from '@/api/services/provisioner.service';
import { SessionService } from '@/api/services/session.service';
import { AdminService } from '@/api/services/admin.service';
import { AdminWorkspaceService } from '@/api/services/admin-workspace.service';
import { AdminRecordingService } from '@/api/services/admin-recording.service';
import { AdminProvisioningService } from '@/api/services/admin-provisioning.service';
import { env } from '@/api/env';

// Initialize repositories
const workspaceRepo = new WorkspaceRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);
const userRepo = new UserRepository(db);
const projectRepo = new ProjectRepository(db);
const domainRepo = new DomainRepository(db);
const linkRepo = new LinkRepository(db);
const recordingRepo = new RecordingRepository(db);
const adminRepo = new AdminRepository(db);
const adminWorkspaceRepo = new AdminWorkspaceRepository(db);
const adminRecordingRepo = new AdminRecordingRepository(db);

// Initialize services in dependency order
// Level 1: Services with no dependencies on other services
export const workspaceMemberService = new WorkspaceMemberService({
  memberRepo: workspaceMemberRepo,
});

export const userService = new UserService({
  userRepo,
});

export const adminService = new AdminService({
  adminRepo,
  adminUserIds: env.admin.userIds,
});

export const adminWorkspaceService = new AdminWorkspaceService({
  adminWorkspaceRepo,
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
});

export const linkService = new LinkService({
  linkRepo,
  workspaceMemberRepo,
  projectRepo,
  domainRepo,
  workspaceRepo,
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
  projectService,
});

// Domain service - initialized after workspace and user services are available
export const domainService = new DomainService({
  domainRepo,
  tokenService,
  emailService,
  workspaceService,
  userService,
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
  db,
});

export const sessionService = new SessionService({
  linkRepo,
  recordingRepo,
  projectRepo,
  workspaceRepo,
  videoStorage: getVideoStorage(),
  thumbnailsStorage: getThumbnailsStorage(),
  consoleLogsStorage: getConsoleLogsStorage(),
  networkLogsStorage: getNetworkLogsStorage(),
  clientActionsStorage: getClientActionsStorage(),
  linkService,
});

// Level 4: Admin services that depend on level 3
export const adminProvisioningService = new AdminProvisioningService({
  userRepo,
  provisionerService,
  workspaceMemberService,
  workspaceService,
  db,
});
