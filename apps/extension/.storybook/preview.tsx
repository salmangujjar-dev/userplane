import '@userplane/ui/globals.css';

import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@userplane/ui/components/tooltip';
import React from 'react';

// ─── Chrome Extension API Mocks ───────────────────────────────────────────────
// Storybook runs outside of a Chrome extension context. We must provide complete
// mocks for every chrome.* API surface that components touch. The mock must run
// *before* any component module is evaluated, and must be unconditional — WXT or
// other tooling may partially define `chrome`, which would skip a naïve guard.

const noop = () => {};
const noopPromise = () => Promise.resolve({});

function makeStorageArea() {
  return {
    get: noopPromise,
    set: noopPromise,
    remove: noopPromise,
    clear: noopPromise,
    onChanged: { addListener: noop, removeListener: noop, hasListener: () => false },
  };
}

// Unconditionally ensure every sub-property exists (deep merge)
const g = globalThis as Record<string, unknown>;
if (!g.chrome) g.chrome = {};
const c = g.chrome as Record<string, unknown>;

// chrome.storage
if (!c.storage) c.storage = {};
const storage = c.storage as Record<string, unknown>;
if (!storage.local) storage.local = makeStorageArea();
if (!storage.session) storage.session = makeStorageArea();
if (!storage.sync) storage.sync = makeStorageArea();
// Top-level onChanged (some code reads chrome.storage.onChanged)
if (!storage.onChanged) storage.onChanged = { addListener: noop, removeListener: noop };

// chrome.tabs
if (!c.tabs) c.tabs = { create: noopPromise, query: noopPromise };

// chrome.windows
if (!c.windows) c.windows = { getCurrent: () => Promise.resolve({ id: 1 }) };

// chrome.commands
if (!c.commands)
  c.commands = {
    getAll: () => Promise.resolve([{ name: 'create-recording-link', shortcut: 'Ctrl+Shift+Y' }]),
  };

// chrome.runtime
if (!c.runtime) c.runtime = {};
const runtime = c.runtime as Record<string, unknown>;
if (!runtime.sendMessage) {
  runtime.sendMessage = (message: { type?: string }) => {
    if (message?.type === 'CHECK_SESSION') {
      return Promise.resolve({
        authenticated: true,
        user: {
          id: 'user-sb-1',
          email: 'alice@example.com',
          name: 'Alice Johnson',
          role: 'admin',
          emailVerified: true,
          image: null,
        },
      });
    }
    if (message?.type === 'GET_ACTIVE_TAB_URL') {
      return Promise.resolve({ url: 'https://example.com' });
    }
    return Promise.resolve({});
  };
}
if (!runtime.onMessage) runtime.onMessage = { addListener: noop, removeListener: noop };

// ─── React Query ──────────────────────────────────────────────────────────────
// Create a fresh QueryClient per story so cache/state never leaks between them.

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// ─── Extension panel dimensions ───────────────────────────────────────────────
// Chrome extension side panels are typically ~400px wide. We constrain all
// stories to this width so what you see in Storybook matches the real extension.

const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 600;

// ─── Preview config ───────────────────────────────────────────────────────────

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      // Fresh QueryClient per story render — prevents cache leakage.
      const [queryClient] = React.useState(makeQueryClient);

      // Stories that already set layout: 'fullscreen' get a fixed extension frame.
      // Centered stories get just the width constraint.
      const isFullscreen = context.parameters.layout === 'fullscreen';

      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            {isFullscreen ? (
              <div
                style={{
                  width: PANEL_WIDTH,
                  height: PANEL_HEIGHT,
                  overflow: 'hidden',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: 12,
                  background: 'var(--background, #fff)',
                }}
              >
                <Story />
              </div>
            ) : (
              <div style={{ width: PANEL_WIDTH }}>
                <Story />
              </div>
            )}
          </TooltipProvider>
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
