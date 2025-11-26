/**
 * Invite routes - HTTP routes for workspace invitations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { acceptInviteHandler } from '@/api/handlers/invites.handlers';
import type { InviteService } from '@/api/services/invite.service';

export function createInviteRoutes(inviteService: InviteService) {
  const inviteRoutes = new Hono<AppEnv>();

  inviteRoutes.post('/accept', requireAuth, acceptInviteHandler(inviteService));

  return inviteRoutes;
}
