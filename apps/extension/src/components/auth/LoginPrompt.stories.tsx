import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { DecorativeIcons, LoginPrompt } from './LoginPrompt';

const meta = {
  title: 'Auth/LoginPrompt',
  component: LoginPrompt,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onRefresh: fn(),
    onSignIn: fn(),
  },
} satisfies Meta<typeof LoginPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DecorativeIconsOnly: StoryObj = {
  name: 'Decorative Icons',
  parameters: {
    layout: 'centered',
  },
  render: () => (
    <div className="relative w-[400px] h-[300px] bg-background border rounded-lg">
      <DecorativeIcons />
    </div>
  ),
};
