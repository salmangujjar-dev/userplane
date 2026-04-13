import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { env } from '@/api/env';

import type { McpHost } from './host-detection';
import type { McpRequestContext } from './types';

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
 * `_meta.ui.domain` is host-dependent — each MCP host enforces its own format:
 *   - ChatGPT Apps SDK expects a full origin URL; it derives its own
 *     `<slug>.web-sandbox.oaiusercontent.com` sandbox subdomain from it.
 *   - Claude.ai expects `sha256(mcpServerUrl).hex.slice(0, 32).claudemcpcontent.com`
 *     and rejects anything else with `Invalid ui.domain format`.
 *
 * We pick the right value per-request based on the detected host (see
 * `host-detection.ts`). We can't use `clientInfo.name` from the MCP initialize
 * handshake because our transport is stateless (`sessionIdGenerator: undefined`)
 * — each POST creates a fresh McpServer, so by the time a `resources/read`
 * callback fires, `_clientVersion` is undefined. Host detection runs on the
 * raw HTTP Request in the handler and is threaded in via `McpRequestContext`.
 */
// Normalize once so a stray trailing slash in BETTER_AUTH_URL can't silently
// break the Claude hash (which Claude.ai matches byte-for-byte).
const AUTH_ORIGIN = env.auth.url.replace(/\/+$/, '');

const CHATGPT_WIDGET_DOMAIN = AUTH_ORIGIN;

const CLAUDE_WIDGET_DOMAIN = (() => {
  const hash = createHash('sha256').update(`${AUTH_ORIGIN}/mcp`).digest('hex').slice(0, 32);
  return `${hash}.claudemcpcontent.com`;
})();

function resolveWidgetDomain(host: McpHost): string {
  return host === 'claude' ? CLAUDE_WIDGET_DOMAIN : CHATGPT_WIDGET_DOMAIN;
}

/**
 * Build the `_meta.ui` block attached to every MCP App template's contents.
 * CSP origins are derived from env so the iframe can fetch presigned R2 URLs
 * and CDN assets. `host` is the detected MCP host (see `detectMcpHost`), used
 * to pick the host-specific widget domain form.
 */
export function buildAppWidgetMeta(host: McpHost) {
  const connectOrigins = new Set<string>();
  const resourceOrigins = new Set<string>();

  // Custom CDN domains (CDN proxy in front of R2)
  for (const url of [env.storage.assetsDomain, env.storage.cdnDomain]) {
    try {
      const { protocol, hostname } = new URL(url);
      const origin = `${protocol}//${hostname}`;
      connectOrigins.add(origin);
      resourceOrigins.add(origin);
    } catch {
      // skip invalid URLs
    }
  }

  // Direct R2 presigned URL origins (https://{accountId}.r2.cloudflarestorage.com)
  for (const accountId of new Set([
    env.storage.assets.accountId,
    env.storage.cdn.accountId,
    env.storage.reports.accountId,
  ])) {
    const origin = `https://${accountId}.r2.cloudflarestorage.com`;
    connectOrigins.add(origin);
    resourceOrigins.add(origin);
  }

  return {
    ui: {
      csp: {
        connectDomains: [...connectOrigins],
        resourceDomains: [...resourceOrigins],
      },
      domain: resolveWidgetDomain(host),
      prefersBorder: true,
    },
  } as const;
}

export type AppWidgetMeta = ReturnType<typeof buildAppWidgetMeta>;

/**
 * Register MCP App UI resources on the server instance.
 * Each resource serves a bundled HTML page for an MCP App view.
 * Skips registration if the HTML file was not found at startup.
 *
 * NOTE: Claude.ai currently ignores the `_meta.ui.csp` fields
 * (anthropics/claude-ai-mcp#40). We still declare them so the app works on
 * hosts that respect them (ChatGPT, GitHub Copilot, MCP-Jam) and on Claude.ai
 * once they fix the bug. The `userplane_app_fetch_resource` tool exists as a
 * postMessage fallback specifically for the Claude.ai CSP gap.
 */
export function registerAppResources(server: McpServer, ctx: McpRequestContext) {
  // Per-request widget metadata. The host-specific domain form comes from the
  // detected MCP host on this request (see `detectMcpHost` for why we derive
  // it from HTTP headers rather than MCP clientInfo). Computed once per
  // McpServer instance and closed over by the 4 read-callbacks below.
  const widgetMeta = buildAppWidgetMeta(ctx.mcpHost);

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
            _meta: widgetMeta,
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
            _meta: widgetMeta,
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
            _meta: widgetMeta,
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
            _meta: widgetMeta,
          },
        ],
      })
    );
  }
}
