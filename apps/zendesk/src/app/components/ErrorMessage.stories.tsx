import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorMessage } from './ErrorMessage';

const meta: Meta<typeof ErrorMessage> = {
  title: 'Components/ErrorMessage',
  component: ErrorMessage,
};

export default meta;
type Story = StoryObj<typeof ErrorMessage>;

export const Short: Story = {
  args: { message: 'Failed to create link' },
};

export const Long: Story = {
  args: {
    message:
      'Integration disconnected. Reconnect from the Userplane dashboard. If the problem persists, contact support.',
  },
};
