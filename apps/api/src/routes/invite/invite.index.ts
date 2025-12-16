/**
 * Invite route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { inviteService } from '@/api/services';
import { createInviteRoutes } from './invite.routes';

const inviteRoutes = createInviteRoutes(inviteService);

const app = new Hono<AppEnv>();
app.route('/invite', inviteRoutes);

export default app;
