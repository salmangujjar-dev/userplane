import type { Meta, StoryObj } from '@storybook/react';
import VerificationErrorScreen from './VerificationErrorScreen';
import { VERIFICATION_ERROR_COPY } from '@/constants/copy/verification';

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
    title: VERIFICATION_ERROR_COPY.tokenInvalid.title,
    subtitle: VERIFICATION_ERROR_COPY.tokenInvalid.subtitle,
  },
};

export const DomainNotRegistered: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.domainNotRegistered.title,
    subtitle: VERIFICATION_ERROR_COPY.domainNotRegistered.subtitle,
  },
};

export const WorkspaceMismatch: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.workspaceMismatch.title,
    subtitle: VERIFICATION_ERROR_COPY.workspaceMismatch.subtitle,
  },
};

export const UrlInvalid: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.urlInvalid.title,
    subtitle: VERIFICATION_ERROR_COPY.urlInvalid.subtitle,
  },
};

export const OriginInvalid: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.originInvalid.title,
    subtitle: VERIFICATION_ERROR_COPY.originInvalid.subtitle,
  },
};

export const OriginMismatch: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.originMismatch.title,
    subtitle: VERIFICATION_ERROR_COPY.originMismatch.subtitle,
  },
};

export const VerificationFailed: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.verificationFailed.title,
    subtitle: VERIFICATION_ERROR_COPY.verificationFailed.subtitle,
    primaryActionText: 'Try again',
    onPrimaryAction: () => console.log('Retry clicked'),
  },
};

export const NetworkError: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.networkError.title,
    subtitle: VERIFICATION_ERROR_COPY.networkError.subtitle,
    primaryActionText: 'Try again',
    onPrimaryAction: () => console.log('Retry clicked'),
    secondaryActionText: 'Cancel',
    onSecondaryAction: () => console.log('Cancel clicked'),
  },
};

export const UnknownError: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.unknownError.title,
    subtitle: VERIFICATION_ERROR_COPY.unknownError.subtitle,
  },
};

export const WithBranding: Story = {
  args: {
    title: VERIFICATION_ERROR_COPY.verificationFailed.title,
    subtitle: VERIFICATION_ERROR_COPY.verificationFailed.subtitle,
    workspaceName: 'Acme Inc.',
    workspaceLogoUrl: '/logo-dark.svg',
    primaryColor: '#4F46E5',
    primaryActionText: 'Try again',
    onPrimaryAction: () => console.log('Retry clicked'),
  },
};
