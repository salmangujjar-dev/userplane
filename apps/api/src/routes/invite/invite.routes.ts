/**
 * Invite routes - HTTP routes for workspace invitations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { authMiddleware } from '@/api/middleware/auth';
import { inviteActionHandler } from '@/api/handlers/invite.handlers';
import type { InviteService } from '@/api/services/invite.service';

export function createInviteRoutes(inviteService: InviteService) {
  const inviteRoutes = new Hono<AppEnv>();

  // Unified endpoint for validate and accept actions
  // Uses authMiddleware (not requireAuth) to set user in context if authenticated
  // Handler conditionally enforces auth for accept action
  // GET /invite?token=<token>&action=validate (no auth) - Validate invite token
  // GET /invite?token=<token>&action=accept (requires auth) - Accept invite
  inviteRoutes.get('/', authMiddleware, inviteActionHandler(inviteService));

  return inviteRoutes;
}
