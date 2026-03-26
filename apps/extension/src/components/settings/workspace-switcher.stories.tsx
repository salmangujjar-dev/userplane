import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { WorkspaceSwitcherSkeleton } from '@/components/shared/skeletons';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';

// WorkspaceSwitcher depends on useWorkspaces() (TanStack Query). Since
// the API isn't available in Storybook, we render the visual states directly.

const meta = {
  title: 'Settings/WorkspaceSwitcher',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

export const Loading: StoryObj = {
  render: () => <WorkspaceSwitcherSkeleton />,
};

export const Selected: StoryObj = {
  name: 'Workspace Selected',
  render: () => (
    <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors border border-border">
      <WorkspaceAvatar
        workspaceId="ws-1"
        workspaceName="Acme Corp"
        size={WORKSPACE_AVATAR_SIZES.COMPACT}
      />
      <span className="text-sm font-medium flex-1 truncate text-left">Acme Corp</span>
      <svg
        className="h-4 w-4 text-muted-foreground shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    </button>
  ),
};

export const NoSelection: StoryObj = {
  name: 'No Workspace Selected',
  render: () => (
    <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors border border-border">
      <div className="h-4 w-4 rounded-full bg-muted shrink-0" />
      <span className="text-sm font-medium flex-1 truncate text-left text-muted-foreground">
        Select Workspace
      </span>
      <svg
        className="h-4 w-4 text-muted-foreground shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    </button>
  ),
};
