/**
 * Zendesk app API route handlers
 * Called from the Zendesk iframe app, authenticated via apiToken
 */

import { ZendeskCreateLinkBodySchema, ZendeskWorkspaceQuerySchema } from '@userplane/contract';
import type { Context } from 'hono';

import { createLogger } from '@/api/lib/logger';
import { ZendeskAppError, type ZendeskAppService } from '@/api/services/zendesk-app.service';
import type { ZendeskAppEnv } from '@/api/types/internal';

const logger = createLogger('zendesk-app-handler');

/**
 * POST /api/v1/zendesk/links - Create a recording link
 */
export function createCreateLinkHandler(service: ZendeskAppService) {
  return async (c: Context<ZendeskAppEnv>) => {
    const body = await c.req.json();
    const parsed = ZendeskCreateLinkBodySchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId');

    // Verify the requested workspace matches the authenticated workspace
    if (parsed.data.workspaceId !== workspaceId) {
      return c.json({ error: 'Workspace mismatch' }, 403);
    }

    try {
      const subdomain = c.get('subdomain');
      const { workspaceId: _, ...linkParams } = parsed.data;
      const result = await service.createLink({
        ...linkParams,
        workspaceId,
        subdomain,
      });

      return c.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof ZendeskAppError) {
        switch (error.code) {
          case 'RECORDING_LIMIT_EXCEEDED':
            return c.json({ error: error.message, code: error.code }, 403);
          case 'AGENT_NOT_MEMBER':
            return c.json({ error: error.message, code: error.code }, 403);
          case 'AGENT_NOT_FOUND':
            return c.json({ error: error.message, code: error.code }, 404);
        }
      }

      logger.error({ error }, 'Failed to create link');
      return c.json({ error: 'Failed to create link', code: 'INTERNAL_ERROR' }, 500);
    }
  };
}

/**
 * GET /api/v1/zendesk/projects - List workspace projects
 */
export function createGetProjectsHandler(service: ZendeskAppService) {
  return async (c: Context<ZendeskAppEnv>) => {
    const query = c.req.query();
    const parsed = ZendeskWorkspaceQuerySchema.safeParse(query);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query params', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId');

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
  return async (c: Context<ZendeskAppEnv>) => {
    const query = c.req.query();
    const parsed = ZendeskWorkspaceQuerySchema.safeParse(query);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query params', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId');

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
  return async (c: Context<ZendeskAppEnv>) => {
    const query = c.req.query();
    const parsed = ZendeskWorkspaceQuerySchema.safeParse(query);

    if (!parsed.success) {
      return c.json({ error: 'Invalid query params', details: parsed.error.errors }, 400);
    }

    const workspaceId = c.get('workspaceId');

    if (parsed.data.workspaceId !== workspaceId) {
      return c.json({ error: 'Workspace mismatch' }, 403);
    }

    // If we get here, the apiToken auth succeeded — integration is healthy
    return c.json({ success: true, data: { status: 'healthy', workspaceId } });
  };
}
