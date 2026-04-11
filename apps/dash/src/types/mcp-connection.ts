/**
 * MCP connection types - pinned to contract schemas
 * Re-exports from @userplane/contract for type consistency
 */

import type { McpConnectionDataSchema, McpConnectionListDataSchema } from '@userplane/contract';
import type { z } from 'zod';

/** Authorized MCP client connection — pinned to contract schema */
export type McpConnectionData = z.infer<typeof McpConnectionDataSchema>;

/** Paginated list of MCP connections — pinned to contract schema */
export type McpConnectionListData = z.infer<typeof McpConnectionListDataSchema>;
