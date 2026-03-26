import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import React from 'react';
import { fn } from 'storybook/test';

import { useWorkspaceStore } from '@/stores/workspace';

import { LinkPreview } from './link-preview';

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <>{children}</>,
  });
  const editRoute = createRoute({ getParentRoute: () => rootRoute, path: '/edit' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([editRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
}

const defaultArgs = {
  linkId: 'link-001',
  linkURL: 'https://rec.userplane.io/r/abc123',
  title: 'Bug Report - Login Page',
  reference: 'https://github.com/org/repo/issues/42',
  linkProvider: null,
  linkProviderId: null,
  createdBy: 'Alice Johnson',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  projectName: 'Marketing Website',
  isReusable: false,
  domainUrl: 'https://rec.userplane.io',
  canDelete: true,
  onDelete: fn(),
};

const meta = {
  title: 'Links/LinkPreview',
  component: LinkPreview,
  parameters: {
    layout: 'padded',
  },
  args: defaultArgs,
  decorators: [
    (Story) => {
      useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });
      return withRouter(<Story />);
    },
  ],
} satisfies Meta<typeof LinkPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Reusable: Story = {
  args: {
    isReusable: true,
    title: 'Feedback Collection Link',
  },
};

export const WithProject: Story = {
  args: {
    projectName: 'Mobile App Redesign',
    title: 'User Testing Session',
  },
};

export const UntitledLink: Story = {
  args: {
    title: null,
    reference: null,
  },
};

export const CreatedToday: Story = {
  args: {
    createdAt: new Date(),
    title: 'Fresh Link',
  },
};

export const CreatedYesterday: Story = {
  args: {
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    title: 'Yesterday Link',
  },
};

export const CreatedWeeksAgo: Story = {
  args: {
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    title: 'Older Link',
  },
};

export const NonDeletable: Story = {
  args: {
    canDelete: false,
    title: 'Protected Link',
  },
};

export const NoProject: Story = {
  args: {
    projectName: null,
    title: 'Standalone Recording',
  },
};

export const LinkList: Story = {
  name: 'Multiple Links',
  render: () => (
    <div className="space-y-4">
      <LinkPreview
        {...defaultArgs}
        linkId="link-001"
        title="Bug Report - Login Page"
        createdBy="Alice Johnson"
        isReusable={false}
        projectName="Marketing Website"
      />
      <LinkPreview
        {...defaultArgs}
        linkId="link-002"
        title="Feature Request Form"
        createdBy="Bob Smith"
        isReusable={true}
        projectName="Mobile App"
        createdAt={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)}
      />
      <LinkPreview
        {...defaultArgs}
        linkId="link-003"
        title={null}
        createdBy="Charlie Brown"
        isReusable={false}
        projectName={null}
        createdAt={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      />
    </div>
  ),
};
