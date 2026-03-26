import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { FolderKanban, Globe, Plus, Users } from 'lucide-react';
import React from 'react';

import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { FilteredEmptyState, LinkEmptyState } from '@/components/shared/empty-state';
import { LinkPreviewSkeleton } from '@/components/shared/skeletons';
import { useWorkspaceStore } from '@/stores/workspace';

import { LinkPreview } from './link-preview';

// LinksList is a page-level component with heavy data dependencies
// (infinite scroll, TanStack Query, search hooks). We render its
// visual sub-states directly with realistic mock data.

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{children}</> });
  const createLinkRoute = createRoute({ getParentRoute: () => rootRoute, path: '/create' });
  const editRoute = createRoute({ getParentRoute: () => rootRoute, path: '/edit' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([createLinkRoute, editRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
}

function PageHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h1 className="text-lg font-semibold">Links</h1>
        <p className="text-sm text-muted-foreground">Manage recording links</p>
      </div>
      <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
        Create Link <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function FiltersBar() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
      <FilterDropdown
        label="Projects"
        icon={FolderKanban}
        options={[]}
        selected={[]}
        onSelectionChange={() => {}}
        placeholder="Search projects..."
      />
      <FilterDropdown
        label="Member"
        icon={Users}
        options={[]}
        selected={[]}
        onSelectionChange={() => {}}
        placeholder="Search members..."
        showAvatars
      />
      <FilterDropdown
        label="Domain"
        icon={Globe}
        options={[]}
        selected={[]}
        onSelectionChange={() => {}}
        placeholder="Search domains..."
        showTooltip
      />
    </div>
  );
}

const meta = {
  title: 'Pages/LinksList',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });
      return withRouter(<Story />);
    },
  ],
} satisfies Meta;

export default meta;

export const LoadingState: StoryObj = {
  name: 'Loading',
  render: () => (
    <div className="flex flex-col h-full">
      <PageHeader />
      <FiltersBar />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LinkPreviewSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const EmptyState: StoryObj = {
  name: 'Empty (No Links)',
  render: () => (
    <div className="flex flex-col h-full">
      <PageHeader />
      <FiltersBar />
      <div className="flex-1 flex items-center justify-center">
        <LinkEmptyState />
      </div>
    </div>
  ),
};

export const FilteredEmpty: StoryObj = {
  name: 'Filtered (No Results)',
  render: () => (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
        <FilterDropdown
          label="Projects"
          icon={FolderKanban}
          options={[{ value: 'p-1', label: 'Marketing Website' }]}
          selected={['p-1']}
          onSelectionChange={() => {}}
        />
        <FilterDropdown
          label="Member"
          icon={Users}
          options={[]}
          selected={[]}
          onSelectionChange={() => {}}
          showAvatars
        />
        <FilterDropdown
          label="Domain"
          icon={Globe}
          options={[]}
          selected={[]}
          onSelectionChange={() => {}}
          showTooltip
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <FilteredEmptyState label="links" />
      </div>
    </div>
  ),
};

export const WithLinks: StoryObj = {
  name: 'Populated',
  render: () => {
    const noop = () => {};
    const links = [
      {
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
      },
      {
        linkId: 'link-002',
        linkURL: 'https://rec.userplane.io/r/def456',
        title: 'Feature Request Form',
        reference: 'JIRA-789',
        linkProvider: null,
        linkProviderId: null,
        createdBy: 'Bob Smith',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        projectName: 'Mobile App',
        isReusable: true,
        domainUrl: 'https://rec.userplane.io',
      },
      {
        linkId: 'link-003',
        linkURL: 'https://rec.userplane.io/r/ghi789',
        title: null,
        reference: null,
        linkProvider: null,
        linkProviderId: null,
        createdBy: 'Charlie Brown',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        projectName: null,
        isReusable: false,
        domainUrl: 'https://rec.userplane.io',
      },
    ];

    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <FiltersBar />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {links.map((link) => (
              <LinkPreview key={link.linkId} {...link} onDelete={noop} />
            ))}
          </div>
        </div>
      </div>
    );
  },
};
