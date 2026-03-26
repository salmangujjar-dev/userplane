import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';

import { FilteredEmptyState, LinkEmptyState, RecordingEmptyState } from './empty-state';

function withRouter(Component: React.ComponentType) {
  const rootRoute = createRootRoute({ component: Component });
  const createLinkRoute = createRoute({ getParentRoute: () => rootRoute, path: '/create' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([createLinkRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return () => <RouterProvider router={router} />;
}

const meta = {
  title: 'Shared/EmptyStates',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

export const LinkEmpty: StoryObj = {
  name: 'Link Empty State',
  render: withRouter(LinkEmptyState),
};

export const RecordingEmpty: StoryObj = {
  name: 'Recording Empty State',
  render: withRouter(RecordingEmptyState),
};

export const FilteredLinks: StoryObj = {
  name: 'Filtered Empty - Links',
  render: () => <FilteredEmptyState label="links" />,
};

export const FilteredRecordings: StoryObj = {
  name: 'Filtered Empty - Recordings',
  render: () => <FilteredEmptyState label="recordings" />,
};
