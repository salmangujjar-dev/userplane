import type { Meta, StoryObj } from '@storybook/react';
import VerifiedScreen from './VerifiedScreen';
import { AppModeProvider } from '@/contexts/AppModeContext';

const meta = {
  title: 'Verification/VerifiedScreen',
  component: VerifiedScreen,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AppModeProvider>
        <Story />
      </AppModeProvider>
    ),
  ],
} satisfies Meta<typeof VerifiedScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    domainUrl: 'example.com',
  },
};

export const WithBranding: Story = {
  args: {
    domainUrl: 'acme.com',
    workspaceName: 'Acme Inc.',
    workspaceLogoUrl: '/logo-dark.svg',
  },
};

export const WithProtocol: Story = {
  args: {
    domainUrl: 'https://example.com',
  },
};

export const WithPath: Story = {
  args: {
    domainUrl: 'https://example.com/verify?token=abc123',
  },
};

export const WithSubdomain: Story = {
  args: {
    domainUrl: 'app.example.com',
  },
};

export const WithPortAndPath: Story = {
  args: {
    domainUrl: 'http://localhost:3000/verify',
  },
};
