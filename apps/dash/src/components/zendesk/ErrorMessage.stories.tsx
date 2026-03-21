import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ErrorMessage } from './ErrorMessage';

const meta: Meta<typeof ErrorMessage> = {
  title: 'Zendesk/ErrorMessage',
  component: ErrorMessage,
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

type Story = StoryObj<typeof ErrorMessage>;

export const WithActions: Story = {
  args: {
    message: 'Recording limit exceeded. Upgrade your plan in the dashboard.',
    onRetry: fn(),
    onGoBack: fn(),
  },
};

export const RetryOnly: Story = {
  args: {
    message: 'Failed to create link. Please try again.',
    onRetry: fn(),
  },
};

export const MessageOnly: Story = {
  args: {
    message: 'Something went wrong.',
  },
};
