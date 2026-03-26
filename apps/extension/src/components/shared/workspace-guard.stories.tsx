import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { useWorkspaceStore } from '@/stores/workspace';

import { NoWorkspaceState } from './empty-state';

// Note: WorkspaceGuard depends on useWorkspaces() (TanStack Query) and
// useWorkspaceStore (Zustand). We render its visual sub-states directly
// since the full guard orchestrates loading/hydration from chrome storage.

const meta = {
  title: 'Shared/WorkspaceGuard',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

export const Loading: StoryObj = {
  name: 'Loading State',
  render: () => (
    <div className="flex items-center justify-center p-8 h-full">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
};

export const NoWorkspaces: StoryObj = {
  name: 'No Workspaces',
  render: () => (
    <div className="flex-1 flex items-center justify-center h-full">
      <NoWorkspaceState />
    </div>
  ),
};

export const WorkspacePicker: StoryObj = {
  name: 'Multiple Workspaces Picker',
  render: () => {
    useWorkspaceStore.setState({ workspaceId: null });

    const workspaces = [
      { workspaceId: 'ws-1', workspaceName: 'Acme Corp' },
      { workspaceId: 'ws-2', workspaceName: 'Personal Projects' },
      { workspaceId: 'ws-3', workspaceName: 'Freelance Work' },
    ];

    return (
      <div className="relative flex flex-col items-center justify-center h-full bg-background overflow-hidden">
        <div className="flex flex-col items-center gap-8 px-8 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-32 bg-foreground/10 rounded" />
            <p className="text-sm text-muted-foreground text-center">
              Pick a workspace to get started
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[280px]">
            {workspaces.map((ws) => (
              <button
                key={ws.workspaceId}
                className="flex items-center justify-start gap-2 px-4 py-3 border rounded-md hover:bg-accent transition-colors text-sm"
                onClick={() => useWorkspaceStore.getState().setWorkspace(ws.workspaceId)}
              >
                <div className="h-4 w-4 rounded-full bg-primary/20 shrink-0" />
                {ws.workspaceName}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  },
};

export const WithChildren: StoryObj = {
  name: 'Workspace Selected (Children Rendered)',
  render: () => {
    useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });
    return (
      <div className="p-8 bg-background h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Workspace guard passed</p>
          <p className="text-xs text-muted-foreground">
            Children are rendered when a workspace is selected
          </p>
        </div>
      </div>
    );
  },
};
