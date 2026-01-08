import type { Meta, StoryObj } from '@storybook/react';
import VerificationErrorScreen from './VerificationErrorScreen';

const meta = {
  title: 'Verification/VerificationErrorScreen',
  component: VerificationErrorScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof VerificationErrorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TokenInvalid: Story = {
  args: {
    title: 'Invalid verification token',
    subtitle:
      'The verification token is invalid or has expired. Please request a new verification link.',
  },
};

export const DomainNotFound: Story = {
  args: {
    title: 'Domain not found',
    subtitle: 'This domain is not registered in your workspace. Please add the domain first.',
  },
};

export const OriginMismatch: Story = {
  args: {
    title: 'Origin mismatch',
    subtitle: 'This verification link must be opened from the registered domain.',
  },
};

export const WithRetryAction: Story = {
  args: {
    title: 'Verification failed',
    subtitle: 'Unable to verify domain ownership. Please try again.',
    primaryActionText: 'Try again',
    onPrimaryAction: () => console.log('Retry clicked'),
  },
};

export const WithSecondaryAction: Story = {
  args: {
    title: 'Connection error',
    subtitle: 'Unable to connect to the server. Please check your internet connection.',
    primaryActionText: 'Try again',
    onPrimaryAction: () => console.log('Retry clicked'),
    secondaryActionText: 'Cancel',
    onSecondaryAction: () => console.log('Cancel clicked'),
  },
};

export const WithBranding: Story = {
  args: {
    title: 'Verification failed',
    subtitle: 'Unable to verify domain ownership. Please try again.',
    workspaceName: 'Acme Inc.',
    workspaceLogoUrl: '/logo-dark.svg',
    primaryColor: '#4F46E5',
    primaryActionText: 'Try again',
    onPrimaryAction: () => console.log('Retry clicked'),
  },
};
