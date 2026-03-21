/**
 * Zendesk Iframe Handler
 * Serves the Zendesk app as a server-side iframe.
 *
 * GET /zendesk/iframe?origin=https://subdomain.zendesk.com&app_guid=...
 *
 * 1. Extracts subdomain from the origin param
 * 2. Looks up the integration by subdomain
 * 3. Serves HTML with window.__ZENDESK_CONFIG__ injected (apiToken if connected, needsSetup if not)
 * 4. References the built React app JS/CSS from /zendesk/assets/
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import type { Context } from 'hono';

import { createLogger } from '@/api/lib/logger';
import type { IntegrationRepository } from '@/api/repositories/integrations.repository';

const logger = createLogger('zendesk-iframe');

/** Vite manifest entry */
interface ViteManifestEntry {
  file: string;
  css?: string[];
  isEntry?: boolean;
}

/** Cached Vite manifest for asset discovery */
let viteManifestCache: Record<string, ViteManifestEntry> | null = null;

function getViteManifest(distDir: string): Record<string, ViteManifestEntry> | null {
  if (viteManifestCache) return viteManifestCache;

  const manifestPath = resolve(distDir, '.vite/manifest.json');
  if (!existsSync(manifestPath)) {
    logger.warn({ manifestPath }, 'Vite manifest not found');
    return null;
  }

  try {
    viteManifestCache = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    return viteManifestCache;
  } catch (err) {
    logger.error({ err, manifestPath }, 'Failed to parse Vite manifest');
    return null;
  }
}

/**
 * Extract Zendesk subdomain from the origin URL.
 * e.g. "https://mycompany.zendesk.com" → "mycompany"
 */
function extractSubdomain(origin: string): string | null {
  try {
    const url = new URL(origin);
    const match = url.hostname.match(/^([^.]+)\.zendesk\.com$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export interface ZendeskIframeHandlerDeps {
  integrationRepo: IntegrationRepository;
  zendeskAppDistDir: string;
}

export function createZendeskIframeHandler(deps: ZendeskIframeHandlerDeps) {
  return async (c: Context) => {
    const origin = c.req.query('origin') ?? '';
    const subdomain = extractSubdomain(origin);

    // Look up integration if we have a subdomain
    let configJson = '{"needsSetup":true,"subdomain":null}';

    if (subdomain) {
      try {
        const integration = await deps.integrationRepo.findByProviderWorkspaceId(
          'zendesk',
          subdomain
        );

        if (integration) {
          const apiToken = (integration.providerToken as { apiToken?: string })?.apiToken;
          if (apiToken) {
            configJson = JSON.stringify({
              apiToken,
              workspaceId: integration.workspaceId,
              subdomain,
            });
          } else {
            configJson = JSON.stringify({ needsSetup: true, subdomain });
          }
        } else {
          configJson = JSON.stringify({ needsSetup: true, subdomain });
        }
      } catch (err) {
        logger.error({ err, subdomain }, 'Failed to look up integration');
        configJson = JSON.stringify({ needsSetup: true, subdomain });
      }
    }

    // Discover built assets from Vite manifest
    const manifest = getViteManifest(deps.zendeskAppDistDir);
    let jsFile = '';
    let cssFiles: string[] = [];

    if (manifest) {
      // Find the entry point in the Vite manifest
      const entry = Object.values(manifest).find((e) => e.isEntry);
      if (entry) {
        jsFile = `/zendesk/assets/${entry.file}`;
        cssFiles = (entry.css ?? []).map((f) => `/zendesk/assets/${f}`);
      }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Userplane</title>
  <script src="https://static.zdassets.com/zendesk_app_framework_sdk/2.0/zaf_sdk.min.js"></script>
${cssFiles.map((f) => `  <link rel="stylesheet" href="${f}">`).join('\n')}
</head>
<body>
  <div id="root"></div>
  <script>window.__ZENDESK_CONFIG__=${configJson};</script>
${jsFile ? `  <script type="module" src="${jsFile}"></script>` : '  <p>App assets not found.</p>'}
</body>
</html>`;

    c.header('Content-Security-Policy', 'frame-ancestors https://*.zendesk.com');
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    return c.html(html);
  };
}
