/**
 * Zendesk App contract implementation using oRPC
 * Implements iframe app endpoints with Bearer token authentication + rate limiting
 */

import type { RateLimiter } from '@userplane/cache';
import { zendeskAppError } from '@userplane/contract';

import { base } from '@/api/middleware/auth.orpc';
import {
  createZendeskAppAuthMiddleware,
  createZendeskAppRateLimitMiddleware,
  type ZendeskAppContext,
} from '@/api/middleware/zendesk-app.orpc';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';
import type { ZendeskAppService } from '@/api/services/zendesk-app.service';

// =============================================================================
// Handler Implementations
// =============================================================================

type ZendeskMiddleware = ReturnType<typeof createZendeskAppAuthMiddleware>;
type ZendeskRateLimit = ReturnType<typeof createZendeskAppRateLimitMiddleware>;

/**
 * POST /zendesk/links — Create a recording link
 */
const createLinkImpl = (
  service: ZendeskAppService,
  zendeskAuth: ZendeskMiddleware,
  zendeskRateLimit: ZendeskRateLimit
) => {
  return base.zendeskApp.createLink
    .use(zendeskAuth)
    .use(zendeskRateLimit)
    .handler(async ({ input, context }) => {
      const { workspaceId } = context as ZendeskAppContext;
      const requestedWorkspaceId = input.query.workspaceId;

      if (requestedWorkspaceId !== workspaceId) {
        throw zendeskAppError.ZENDESK_APP_WORKSPACE_MISMATCH();
      }

      const subdomain = (context as ZendeskAppContext).subdomain;
      const result = await service.createLink({
        ...input.body,
        workspaceId,
        subdomain,
      });

      return {
        message: 'Recording link created',
        data: result,
      };
    });
};

/**
 * GET /zendesk/projects — List workspace projects
 */
const getProjectsImpl = (
  service: ZendeskAppService,
  zendeskAuth: ZendeskMiddleware,
  zendeskRateLimit: ZendeskRateLimit
) => {
  return base.zendeskApp.getProjects
    .use(zendeskAuth)
    .use(zendeskRateLimit)
    .handler(async ({ input, context }) => {
      const { workspaceId } = context as ZendeskAppContext;

      if (input.query.workspaceId !== workspaceId) {
        throw zendeskAppError.ZENDESK_APP_WORKSPACE_MISMATCH();
      }

      const projects = await service.getProjects(workspaceId);

      return {
        message: 'Projects retrieved',
        data: { projects },
      };
    });
};

/**
 * GET /zendesk/domains — List workspace domains
 */
const getDomainsImpl = (
  service: ZendeskAppService,
  zendeskAuth: ZendeskMiddleware,
  zendeskRateLimit: ZendeskRateLimit
) => {
  return base.zendeskApp.getDomains
    .use(zendeskAuth)
    .use(zendeskRateLimit)
    .handler(async ({ input, context }) => {
      const { workspaceId } = context as ZendeskAppContext;

      if (input.query.workspaceId !== workspaceId) {
        throw zendeskAppError.ZENDESK_APP_WORKSPACE_MISMATCH();
      }

      const domains = await service.getDomains(workspaceId);

      return {
        message: 'Domains retrieved',
        data: { domains },
      };
    });
};

/**
 * GET /zendesk/status — Integration health check
 */
const getStatusImpl = (zendeskAuth: ZendeskMiddleware, zendeskRateLimit: ZendeskRateLimit) => {
  return base.zendeskApp.getStatus
    .use(zendeskAuth)
    .use(zendeskRateLimit)
    .handler(async ({ input, context }) => {
      const { workspaceId } = context as ZendeskAppContext;

      if (input.query.workspaceId !== workspaceId) {
        throw zendeskAppError.ZENDESK_APP_WORKSPACE_MISMATCH();
      }

      return {
        message: 'Integration is healthy',
        data: { status: 'healthy', workspaceId },
      };
    });
};

/**
 * GET /zendesk/me — Returns workspace context from apiToken
 */
const getMeImpl = (zendeskAuth: ZendeskMiddleware, zendeskRateLimit: ZendeskRateLimit) => {
  return base.zendeskApp.getMe
    .use(zendeskAuth)
    .use(zendeskRateLimit)
    .handler(async ({ context }) => {
      const { workspaceId, subdomain } = context as ZendeskAppContext;

      return {
        message: 'Workspace context retrieved',
        data: { workspaceId, subdomain, status: 'connected' },
      };
    });
};

// =============================================================================
// Procedure Factory
// =============================================================================

export const createZendeskAppProcedures = (
  zendeskAppService: ZendeskAppService,
  integrationRepo: IntegrationRepository,
  rateLimiter: RateLimiter
) => {
  const zendeskAuth = createZendeskAppAuthMiddleware({ integrationRepo });
  const zendeskRateLimit = createZendeskAppRateLimitMiddleware(rateLimiter);

  return {
    createLink: createLinkImpl(zendeskAppService, zendeskAuth, zendeskRateLimit),
    getProjects: getProjectsImpl(zendeskAppService, zendeskAuth, zendeskRateLimit),
    getDomains: getDomainsImpl(zendeskAppService, zendeskAuth, zendeskRateLimit),
    getStatus: getStatusImpl(zendeskAuth, zendeskRateLimit),
    getMe: getMeImpl(zendeskAuth, zendeskRateLimit),
  };
};
