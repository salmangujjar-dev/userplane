import type { Meta, StoryObj } from '@storybook/react-vite';

import { RequesterBanner } from './RequesterBanner';

const meta: Meta<typeof RequesterBanner> = {
  title: 'Components/RequesterBanner',
  component: RequesterBanner,
};

export default meta;
type Story = StoryObj<typeof RequesterBanner>;

export const WithName: Story = {
  args: { name: 'Jane Doe', email: 'jane@example.com' },
};

export const EmailOnly: Story = {
  args: { name: '', email: 'jane@example.com' },
};
