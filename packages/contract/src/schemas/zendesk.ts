/**
 * Zendesk app endpoint schemas
 * Shared between API handlers and Zendesk iframe client via ORPC contract
 */

import { z } from 'zod';

import { ApiResponseSchema } from './common';

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

/**
 * Input for POST /zendesk/links
 * Uses ORPC 'detailed' inputStructure: body + query
 */
export const ZendeskCreateLinkInputSchema = z.object({
  query: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
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
  }),
});

export type ZendeskCreateLinkInput = z.infer<typeof ZendeskCreateLinkInputSchema>;

/**
 * Input for GET /zendesk/projects, /zendesk/domains, /zendesk/status
 */
export const ZendeskWorkspaceQueryInputSchema = z.object({
  query: z.object({
    workspaceId: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// Response data schemas (used with ApiResponseSchema)
// ---------------------------------------------------------------------------

export const ZendeskCreateLinkDataSchema = z.object({
  linkId: z.string(),
  linkUrl: z.string(),
});

export const ZendeskCreateLinkResponseSchema = ApiResponseSchema(ZendeskCreateLinkDataSchema);
export type ZendeskCreateLinkResponse = z.infer<typeof ZendeskCreateLinkResponseSchema>;

export const ZendeskProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ZendeskProjectsDataSchema = z.object({
  projects: z.array(ZendeskProjectSchema),
});

export const ZendeskProjectsResponseSchema = ApiResponseSchema(ZendeskProjectsDataSchema);
export type ZendeskProjectsResponse = z.infer<typeof ZendeskProjectsResponseSchema>;
export type ZendeskProject = z.infer<typeof ZendeskProjectSchema>;

export const ZendeskDomainSchema = z.object({
  id: z.string(),
  url: z.string(),
  verified: z.boolean(),
});

export const ZendeskDomainsDataSchema = z.object({
  domains: z.array(ZendeskDomainSchema),
});

export const ZendeskDomainsResponseSchema = ApiResponseSchema(ZendeskDomainsDataSchema);
export type ZendeskDomainsResponse = z.infer<typeof ZendeskDomainsResponseSchema>;
export type ZendeskDomain = z.infer<typeof ZendeskDomainSchema>;

export const ZendeskStatusDataSchema = z.object({
  status: z.string(),
  workspaceId: z.string(),
});

export const ZendeskStatusResponseSchema = ApiResponseSchema(ZendeskStatusDataSchema);
export type ZendeskStatusResponse = z.infer<typeof ZendeskStatusResponseSchema>;

export const ZendeskMeDataSchema = z.object({
  workspaceId: z.string(),
  subdomain: z.string(),
  status: z.string(),
});

export const ZendeskMeResponseSchema = ApiResponseSchema(ZendeskMeDataSchema);
export type ZendeskMeResponse = z.infer<typeof ZendeskMeResponseSchema>;
