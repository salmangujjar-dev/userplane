/**
 * MCP connection schemas
 * Schemas for listing and revoking authorized MCP client connections.
 * Pinned to the OAuth data model (oauth_client + oauth_consent + tokens).
 */

import { z } from 'zod';

import { MCP_CONNECTION_PAGINATION } from '../constants/pagination';
import { PaginationMetaSchema } from './common';

// =============================================================================
// Scope display labels (shared between consent page and connections UI)
// =============================================================================

export const MCP_SCOPE_LABELS: Record<string, string> = {
  openid: 'Verify your identity',
  profile: 'View your profile information',
  email: 'View your email address',
  'mcp:tools': 'Access workspace tools and data',
  offline_access: 'Stay connected between sessions',
};

// =============================================================================
// MCP connection schemas
// =============================================================================

export const McpConnectionListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(MCP_CONNECTION_PAGINATION.MIN_PER_PAGE)
      .max(MCP_CONNECTION_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(MCP_CONNECTION_PAGINATION.DEFAULT_PER_PAGE),
  }),
});

export const McpConnectionDataSchema = z.object({
  clientId: z.string(),
  name: z.string().nullable(),
  icon: z.string().nullable(),
  uri: z.string().nullable(),
  softwareVersion: z.string().nullable(),
  scopes: z.array(z.string()),
  authorizedAt: z.string(),
  tokenStatus: z.enum(['active', 'inactive']),
  lastTokenIssuedAt: z.string().nullable(),
});

export const McpConnectionListDataSchema = z.object({
  connections: z.array(McpConnectionDataSchema),
  pagination: PaginationMetaSchema,
});

export const McpConnectionByClientIdSchema = z.object({
  params: z.object({
    clientId: z.string(),
  }),
});

export const McpConnectionRevokeDataSchema = z.object({
  revoked: z.literal(true),
});

// =============================================================================
// Type exports
// =============================================================================

export type McpConnectionData = z.infer<typeof McpConnectionDataSchema>;
export type McpConnectionListData = z.infer<typeof McpConnectionListDataSchema>;
