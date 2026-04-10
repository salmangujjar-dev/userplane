import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/** Load a built single-file HTML from the @userplane/mcp-apps dist folder. */
function loadAppHtml(appName: string): string | null {
  try {
    const pkgPath = import.meta.resolve('@userplane/mcp-apps/package.json');
    const pkgDir = dirname(fileURLToPath(pkgPath));
    return readFileSync(join(pkgDir, 'dist', appName, 'index.html'), 'utf-8');
  } catch {
    console.warn(`[mcp-apps] Failed to load ${appName} HTML — MCP App UI will be unavailable.`);
    return null;
  }
}

/** Pre-loaded app HTML — read at import time to avoid per-request I/O. */
const APP_HTML = {
  showRecording: loadAppHtml('show-recording'),
} as const;

/** Resource URI constants used by tools to reference their UI. */
export const APP_RESOURCE_URIS = {
  showRecording: 'ui://userplane/show-recording',
} as const;

/**
 * Register MCP App UI resources on the server instance.
 * Each resource serves a bundled HTML page for an MCP App view.
 * Skips registration if the HTML file was not found at startup.
 */
export function registerAppResources(server: McpServer) {
  if (APP_HTML.showRecording) {
    const html = APP_HTML.showRecording;
    registerAppResource(
      server,
      'show-recording-ui',
      APP_RESOURCE_URIS.showRecording,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => ({
        contents: [
          {
            uri: APP_RESOURCE_URIS.showRecording,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      })
    );
  }
}
