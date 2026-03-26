import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { FolderKanban, Link2, Plus, Users } from 'lucide-react';
import React from 'react';

import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { FilteredEmptyState, RecordingEmptyState } from '@/components/shared/empty-state';
import { RecordingPreviewSkeleton } from '@/components/shared/skeletons';
import { useWorkspaceStore } from '@/stores/workspace';

import { RecordingPreview } from './recording-preview';

// RecordingsList is a page-level component with heavy data dependencies.
// We render its visual sub-states directly.

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{children}</> });
  const createLinkRoute = createRoute({ getParentRoute: () => rootRoute, path: '/create' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([createLinkRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
}

function PageHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h1 className="text-lg font-semibold">Recordings</h1>
        <p className="text-sm text-muted-foreground">View received recordings</p>
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
        label="Link"
        icon={Link2}
        options={[]}
        selected={[]}
        onSelectionChange={() => {}}
        placeholder="Search links..."
        showTooltip
      />
    </div>
  );
}

const meta = {
  title: 'Pages/RecordingsList',
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
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <RecordingPreviewSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const EmptyState: StoryObj = {
  name: 'Empty (No Recordings)',
  render: () => (
    <div className="flex flex-col h-full">
      <PageHeader />
      <FiltersBar />
      <div className="flex-1 flex items-center justify-center">
        <RecordingEmptyState />
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
          options={[{ value: 'p-1', label: 'Mobile App' }]}
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
          label="Link"
          icon={Link2}
          options={[]}
          selected={[]}
          onSelectionChange={() => {}}
          showTooltip
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <FilteredEmptyState label="recordings" />
      </div>
    </div>
  ),
};

export const WithRecordings: StoryObj = {
  name: 'Populated',
  render: () => {
    const recordings = [
      {
        recordingId: 'rec-001',
        createdBy: 'Alice Johnson',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expiresAt: null,
        durationMs: 125000,
        thumbnailUrl: null,
      },
      {
        recordingId: 'rec-002',
        createdBy: 'Bob Smith',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        durationMs: 45000,
        thumbnailUrl: 'https://placehold.co/640x360/e2e8f0/64748b?text=Screen+Recording',
      },
      {
        recordingId: 'rec-003',
        createdBy: 'Charlie Brown',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expiresAt: null,
        durationMs: 300000,
        thumbnailUrl: null,
      },
    ];

    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <FiltersBar />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {recordings.map((recording) => (
              <RecordingPreview key={recording.recordingId} {...recording} />
            ))}
          </div>
        </div>
      </div>
    );
  },
};
