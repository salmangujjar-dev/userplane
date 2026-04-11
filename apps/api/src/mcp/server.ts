/**
 * MCP Server — tool definitions backed by existing service layer
 *
 * Maps the public API surface 1:1 to MCP tools so AI agents (Claude, Cursor,
 * VS Code Copilot, etc.) can manage recordings, links, projects and workspaces
 * via OAuth 2.1-authenticated tool calls.
 *
 * Architecture:
 * - Each tool validates workspace membership using the same path as the REST API
 * - All business logic is delegated to existing services — zero duplication
 * - The `userId` is injected per-request from the verified JWT (see handler.ts)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerAppResources } from './app-resources';
import { registerLinkTools } from './tools/links';
import { registerProjectTools } from './tools/projects';
import { registerRecordingResourceTools } from './tools/recording-resources';
import { registerRecordingTools } from './tools/recordings';
import { registerShowRecordingTools } from './tools/show-recording';
import { registerShowResourceAppTools } from './tools/show-resource-apps';
import { registerUserTools } from './tools/user';
import { registerWorkspaceTools } from './tools/workspaces';
import type { McpDeps, McpRequestContext } from './types';

export type { McpDeps, McpRequestContext } from './types';

/**
 * Create a fresh McpServer instance with all tools registered.
 *
 * Called per-request so that each request gets its own server instance
 * with the correct `userId` bound via `requestCtx`.
 */
export function createMcpServer(deps: McpDeps, requestCtx: McpRequestContext) {
  const server = new McpServer({
    name: 'userplane',
    version: '1.0.0',
  });

  const { userId } = requestCtx;

  registerUserTools(server, deps, userId);
  registerWorkspaceTools(server, deps, userId);
  registerProjectTools(server, deps, userId);
  registerRecordingTools(server, deps, userId);
  registerRecordingResourceTools(server, deps, userId);
  registerLinkTools(server, deps, userId);

  // MCP Apps: interactive UI tools + resources
  registerShowRecordingTools(server, deps, userId);
  registerShowResourceAppTools(server, deps, userId);
  registerAppResources(server);

  return server;
}
