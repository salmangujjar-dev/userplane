import {
  argsToPreferences,
  defaultPreferenceArgs,
  type PreferenceArgs,
  preferenceArgTypes,
} from '@stories/preferences-args';
import type { Meta, StoryObj } from '@storybook/react-vite';

import ErrorScreen from './ErrorScreen';

interface StoryArgs extends PreferenceArgs {
  title: string;
  subtitle: string;
  primaryActionText?: string;
  secondaryActionText?: string;
}

const meta: Meta<StoryArgs> = {
  title: 'Screens/ErrorScreen',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Error title/heading',
      table: { category: 'Content' },
    },
    subtitle: {
      control: 'text',
      description: 'Error description/help text',
      table: { category: 'Content' },
    },
    primaryActionText: {
      control: 'text',
      description: 'Primary button text (leave empty to hide)',
      table: { category: 'Actions' },
    },
    secondaryActionText: {
      control: 'text',
      description: 'Secondary button text (leave empty to hide)',
      table: { category: 'Actions' },
    },
    ...preferenceArgTypes,
  },
  args: {
    ...defaultPreferenceArgs,
    title: 'Something went wrong',
    subtitle: 'Please try again',
    primaryActionText: '',
    secondaryActionText: '',
  },
  render: (args) => (
    <ErrorScreen
      title={args.title}
      subtitle={args.subtitle}
      primaryActionText={args.primaryActionText || undefined}
      onPrimaryAction={args.primaryActionText ? () => {} : undefined}
      secondaryActionText={args.secondaryActionText || undefined}
      onSecondaryAction={args.secondaryActionText ? () => {} : undefined}
      preferences={argsToPreferences(args)}
    />
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Default error screen with no actions (non-recoverable error)
 */
export const NoRecovery: Story = {
  args: {
    title: "Link doesn't exist",
    subtitle: 'Try requesting a new one',
  },
};

/**
 * Error with primary action button
 */
export const WithPrimaryAction: Story = {
  args: {
    title: 'Allow screen recording',
    subtitle: 'Share your screen to start recording',
    primaryActionText: 'Try again',
  },
};

/**
 * Error with both primary and secondary actions
 */
export const WithBothActions: Story = {
  args: {
    title: 'Upload failed',
    subtitle: "Let's try again",
    primaryActionText: 'Retry',
    secondaryActionText: 'Start over',
  },
};

/**
 * Session expired - common error state
 */
export const SessionExpired: Story = {
  args: {
    title: 'Session expired',
    subtitle: "Let's start fresh",
    primaryActionText: 'Start over',
  },
};

/**
 * Browser not supported - no recovery possible
 */
export const BrowserNotSupported: Story = {
  args: {
    title: 'Browser not supported',
    subtitle: 'Try Chrome, Edge, or Firefox',
  },
};

/**
 * Device busy error
 */
export const DeviceBusy: Story = {
  args: {
    title: 'Device is busy',
    subtitle: 'Close other apps using your camera/mic',
    primaryActionText: 'Try again',
  },
};

/**
 * Custom branded error screen - purple theme
 */
export const CustomBranding: Story = {
  args: {
    title: 'Something went wrong',
    subtitle: "Let's try again",
    primaryActionText: 'Retry',
    customizeLink: true,
    companyName: 'Acme Corp',
    companyLogoUrl: 'https://placehold.co/120x40/7c3aed/white?text=ACME',
    footnoteText: 'Powered by Acme Corp',
    primaryColor: '#7c3aed',
  },
};

/**
 * Custom branded error - blue theme
 */
export const BlueBranding: Story = {
  args: {
    title: 'Connection lost',
    subtitle: 'Check your internet connection',
    primaryActionText: 'Retry',
    secondaryActionText: 'Cancel',
    customizeLink: true,
    companyName: 'CloudSync',
    primaryColor: '#2563eb',
  },
};
