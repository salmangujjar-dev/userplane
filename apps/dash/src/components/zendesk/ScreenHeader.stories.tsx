import type { Meta, StoryObj } from '@storybook/react-vite';

import { ErrorIcon, UserplaneIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

const meta: Meta<typeof ScreenHeader> = {
  title: 'Zendesk/ScreenHeader',
  component: ScreenHeader,
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

type Story = StoryObj<typeof ScreenHeader>;

export const Default: Story = {
  args: {
    icon: <UserplaneIcon size={40} />,
    title: 'Request a Recording',
    description: 'Send a screen recording link to the customer.',
  },
};

export const WithoutDescription: Story = {
  args: {
    icon: <UserplaneIcon size={40} />,
    title: 'Userplane',
  },
};

export const WithErrorIcon: Story = {
  args: {
    icon: <ErrorIcon size={40} />,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
};
