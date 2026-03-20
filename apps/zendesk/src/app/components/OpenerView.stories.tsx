import type { Meta, StoryObj } from '@storybook/react-vite';

import { OpenerView } from './OpenerView';

const meta: Meta<typeof OpenerView> = {
  title: 'Components/OpenerView',
  component: OpenerView,
};

export default meta;
type Story = StoryObj<typeof OpenerView>;

export const Default: Story = {
  args: {
    onRequestRecording: () => console.log('Request recording'),
    onViewRecordings: () => console.log('View recordings'),
  },
};
