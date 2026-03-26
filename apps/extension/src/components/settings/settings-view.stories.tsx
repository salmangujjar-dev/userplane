import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { ExtensionAuthProvider } from '@/hooks/useExtensionAuth';
import { useWorkspaceStore } from '@/stores/workspace';

import { SettingsView } from './settings-view';

const meta = {
  title: 'Settings/SettingsView',
  component: SettingsView,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });
      return (
        <ExtensionAuthProvider>
          <Story />
        </ExtensionAuthProvider>
      );
    },
  ],
} satisfies Meta<typeof SettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
