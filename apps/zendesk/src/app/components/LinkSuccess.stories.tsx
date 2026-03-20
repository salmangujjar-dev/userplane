import type { Meta, StoryObj } from '@storybook/react-vite';

import { LinkSuccess } from './LinkSuccess';

const meta: Meta<typeof LinkSuccess> = {
  title: 'Components/LinkSuccess',
  component: LinkSuccess,
};

export default meta;
type Story = StoryObj<typeof LinkSuccess>;

export const Sidebar: Story = {
  args: {
    linkUrl: 'https://record.userplane.io/abc123',
    description: 'The link has been added to your reply draft.',
    actions: [
      { label: 'Create another link', onClick: () => {}, variant: 'primary' },
      { label: 'Done', onClick: () => {}, variant: 'secondary' },
    ],
  },
};

export const TopBar: Story = {
  args: {
    linkUrl: 'https://record.userplane.io/xyz789',
    description: 'Copy or share the recording link.',
    actions: [
      { label: 'Create another', onClick: () => {}, variant: 'primary' },
      { label: 'Open in Dashboard', onClick: () => {}, variant: 'secondary' },
    ],
  },
};
