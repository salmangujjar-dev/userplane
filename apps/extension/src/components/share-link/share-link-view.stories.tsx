import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import React from 'react';

import { ShareLinkView } from './share-link-view';

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <>{children}</>,
  });
  const createLinkRoute = createRoute({ getParentRoute: () => rootRoute, path: '/create' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([createLinkRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Links/ShareLinkView',
  component: ShareLinkView,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => withRouter(<Story />),
  ],
} satisfies Meta<typeof ShareLinkView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    linkUrl: 'https://rec.userplane.io/r/abc123def',
  },
};

export const LongUrl: Story = {
  args: {
    linkUrl: 'https://recordings.my-custom-domain.com/r/very-long-recording-identifier-abc123def456',
  },
};

export const ShortUrl: Story = {
  args: {
    linkUrl: 'https://rec.up.io/r/x1',
  },
};
