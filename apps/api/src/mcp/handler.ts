/**
 * MCP HTTP handler — bridges Hono requests to the MCP server
 *
 * Uses the `mcpHandler` helper from @better-auth/oauth-provider for JWT
 * verification and WWW-Authenticate challenge on 401.
 *
 * Transport: WebStandardStreamableHTTPServerTransport (stateless mode) —
 * no session management needed since every tool call is a standalone
 * request-response roundtrip.
 */

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { mcpHandler } from '@userplane/auth';
import type { Context } from 'hono';

import { env } from '@/api/env';
import { createLogger } from '@/api/lib/logger';

import { createMcpServer, type McpDeps } from './server';

const logger = createLogger('mcp');

/**
 * Create a Hono-compatible handler for the /mcp endpoint.
 *
 * The handler:
 * 1. Verifies the Bearer JWT via JWKS (issuer + audience checks)
 * 2. Returns 401 + WWW-Authenticate if unauthenticated (triggers MCP client OAuth flow)
 * 3. Creates a per-request MCP server with the authenticated user's context
 * 4. Delegates to WebStandardStreamableHTTPServerTransport for protocol handling
 */
export function createMcpHandler(deps: McpDeps) {
  const authBaseUrl = `${env.auth.url}/api/auth`;

  const handler = mcpHandler(
    {
      jwksUrl: `${authBaseUrl}/jwks`,
      verifyOptions: {
        issuer: authBaseUrl,
        audience: `${env.auth.url}/mcp`,
      },
      scopes: ['mcp:tools'],
    },
    async (req: Request, jwt: { sub?: string; scope?: string; [key: string]: unknown }) => {
      const userId = jwt.sub;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Token missing subject claim' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create a per-request MCP server with the authenticated user bound
      const server = createMcpServer(deps, { userId });

      // Stateless transport with JSON responses — no session tracking, no SSE streaming.
      // enableJsonResponse ensures handleRequest() waits for all tool responses before
      // returning, so transport.close() after it is safe (no premature stream closure).
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      // Connect the server to the transport
      await server.connect(transport);

      // Let the transport handle the request and produce a Response
      const response = await transport.handleRequest(req);

      // Clean up after handling
      await transport.close();
      await server.close();

      return response;
    }
  );

  return async (c: Context) => {
    try {
      const response = await handler(c.req.raw);
      return response;
    } catch (error) {
      logger.error({ err: error }, 'MCP handler error');
      return c.json({ error: 'Internal server error' }, 500);
    }
  };
}
