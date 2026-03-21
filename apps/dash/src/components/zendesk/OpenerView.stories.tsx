import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { OpenerView } from './OpenerView';

const meta: Meta<typeof OpenerView> = {
  title: 'Zendesk/OpenerView',
  component: OpenerView,
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
  args: {
    onRequestRecording: fn(),
    onViewRecordings: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof OpenerView>;

export const Default: Story = {};
