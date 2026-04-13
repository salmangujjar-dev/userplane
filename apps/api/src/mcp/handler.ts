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

import { detectMcpHost, type McpHost } from './host-detection';
import { createMcpServer, type McpDeps } from './server';

const logger = createLogger('mcp');

/**
 * One-shot log gate: we log each distinct detected host exactly once per
 * process so we can verify empirically (on real Claude traffic) that the
 * detection branch fires without spamming the log on every request.
 */
const loggedHosts = new Set<McpHost>();

function logFirstHostDetection(host: McpHost, req: Request): void {
  if (loggedHosts.has(host)) return;
  loggedHosts.add(host);
  logger.info(
    {
      mcpHost: host,
      ua: req.headers.get('user-agent'),
      hasAnthropicHeader: !!req.headers.get('x-anthropic-client'),
      hasOpenAiHeader: !!req.headers.get('x-openai-session'),
    },
    'mcp host detected'
  );
}

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

      // Post-auth per-user rate limit. The pre-auth IP ceiling on /mcp is
      // keyed on client IP, which collapses to a single bucket for every
      // Claude Desktop / ChatGPT user sharing their proxy's egress — so a
      // real per-user cap has to live here, after JWT verification.
      //
      // Minute + day windows are enforced as two separate tiers; both are
      // checked in parallel. `rateLimiter.check` handles its own fail-open
      // (disabled limiter, missing tier, Redis errors → success:true) so no
      // outer guard is needed.
      const [minute, day] = await Promise.all([
        deps.rateLimiter.check('mcp_user_minute', userId),
        deps.rateLimiter.check('mcp_user_day', userId),
      ]);
      const blocked = !minute.success ? minute : !day.success ? day : null;
      if (blocked) {
        logger.warn(
          {
            userId,
            window: !minute.success ? 'minute' : 'day',
            retryAfter: blocked.retryAfter,
          },
          'mcp user rate limit exceeded'
        );
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', retryAfter: blocked.retryAfter }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(blocked.retryAfter ?? 60),
              'X-RateLimit-Limit': String(blocked.limit),
              'X-RateLimit-Remaining': String(blocked.remaining),
              'X-RateLimit-Reset': String(blocked.reset),
            },
          }
        );
      }

      // Create a per-request MCP server with the authenticated user bound.
      // Host is detected from HTTP headers (stateless transport means we
      // can't rely on MCP clientInfo) — see `host-detection.ts`.
      const mcpHost = detectMcpHost(req);
      logFirstHostDetection(mcpHost, req);
      const server = createMcpServer(deps, { userId, mcpHost });

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
