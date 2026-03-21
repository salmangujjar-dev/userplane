import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReconnectScreen } from './ReconnectScreen';

const meta: Meta<typeof ReconnectScreen> = {
  title: 'Zendesk/ReconnectScreen',
  component: ReconnectScreen,
  parameters: {
    backgrounds: { default: 'zendesk' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '330px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ReconnectScreen>;

export const WithEmail: Story = {
  args: {
    agentEmail: 'agent@example.com',
    workspaceId: 'ws_123',
    dashboardUrl: 'https://app.userplane.io',
  },
};

export const WithoutEmail: Story = {
  args: {
    agentEmail: null,
    workspaceId: 'ws_123',
    dashboardUrl: 'https://app.userplane.io',
  },
};
