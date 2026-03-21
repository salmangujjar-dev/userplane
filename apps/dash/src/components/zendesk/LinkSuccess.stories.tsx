import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LinkSuccess } from './LinkSuccess';

const meta: Meta<typeof LinkSuccess> = {
  title: 'Zendesk/LinkSuccess',
  component: LinkSuccess,
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

type Story = StoryObj<typeof LinkSuccess>;

export const Default: Story = {
  args: {
    linkUrl: 'https://rec.userplane.io/abc123',
    description: 'The link has been added to your reply draft.',
    actions: [
      { label: 'Create another link', onClick: fn(), variant: 'primary' },
      { label: 'Done', onClick: fn(), variant: 'secondary' },
    ],
  },
};

export const LongUrl: Story = {
  args: {
    linkUrl: 'https://rec.userplane.io/abc123def456ghi789jkl012mno345pqr678',
    description: 'Copy or share the recording link.',
    actions: [
      { label: 'Create another', onClick: fn(), variant: 'primary' },
      { label: 'Open in Dashboard', onClick: fn(), variant: 'secondary' },
    ],
  },
};

export const SingleAction: Story = {
  args: {
    linkUrl: 'https://rec.userplane.io/abc123',
    description: 'The link has been created.',
    actions: [{ label: 'Done', onClick: fn(), variant: 'primary' }],
  },
};
