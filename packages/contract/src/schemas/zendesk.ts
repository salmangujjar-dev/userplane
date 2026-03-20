/**
 * Zendesk app endpoint schemas
 * Shared between API handlers and Zendesk iframe client
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

/**
 * Body for POST /api/v1/zendesk/links
 */
export const ZendeskCreateLinkBodySchema = z.object({
  workspaceId: z.string(),
  projectId: z.string(),
  domainId: z.string(),
  agentEmail: z.string().email(),
  ticketId: z.string().optional(),
  ticketSubject: z.string().optional(),
  ticketPriority: z.string().optional(),
  ticketType: z.string().optional(),
  ticketTags: z.array(z.string()).optional(),
  requesterName: z.string().optional(),
  requesterEmail: z.string().optional(),
  agentName: z.string().optional(),
});

export type ZendeskCreateLinkBody = z.infer<typeof ZendeskCreateLinkBodySchema>;

/**
 * Query params shared by projects, domains, and status endpoints
 */
export const ZendeskWorkspaceQuerySchema = z.object({
  workspaceId: z.string(),
});

export type ZendeskWorkspaceQuery = z.infer<typeof ZendeskWorkspaceQuerySchema>;

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const ZendeskCreateLinkResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    linkId: z.string(),
    linkUrl: z.string(),
  }),
});

export type ZendeskCreateLinkResponse = z.infer<typeof ZendeskCreateLinkResponseSchema>;

export const ZendeskProjectsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    projects: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    ),
  }),
});

export type ZendeskProjectsResponse = z.infer<typeof ZendeskProjectsResponseSchema>;
export type ZendeskProject = ZendeskProjectsResponse['data']['projects'][number];

export const ZendeskDomainsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    domains: z.array(
      z.object({
        id: z.string(),
        url: z.string(),
        verified: z.boolean(),
      })
    ),
  }),
});

export type ZendeskDomainsResponse = z.infer<typeof ZendeskDomainsResponseSchema>;
export type ZendeskDomain = ZendeskDomainsResponse['data']['domains'][number];

export const ZendeskStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.string(),
    workspaceId: z.string(),
  }),
});

export type ZendeskStatusResponse = z.infer<typeof ZendeskStatusResponseSchema>;

export const ZendeskErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type ZendeskErrorResponse = z.infer<typeof ZendeskErrorResponseSchema>;
