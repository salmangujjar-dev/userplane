import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';

import { SidePanelNav } from './side-panel-nav';

function createNavRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
          Page Content
        </div>
        <SidePanelNav />
      </>
    ),
  });

  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
  const recordingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/recordings' });
  const createRoute2 = createRoute({ getParentRoute: () => rootRoute, path: '/create' });
  const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings' });

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, recordingsRoute, createRoute2, settingsRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

const meta = {
  title: 'Layout/SidePanelNav',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

export const LinksActive: StoryObj = {
  name: 'Links Tab Active',
  render: () => <RouterProvider router={createNavRouter('/')} />,
};

export const RecordingsActive: StoryObj = {
  name: 'Recordings Tab Active',
  render: () => <RouterProvider router={createNavRouter('/recordings')} />,
};

export const CreateActive: StoryObj = {
  name: 'Create Tab Active',
  render: () => <RouterProvider router={createNavRouter('/create')} />,
};

export const SettingsActive: StoryObj = {
  name: 'Settings Tab Active',
  render: () => <RouterProvider router={createNavRouter('/settings')} />,
};
