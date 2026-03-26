import type { Meta, StoryObj } from '@storybook/react-vite';

import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from './workspace-avatar';

const meta = {
  title: 'Shared/WorkspaceAvatar',
  component: WorkspaceAvatar,
  args: {
    workspaceName: 'Acme Corp',
    workspaceId: 'ws-123',
    size: WORKSPACE_AVATAR_SIZES.USER,
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(WORKSPACE_AVATAR_SIZES),
    },
  },
} satisfies Meta<typeof WorkspaceAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIdOnly: Story = {
  args: {
    workspaceName: null,
    workspaceId: 'ws-456',
  },
};

export const NoSeed: Story = {
  args: {
    workspaceName: null,
    workspaceId: null,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {Object.entries(WORKSPACE_AVATAR_SIZES).map(([label, size]) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <WorkspaceAvatar workspaceName="Acme Corp" size={size} />
          <span className="text-xs text-muted-foreground">
            {label} ({size}px)
          </span>
        </div>
      ))}
    </div>
  ),
};
