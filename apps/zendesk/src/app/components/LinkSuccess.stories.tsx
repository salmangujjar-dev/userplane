import type { Meta, StoryObj } from '@storybook/react-vite';

import { LinkSuccess } from './LinkSuccess';

const meta: Meta<typeof LinkSuccess> = {
  title: 'Components/LinkSuccess',
  component: LinkSuccess,
};

export default meta;
type Story = StoryObj<typeof LinkSuccess>;

export const SidebarActions: Story = {
  args: {
    linkUrl: 'https://record.userplane.io/abc123',
    actions: [
      { label: 'Add to ticket comment', onClick: () => {}, variant: 'primary' },
      { label: 'Copy link', onClick: () => {}, variant: 'secondary' },
      { label: 'Add tag', onClick: () => {}, variant: 'secondary' },
      { label: 'Create another', onClick: () => {}, variant: 'ghost' },
    ],
  },
};

export const TopBarActions: Story = {
  args: {
    linkUrl: 'https://record.userplane.io/xyz789',
    actions: [
      { label: 'Copy Link', onClick: () => {}, variant: 'primary' },
      { label: 'Create Another', onClick: () => {}, variant: 'ghost' },
      { label: 'Open in Dashboard', onClick: () => {}, variant: 'secondary' },
    ],
  },
};
