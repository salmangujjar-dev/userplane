import { oc } from '@orpc/contract';

import {
  ZendeskAppErrors,
  ZendeskCreateLinkInputSchema,
  ZendeskCreateLinkResponseSchema,
  ZendeskDomainsResponseSchema,
  ZendeskMeResponseSchema,
  ZendeskProjectsResponseSchema,
  ZendeskStatusResponseSchema,
  ZendeskWorkspaceQueryInputSchema,
} from '../schemas';

/**
 * Zendesk App contract
 * Endpoints called from the Zendesk iframe app, authenticated via apiToken (Bearer)
 */

const zendeskAppErrors = {
  ZENDESK_APP_UNAUTHORIZED: ZendeskAppErrors.ZENDESK_APP_UNAUTHORIZED,
  ZENDESK_APP_WORKSPACE_MISMATCH: ZendeskAppErrors.ZENDESK_APP_WORKSPACE_MISMATCH,
};

/**
 * POST /zendesk/links
 * Create a recording link from the Zendesk iframe app
 */
export const createLink = oc
  .route({
    method: 'POST',
    path: '/zendesk/links',
    inputStructure: 'detailed',
    summary: 'Create recording link',
    description: 'Create a recording link from the Zendesk app',
    tags: ['ZendeskApp'],
  })
  .errors({
    ...zendeskAppErrors,
    ZENDESK_APP_AGENT_NOT_FOUND: ZendeskAppErrors.ZENDESK_APP_AGENT_NOT_FOUND,
    ZENDESK_APP_AGENT_NOT_MEMBER: ZendeskAppErrors.ZENDESK_APP_AGENT_NOT_MEMBER,
    ZENDESK_APP_RECORDING_LIMIT_EXCEEDED: ZendeskAppErrors.ZENDESK_APP_RECORDING_LIMIT_EXCEEDED,
  })
  .input(ZendeskCreateLinkInputSchema)
  .output(ZendeskCreateLinkResponseSchema);

/**
 * GET /zendesk/projects
 * List workspace projects
 */
export const getProjects = oc
  .route({
    method: 'GET',
    path: '/zendesk/projects',
    inputStructure: 'detailed',
    summary: 'List workspace projects',
    description: 'List projects available for recording links',
    tags: ['ZendeskApp'],
  })
  .errors(zendeskAppErrors)
  .input(ZendeskWorkspaceQueryInputSchema)
  .output(ZendeskProjectsResponseSchema);

/**
 * GET /zendesk/domains
 * List workspace domains
 */
export const getDomains = oc
  .route({
    method: 'GET',
    path: '/zendesk/domains',
    inputStructure: 'detailed',
    summary: 'List workspace domains',
    description: 'List domains available for recording links',
    tags: ['ZendeskApp'],
  })
  .errors(zendeskAppErrors)
  .input(ZendeskWorkspaceQueryInputSchema)
  .output(ZendeskDomainsResponseSchema);

/**
 * GET /zendesk/status
 * Integration health check
 */
export const getStatus = oc
  .route({
    method: 'GET',
    path: '/zendesk/status',
    inputStructure: 'detailed',
    summary: 'Integration status',
    description: 'Check Zendesk integration health',
    tags: ['ZendeskApp'],
  })
  .errors(zendeskAppErrors)
  .input(ZendeskWorkspaceQueryInputSchema)
  .output(ZendeskStatusResponseSchema);

/**
 * GET /zendesk/me
 * Returns workspace context from apiToken auth
 */
export const getMe = oc
  .route({
    method: 'GET',
    path: '/zendesk/me',
    summary: 'Get workspace context',
    description: 'Returns workspace context from the authenticated API token',
    tags: ['ZendeskApp'],
  })
  .errors({
    ZENDESK_APP_UNAUTHORIZED: ZendeskAppErrors.ZENDESK_APP_UNAUTHORIZED,
  })
  .output(ZendeskMeResponseSchema);
