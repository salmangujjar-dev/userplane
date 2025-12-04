/**
 * Workspace creation routes - HTTP routes for workspace provisioning
 * Uses ProvisionerService as an internal implementation detail
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';
import { createWorkspaceHandler } from '@/api/handlers/provisioner.handlers';
import type { ProvisionerService } from '@/api/services/provisioner.service';

export function createProvisionerRoutes(provisionerService: ProvisionerService) {
  const provisionerRoutes = new Hono<AppEnv>();

  provisionerRoutes.post('/workspace', requireAuth, createWorkspaceHandler(provisionerService));

  return provisionerRoutes;
}
