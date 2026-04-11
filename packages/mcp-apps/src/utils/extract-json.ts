import type { App } from '@modelcontextprotocol/ext-apps';

/**
 * Extract JSON from a tool result's text content blocks.
 * Tries direct JSON.parse first, then looks for embedded JSON if the host
 * wrapped the text with a prefix.
 */
export function extractJsonFromResult(result: {
  content?: Array<{ type: string; text?: string }>;
}): unknown {
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

  const textContent = result.content?.find((c: { type: string }) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') throw new Error('No text content');

  const data = JSON.parse(textContent.text);
  if (data.error) throw new Error(data.error);
  if (!data.json) throw new Error('No data returned');

  return Array.isArray(data.json) ? data.json : [];
}
