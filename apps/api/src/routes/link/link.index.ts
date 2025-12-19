/**
 * Links route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { linkService, workspaceMemberService, workspaceService } from '@/api/services';
import { createLinksRoutes } from './link.routes';

const linksRoutes = createLinksRoutes(linkService, workspaceMemberService, workspaceService);

const app = new Hono<AppEnv>();
app.route('/workspace/:workspaceId/links', linksRoutes);

export default app;
