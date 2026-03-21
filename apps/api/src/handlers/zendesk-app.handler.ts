/**
 * Zendesk app API route handlers
 * Called from the Zendesk iframe app, authenticated via apiToken
 */

import { ZendeskCreateLinkBodySchema, ZendeskWorkspaceQuerySchema } from '@userplane/contract';
import type { Context } from 'hono';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { workspaceId: _workspaceId, ...linkParams } = parsed.data;
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

/**
 * GET /api/v1/zendesk/me - Returns workspace context from apiToken auth
 * No query params required — workspaceId is derived from the authenticated token.
 * Used by the Zendesk app after built-in OAuth to discover its workspace context.
 */
export function createGetMeHandler() {
  return async (c: Context<ZendeskAppEnv>) => {
    const workspaceId = c.get('workspaceId');
    const subdomain = c.get('subdomain');

    return c.json({
      success: true,
      data: { workspaceId, subdomain, status: 'connected' },
    });
  };
}

/**
 * GET /api/v1/zendesk/resolve?subdomain=X - Resolve integration config by subdomain
 * Called server-to-server from the dashboard (Next.js server component).
 * Secured via X-Internal-Key header.
 */
export function createResolveHandler(deps: { integrationRepo: IntegrationRepository }) {
  return async (c: Context) => {
    // Verify internal API key
    const internalKey = c.req.header('X-Internal-Key');
    if (!internalKey || internalKey !== env.server.internalApiKey) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const subdomain = c.req.query('subdomain');
    if (!subdomain) {
      return c.json({ error: 'Missing subdomain parameter' }, 400);
    }

    try {
      const integration = await deps.integrationRepo.findByProviderWorkspaceId(
        'zendesk',
        subdomain
      );

      if (!integration) {
        return c.json({ connected: false, subdomain });
      }

      const apiToken = (integration.providerToken as { apiToken?: string })?.apiToken;
      if (!apiToken) {
        return c.json({ connected: false, subdomain });
      }

      return c.json({
        connected: true,
        apiToken,
        workspaceId: integration.workspaceId,
        subdomain,
      });
    } catch (err) {
      logger.error({ err, subdomain }, 'Failed to resolve integration');
      return c.json({ connected: false, subdomain });
    }
  };
}
