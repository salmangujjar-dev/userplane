import type { App } from '@modelcontextprotocol/ext-apps';

/**
 * Extract the JSON payload from an MCP tool result.
 *
 * Per OpenAI's Apps SDK, `structuredContent` is the canonical widget data channel
 * (see https://developers.openai.com/apps-sdk/build/mcp-server) — ChatGPT's bridge
 * reshapes `content[0].text` when structuredContent is absent, which double-encodes
 * the payload. Prefer structuredContent when present; fall back to parsing
 * `content[0].text` for hosts/servers that still only emit text.
 */
export function extractJsonFromResult(result: {
  structuredContent?: unknown;
  content?: Array<{ type: string; text?: string }>;
}): unknown {
  if (
    result.structuredContent !== undefined &&
    result.structuredContent !== null &&
    typeof result.structuredContent === 'object'
  ) {
    return result.structuredContent;
  }

  const textBlocks = (result.content ?? []).filter(
    (c): c is { type: 'text'; text: string } => c.type === 'text' && typeof c.text === 'string'
  );

  if (textBlocks.length === 0) throw new Error('No text content in tool result');

  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const text = textBlocks[i]!.text;
    try {
      return JSON.parse(text);
    } catch {
      const jsonStart = text.indexOf('{');
      if (jsonStart >= 0) {
        try {
          return JSON.parse(text.slice(jsonStart));
        } catch {
          /* continue */
        }
      }
    }
  }

  throw new Error(textBlocks[textBlocks.length - 1]!.text);
}

/**
 * Fetch log data via the MCP server tool channel.
 * Workaround for Claude.ai CSP blocking fetch() to R2 domains.
 */
export async function fetchLogViaTool<T>(
  app: App,
  workspaceId: string,
  recordingId: string,
  resourceType: 'consoleLog' | 'networkLog' | 'action'
): Promise<T[]> {
  const result = await app.callServerTool({
    name: 'userplane_app_fetch_resource',
    arguments: { workspaceId, recordingId, resourceType },
  });

  const data = extractJsonFromResult(result) as {
    error?: string;
    json?: unknown;
    resourceType?: string;
  };
  if (data.error) throw new Error(data.error);
  if (data.json === undefined) throw new Error('No data returned');

  return Array.isArray(data.json) ? (data.json as T[]) : [];
}
