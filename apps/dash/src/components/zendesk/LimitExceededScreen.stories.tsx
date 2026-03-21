import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LimitExceededScreen } from './LimitExceededScreen';

const meta: Meta<typeof LimitExceededScreen> = {
  title: 'Zendesk/LimitExceededScreen',
  component: LimitExceededScreen,
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

type Story = StoryObj<typeof LimitExceededScreen>;

export const Default: Story = {
  args: {
    workspaceId: 'ws_123',
    dashboardUrl: 'https://app.userplane.io',
    onGoBack: fn(),
  },
};
