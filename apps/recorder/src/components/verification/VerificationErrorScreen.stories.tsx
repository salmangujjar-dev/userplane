import type { Meta, StoryObj } from '@storybook/react-vite';

import { getVerificationError } from '@/lib/verification-errors';

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
    ...getVerificationError('VERIFICATION_TOKEN_INVALID'),
  },
};

export const DomainNotRegistered: Story = {
  args: {
    ...getVerificationError('VERIFICATION_DOMAIN_NOT_REGISTERED'),
  },
};

export const WorkspaceMismatch: Story = {
  args: {
    ...getVerificationError('VERIFICATION_WORKSPACE_MISMATCH'),
  },
};

export const UrlInvalid: Story = {
  args: {
    ...getVerificationError('VERIFICATION_DOMAIN_URL_INVALID'),
  },
};

export const OriginInvalid: Story = {
  args: {
    ...getVerificationError('VERIFICATION_ORIGIN_INVALID'),
  },
};

export const OriginMismatch: Story = {
  args: {
    ...getVerificationError('VERIFICATION_ORIGIN_MISMATCH'),
  },
};

export const VerificationFailed: Story = {
  args: {
    ...getVerificationError('VERIFICATION_FAILED'),
    primaryActionText: 'Try again',
    onPrimaryAction: () => {},
  },
};

export const NetworkError: Story = {
  args: {
    ...getVerificationError('VERIFICATION_NETWORK_ERROR'),
    primaryActionText: 'Try again',
    onPrimaryAction: () => {},
    secondaryActionText: 'Cancel',
    onSecondaryAction: () => {},
  },
};

export const UnknownError: Story = {
  args: {
    ...getVerificationError('VERIFICATION_UNKNOWN_ERROR'),
  },
};

export const WithBranding: Story = {
  args: {
    ...getVerificationError('VERIFICATION_FAILED'),
    workspaceName: 'Acme Inc.',
    workspaceLogoUrl: '/logo-dark.svg',
    primaryColor: '#4F46E5',
    primaryActionText: 'Try again',
    onPrimaryAction: () => {},
  },
};
