/**
 * Invite routes - HTTP routes for workspace invitations
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { acceptInviteHandler } from '@/api/handlers/invites.handlers';
import { inviteService } from '@/api/routes/invites/invites.index';

const inviteRoutes = new Hono<AppEnv>();

inviteRoutes.post('/accept', requireAuth, acceptInviteHandler(inviteService));

export default inviteRoutes;
