/**
 * Zendesk app API route handlers
 * Called from the Zendesk iframe app, authenticated via apiToken
 */

import { ZendeskCreateLinkBodySchema, ZendeskWorkspaceQuerySchema } from '@userplane/contract';
import type { Context } from 'hono';

import { createLogger } from '@/api/lib/logger';
import type { ZendeskAppService } from '@/api/services/zendesk-app.service';

const logger = createLogger('zendesk-app-handler');

/**
 * POST /api/v1/zendesk/links - Create a recording link
 */
export function createCreateLinkHandler(service: ZendeskAppService) {
  return async (c: Context) => {
    const body = await c.req.json();
    const parsed = ZendeskCreateLinkBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId') as string;

    // Verify the requested workspace matches the authenticated workspace
    if (parsed.data.workspaceId !== workspaceId) {
      return c.json({ error: 'Workspace mismatch' }, 403);
    }

    try {
      const subdomain = c.get('subdomain') as string | undefined;
      const result = await service.createLink({
        workspaceId,
        projectId: parsed.data.projectId,
        domainId: parsed.data.domainId,
        agentEmail: parsed.data.agentEmail,
        ticketId: parsed.data.ticketId,
        subdomain,
      });

      return c.json({ success: true, data: result });
    } catch (error) {
      logger.error({ error }, 'Failed to create link');
      return c.json({ error: 'Failed to create link' }, 500);
    }
  };
}

/**
 * GET /api/v1/zendesk/projects - List workspace projects
 */
export function createGetProjectsHandler(service: ZendeskAppService) {
  return async (c: Context) => {
    const query = c.req.query();
    const parsed = ZendeskWorkspaceQuerySchema.safeParse(query);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query params', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId') as string;

    if (parsed.data.workspaceId !== workspaceId) {
      return c.json({ error: 'Workspace mismatch' }, 403);
    }

    try {
      const projects = await service.getProjects(workspaceId);
      return c.json({ success: true, data: { projects } });
    } catch (error) {
      logger.error({ error }, 'Failed to get projects');
      return c.json({ error: 'Failed to get projects' }, 500);
    }
  };
}

/**
 * GET /api/v1/zendesk/domains - List workspace domains
 */
export function createGetDomainsHandler(service: ZendeskAppService) {
  return async (c: Context) => {
    const query = c.req.query();
    const parsed = ZendeskWorkspaceQuerySchema.safeParse(query);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query params', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId') as string;

    if (parsed.data.workspaceId !== workspaceId) {
      return c.json({ error: 'Workspace mismatch' }, 403);
    }

    try {
      const domains = await service.getDomains(workspaceId);
      return c.json({ success: true, data: { domains } });
    } catch (error) {
      logger.error({ error }, 'Failed to get domains');
      return c.json({ error: 'Failed to get domains' }, 500);
    }
  };
}

/**
 * GET /api/v1/zendesk/status - Integration health check
 */
export function createGetStatusHandler() {
  return async (c: Context) => {
    const query = c.req.query();
    const parsed = ZendeskWorkspaceQuerySchema.safeParse(query);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query params', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId') as string;

    if (parsed.data.workspaceId !== workspaceId) {
      return c.json({ error: 'Workspace mismatch' }, 403);
    }

    // If we get here, the apiToken auth succeeded — integration is healthy
    return c.json({ success: true, data: { status: 'healthy', workspaceId } });
  };
}
