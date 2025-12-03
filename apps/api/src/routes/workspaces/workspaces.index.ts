/**
 * Workspace route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { db } from '@/api/clients/db';

import { tokenService } from '@/api/services/token.service';
import { emailService } from '@/api/services/email.service';

import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { UserRepository } from '@/api/repositories/users.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';

import { WorkspaceService } from '@/api/services/workspace.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { UserService } from '@/api/services/user.service';
import { ProjectService } from '@/api/services/project.service';

import { InviteService } from '@/api/services/invite.service';

import { createWorkspaceRoutes } from './workspaces.routes';

const workspaceRepo = new WorkspaceRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);
const userRepo = new UserRepository(db);
const projectRepo = new ProjectRepository(db);

export const workspaceService = new WorkspaceService({
  workspaceRepo,
  tokenService,
});

export const workspaceMemberService = new WorkspaceMemberService({
  memberRepo: workspaceMemberRepo,
});

const userService = new UserService({
  userRepo,
});

export const projectService = new ProjectService({
  projectRepo,
});

export const inviteService = new InviteService({
  workspaceMemberService,
  workspaceService,
  userService,
  emailService,
  tokenService,
  db,
});

const workspaceRoutes = createWorkspaceRoutes(
  inviteService,
  workspaceMemberService,
  workspaceService,
  projectService
);

const app = new Hono<AppEnv>();
app.route('/workspaces', workspaceRoutes);

export default app;
