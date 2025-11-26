/**
 * Workspace routes - HTTP routes for workspace operations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { requireWorkspaceMember } from '@/api/middleware/workspace';
import { sendInvitesHandler } from '@/api/handlers/invites.handlers';
import {
  inviteService,
  workspaceMemberService,
  workspaceService,
} from '@/api/routes/workspaces/workspaces.index';

const workspaceRoutes = new Hono<AppEnv>();

workspaceRoutes.post(
  '/:workspaceSlug/invites',
  requireAuth,
  requireWorkspaceMember(workspaceMemberService, workspaceService),
  sendInvitesHandler(inviteService)
);

export default workspaceRoutes;
