import '@userplane/ui/globals.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Preview } from '@storybook/react-vite';
import { TooltipProvider } from '@userplane/ui/components/tooltip';
import React from 'react';

// Mock chrome extension APIs for Storybook environment
if (typeof globalThis.chrome === 'undefined') {
  const noop = () => {};
  const noopPromise = () => Promise.resolve({});
  const storage = {
    get: noopPromise,
    set: noopPromise,
    remove: noopPromise,
    onChanged: { addListener: noop, removeListener: noop },
  };
  globalThis.chrome = {
    storage: {
      local: storage,
      session: storage,
      sync: storage,
    },
    tabs: {
      create: noopPromise,
    },
    windows: {
      getCurrent: () => Promise.resolve({ id: 1 }),
    },
    commands: {
      getAll: () => Promise.resolve([]),
    },
    runtime: {
      sendMessage: noopPromise,
      onMessage: { addListener: noop, removeListener: noop },
    },
  } as unknown as typeof chrome;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

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
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <Story />
        </TooltipProvider>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
