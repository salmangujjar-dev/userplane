import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorMessage } from './ErrorMessage';

const meta: Meta<typeof ErrorMessage> = {
  title: 'Components/ErrorMessage',
  component: ErrorMessage,
};

export default meta;
type Story = StoryObj<typeof ErrorMessage>;

export const WithRetryAndGoBack: Story = {
  args: {
    message: 'An unexpected error occurred. Please try again.',
    onRetry: () => console.log('Retry clicked'),
    onGoBack: () => console.log('Go back clicked'),
  },
};

export const WithGoBackOnly: Story = {
  args: {
    message: 'Integration disconnected. Try reconnecting.',
    onGoBack: () => console.log('Go back clicked'),
  },
};
