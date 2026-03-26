import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import React from 'react';

import { SidePanelNav } from './side-panel-nav';

// SidePanelLayout uses chrome.storage and Outlet. We render the visual
// structure directly with placeholder content to demonstrate the layout.

function MockSidePanelLayout({ content }: { content: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-1 overflow-y-auto">{content}</main>
      <SidePanelNav />
    </div>
  );
}

function createLayoutRouter(initialPath: string, content: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <MockSidePanelLayout content={<Outlet />} />,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{content}</>,
  });
  const recordingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/recordings',
    component: () => <>{content}</>,
  });
  const createRoute2 = createRoute({
    getParentRoute: () => rootRoute,
    path: '/create',
    component: () => <>{content}</>,
  });
  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => <>{content}</>,
  });

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, recordingsRoute, createRoute2, settingsRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

const meta = {
  title: 'Layout/SidePanelLayout',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

export const WithLinksPage: StoryObj = {
  name: 'Links Page',
  render: () => {
    const pageContent = (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-lg font-semibold">Links</h1>
            <p className="text-sm text-muted-foreground">Manage recording links</p>
          </div>
          <div className="h-8 w-24 bg-primary rounded-md" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted/60 rounded" />
              </div>
              <div className="h-8 w-8 bg-muted rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
    return <RouterProvider router={createLayoutRouter('/', pageContent)} />;
  },
};

export const WithRecordingsPage: StoryObj = {
  name: 'Recordings Page',
  render: () => {
    const pageContent = (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-lg font-semibold">Recordings</h1>
            <p className="text-sm text-muted-foreground">View received recordings</p>
          </div>
          <div className="h-8 w-24 bg-primary rounded-md" />
        </div>
        <div className="grid gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg p-3">
              <div className="aspect-video w-full rounded-lg bg-muted" />
              <div className="pt-2 flex items-center justify-between">
                <div className="h-3 w-24 bg-muted/60 rounded" />
                <div className="h-3 w-12 bg-muted/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    return <RouterProvider router={createLayoutRouter('/recordings', pageContent)} />;
  },
};

export const EmptyState: StoryObj = {
  name: 'Empty Content',
  render: () => {
    const pageContent = (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No content to display</p>
      </div>
    );
    return <RouterProvider router={createLayoutRouter('/', pageContent)} />;
  },
};
