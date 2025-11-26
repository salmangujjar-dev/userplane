/**
 * Provisioner routes - HTTP routes for workspace provisioning
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { createWorkspaceHandler } from '@/api/handlers/provisioner.handlers';
import { provisionerService } from '@/api/routes/provisioner/provisioner.index';

const provisionerRoutes = new Hono<AppEnv>();

provisionerRoutes.post('/workspace', requireAuth, createWorkspaceHandler(provisionerService));

export default provisionerRoutes;
