import type { Meta, StoryObj } from '@storybook/react-vite';

import { UserplaneIcon } from './Icons';
import { ScreenHeader } from './ScreenHeader';

const meta: Meta<typeof ScreenHeader> = {
  title: 'Components/ScreenHeader',
  component: ScreenHeader,
};

export default meta;
type Story = StoryObj<typeof ScreenHeader>;

export const WithDescription: Story = {
  args: {
    icon: <UserplaneIcon size={40} />,
    title: 'Request a Recording',
    description: 'Send a screen recording link to the customer.',
  },
};

export const WithoutDescription: Story = {
  args: {
    icon: <UserplaneIcon size={40} />,
    title: 'Request a Recording',
  },
};
