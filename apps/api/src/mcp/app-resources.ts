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
  showRecConsole: loadAppHtml('show-rec-console'),
  showRecNetwork: loadAppHtml('show-rec-network'),
  showRecActions: loadAppHtml('show-rec-actions'),
} as const;

/** Resource URI constants used by tools to reference their UI. */
export const APP_RESOURCE_URIS = {
  preview: 'ui://userplane/preview',
  console: 'ui://userplane/console',
  network: 'ui://userplane/network',
  actions: 'ui://userplane/actions',
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
      'preview-ui',
      APP_RESOURCE_URIS.preview,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => ({
        contents: [
          {
            uri: APP_RESOURCE_URIS.preview,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      })
    );
  }

  if (APP_HTML.showRecConsole) {
    const html = APP_HTML.showRecConsole;
    registerAppResource(
      server,
      'console-ui',
      APP_RESOURCE_URIS.console,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => ({
        contents: [
          {
            uri: APP_RESOURCE_URIS.console,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      })
    );
  }

  if (APP_HTML.showRecNetwork) {
    const html = APP_HTML.showRecNetwork;
    registerAppResource(
      server,
      'network-ui',
      APP_RESOURCE_URIS.network,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => ({
        contents: [
          {
            uri: APP_RESOURCE_URIS.network,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      })
    );
  }

  if (APP_HTML.showRecActions) {
    const html = APP_HTML.showRecActions;
    registerAppResource(
      server,
      'actions-ui',
      APP_RESOURCE_URIS.actions,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => ({
        contents: [
          {
            uri: APP_RESOURCE_URIS.actions,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
          },
        ],
      })
    );
  }
}
