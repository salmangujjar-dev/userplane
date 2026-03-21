import type { Meta, StoryObj } from '@storybook/react-vite';

import { SignupScreen } from './SignupScreen';

const meta: Meta<typeof SignupScreen> = {
  title: 'Zendesk/SignupScreen',
  component: SignupScreen,
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

type Story = StoryObj<typeof SignupScreen>;

export const WithEmail: Story = {
  args: {
    agentEmail: 'agent@example.com',
    dashboardUrl: 'https://app.userplane.io',
  },
};

export const WithoutEmail: Story = {
  args: {
    agentEmail: null,
    dashboardUrl: 'https://app.userplane.io',
  },
};
