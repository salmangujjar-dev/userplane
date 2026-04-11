import type { App } from '@modelcontextprotocol/ext-apps';

/** Sync the iframe theme with the MCP host's theme (dark/light). */
export function setupThemeSync(app: App) {
  app.onhostcontextchanged = (context) => {
    const root = document.documentElement;

    if (context.theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    // Apply any host-provided CSS variables
    if (context.styles) {
      for (const [key, value] of Object.entries(context.styles)) {
        root.style.setProperty(key, String(value));
      }
    }
  };
}
