/**
 * Which MCP host is calling us. Drives `_meta.ui.domain` resolution — Claude
 * requires a SHA-256 hash subdomain, ChatGPT wants a full origin URL, unknown
 * clients default to the URL form (same as ChatGPT) since it's what every
 * non-Claude MCP client accepts.
 */
export type McpHost = 'claude' | 'chatgpt' | 'unknown';

/**
 * Detect the calling MCP host from HTTP headers on the raw Request.
 *
 * Our transport is stateless (`sessionIdGenerator: undefined`) so we can't
 * rely on `server.getClientVersion()` — the MCP initialize handshake doesn't
 * reliably survive across POSTs. Instead we mirror Sunpeak's production
 * stateless pattern: check UA first, then vendor-specific fallback headers.
 *
 * Exact strings verified against Sunpeak-AI/sunpeak
 * `packages/sunpeak/src/mcp/stateless.test.ts`:
 *   - Claude.ai MCP connector UA contains "Claude-User"
 *   - ChatGPT MCP connector UA is "openai-mcp/1.0.0"
 *   - `x-anthropic-client: ClaudeAI` and `x-openai-session: v1/...` are the
 *     vendor fallbacks for proxy-rewritten UAs.
 *
 * This function is intentionally pure (no logger/env imports) so it's
 * unit-testable without the full API bootstrap.
 */
export function detectMcpHost(req: Request): McpHost {
  const ua = (req.headers.get('user-agent') ?? '').toLowerCase();

  // Explicit ChatGPT UA check first — `openai-mcp` is specific enough that a
  // substring collision is implausible. Check before `claude` so ambiguous UAs
  // resolve deterministically.
  if (ua.includes('openai-mcp') || ua.includes('chatgpt')) {
    return 'chatgpt';
  }

  // Claude — covers "Claude-User", "claude-ai/*", "anthropic-*".
  if (ua.includes('claude') || ua.includes('anthropic')) {
    return 'claude';
  }

  // Vendor header fallbacks — triggered when a proxy rewrites UA.
  if (req.headers.get('x-anthropic-client')) {
    return 'claude';
  }
  if (req.headers.get('x-openai-session')) {
    return 'chatgpt';
  }

  return 'unknown';
}
