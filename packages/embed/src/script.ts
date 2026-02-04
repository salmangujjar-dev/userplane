/**
 * Userplane Embed Bootstrap Loader
 *
 * Tiny script (~1KB) that fetches manifest and loads the main embed code.
 * This file has a stable URL and short cache (5 min) to allow updates.
 * The main code has a content-hashed filename for immutable caching.
 *
 * Usage:
 * <meta name="userplane:workspace" content="ws_xxx" />
 * <script src="https://cdn.userplane.com/embed/script.js"></script>
 */

(function () {
  'use strict';

  // CDN base URL - replaced at build time or uses default
  const CDN_BASE =
    (typeof __EMBED_CDN_BASE_URL__ !== 'undefined' && __EMBED_CDN_BASE_URL__) ||
    'https://cdn.userplane.com/embed';

  // Find our script element for nonce preservation (CSP support)
  let scriptElement: HTMLScriptElement | null = null;
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const el = scripts[i];
    if (el && el.src && el.src.includes('/embed/script.js')) {
      scriptElement = el;
      break;
    }
  }

  async function load(): Promise<void> {
    try {
      // Fetch manifest with cache-busting
      const manifestUrl = `${CDN_BASE}/manifest.json?t=${Date.now()}`;
      const response = await fetch(manifestUrl, {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status}`);
      }

      const manifest = (await response.json()) as { 'main.js'?: string };
      const mainJs = manifest['main.js'];

      if (!mainJs) {
        throw new Error('main.js not found in manifest');
      }

      // Create and inject main script
      const script = document.createElement('script');
      script.src = `${CDN_BASE}/${mainJs}`;
      script.async = true;
      script.crossOrigin = 'anonymous';

      // Preserve nonce for CSP compliance
      if (scriptElement?.nonce) {
        script.nonce = scriptElement.nonce;
      }

      // Inject into head
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      console.error('[Userplane] Failed to load embed:', error);
    }
  }

  // Load when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();

// Declare global for CDN base URL override
declare const __EMBED_CDN_BASE_URL__: string | undefined;
