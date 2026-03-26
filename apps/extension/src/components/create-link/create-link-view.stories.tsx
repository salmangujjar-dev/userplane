import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import React from 'react';

import { useWorkspaceStore } from '@/stores/workspace';

import { CreateLinkView } from './create-link-view';

// Seed workspace store
useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <>{children}</>,
  });
  const shareRoute = createRoute({ getParentRoute: () => rootRoute, path: '/share' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([shareRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Links/CreateLinkView',
  component: CreateLinkView,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => withRouter(<Story />),
  ],
} satisfies Meta<typeof CreateLinkView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
