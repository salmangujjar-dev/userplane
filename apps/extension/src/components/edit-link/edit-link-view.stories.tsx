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

import { EditLinkView } from './edit-link-view';

// Seed workspace store
useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <>{children}</>,
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Links/EditLinkView',
  component: EditLinkView,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    linkId: 'link-001',
    title: 'Bug Report - Login Page',
    reference: 'https://github.com/org/repo/issues/42',
    isReusable: false,
  },
  decorators: [
    (Story) => withRouter(<Story />),
  ],
} satisfies Meta<typeof EditLinkView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReusableLink: Story = {
  args: {
    title: 'Customer Feedback Form',
    reference: 'JIRA-789',
    isReusable: true,
  },
};

export const WithProvider: Story = {
  args: {
    title: 'Zendesk Ticket Recording',
    reference: 'https://support.example.com/tickets/456',
    linkProvider: 'zendesk',
    linkProviderId: 'ticket-456',
    isReusable: false,
  },
};

export const EmptyReference: Story = {
  args: {
    title: 'Quick Recording Link',
    reference: '',
    isReusable: true,
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Very Long Title That Should Demonstrate How The Component Handles Overflow Text In The Input Field',
    reference: 'https://github.com/some-org/some-very-long-repo-name/issues/12345',
    isReusable: false,
  },
};
