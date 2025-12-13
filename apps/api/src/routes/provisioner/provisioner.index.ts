/**
 * Workspace creation route initialization and dependency injection
 * Uses ProvisionerService internally for workspace provisioning logic
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { db } from '@/api/clients/db';

import { tokenService } from '@/api/services/token.service';
import { emailService } from '@/api/services/email.service';

import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { UserRepository } from '@/api/repositories/users.repository';

import { WorkspaceService } from '@/api/services/workspace.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { ProjectService } from '@/api/services/project.service';
import { DomainService } from '@/api/services/domain.service';
import { UserService } from '@/api/services/user.service';

import { ProvisionerService } from '@/api/services/provisioner.service';

import { createProvisionerRoutes } from './provisioner.routes';

const workspaceRepo = new WorkspaceRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);
const projectRepo = new ProjectRepository(db);
const domainRepo = new DomainRepository(db);
const userRepo = new UserRepository(db);

const workspaceService = new WorkspaceService({
  workspaceRepo,
  tokenService,
});

const workspaceMemberService = new WorkspaceMemberService({
  memberRepo: workspaceMemberRepo,
});

const projectService = new ProjectService({
  projectRepo,
});

const domainService = new DomainService({
  domainRepo,
  tokenService,
});

const userService = new UserService({
  userRepo,
});

export const provisionerService = new ProvisionerService({
  workspaceService,
  projectService,
  workspaceMemberService,
  domainService,
  db,
});

const provisionerRoutes = createProvisionerRoutes(provisionerService);

const app = new Hono<AppEnv>();
app.route('/', provisionerRoutes);

export default app;
