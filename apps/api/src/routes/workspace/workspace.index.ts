/**
 * Workspace route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import {
  inviteService,
  workspaceMemberService,
  workspaceService,
  projectService,
  domainService,
} from '@/api/services';
import { createWorkspaceRoutes } from './workspace.routes';

const workspaceRoutes = createWorkspaceRoutes(
  inviteService,
  workspaceMemberService,
  workspaceService,
  projectService,
  domainService
);

const app = new Hono<AppEnv>();
app.route('/workspace', workspaceRoutes);

export default app;
