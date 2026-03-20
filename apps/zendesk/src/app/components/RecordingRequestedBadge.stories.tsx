import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecordingRequestedBadge } from './RecordingRequestedBadge';

const meta: Meta<typeof RecordingRequestedBadge> = {
  title: 'Components/RecordingRequestedBadge',
  component: RecordingRequestedBadge,
};

export default meta;
type Story = StoryObj<typeof RecordingRequestedBadge>;

export const Default: Story = {};
