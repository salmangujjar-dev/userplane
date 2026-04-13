import { z } from 'zod';

import { DomainIdSchema, DomainStatusSchema, WorkspaceIdSchema } from '../../schemas/common';
import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneListDomains = {
  name: 'userplane_list_domains',
  title: 'List domains',
  description:
    'List custom domains registered to a workspace. Each domain has a status (pending/verified/revoked). Use the `domainId` of a verified domain when calling userplane_create_link. Filter by status to find only usable domains.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    page: z.number().int().positive().optional().describe('Page number (default: 1)'),
    per_page: z
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .describe('Results per page (default: 10, max: 50)'),
    status: DomainStatusSchema.optional().describe(
      'Filter by status ("pending", "verified", "revoked"). Omit to return all.'
    ),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetDomain = {
  name: 'userplane_get_domain',
  title: 'Get domain details',
  description:
    'Retrieve details for a single custom domain including URL, verification status, and creation time.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    domainId: z.string().describe('Domain ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * Flat domain row. Drops the 5 recording-capture booleans (separate concern
 * agents can't toggle via MCP) and audit timestamps (`updatedAt`, `deletedAt`).
 */
export const McpDomainItemSchema = z.object({
  domainId: DomainIdSchema,
  domainUrl: z.string(),
  domainStatus: DomainStatusSchema,
  createdAt: z.coerce.date(),
});

export const McpDomainResponseSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  domain: McpDomainItemSchema,
});

export const McpListDomainsSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  domains: z.array(McpDomainItemSchema),
  total: z.number().int().nonnegative(),
});

export type McpDomainItem = z.infer<typeof McpDomainItemSchema>;
export type McpDomainResponse = z.infer<typeof McpDomainResponseSchema>;
export type McpListDomains = z.infer<typeof McpListDomainsSchema>;
