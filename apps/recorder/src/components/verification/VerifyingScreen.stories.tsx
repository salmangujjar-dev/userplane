import type { Meta, StoryObj } from '@storybook/react';
import VerifyingScreen from './VerifyingScreen';

const meta = {
  title: 'Verification/VerifyingScreen',
  component: VerifyingScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof VerifyingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithDomainUrl: Story = {
  args: {
    domainUrl: 'example.com',
  },
};
