import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { ExtensionAuthProvider } from '@/hooks/useExtensionAuth';
import { useWorkspaceStore } from '@/stores/workspace';

import { SettingsView } from './settings-view';

// Seed workspace store
useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });

const meta = {
  title: 'Settings/SettingsView',
  component: SettingsView,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ExtensionAuthProvider>
        <div className="w-[400px] h-[700px] border rounded-lg overflow-hidden">
          <Story />
        </div>
      </ExtensionAuthProvider>
    ),
  ],
} satisfies Meta<typeof SettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
