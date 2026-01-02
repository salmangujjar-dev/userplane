import type { Meta, StoryObj } from '@storybook/react';
import PostRecordingAckScreen from './PostRecordingAckScreen';
import {
  preferenceArgTypes,
  defaultPreferenceArgs,
  argsToPreferences,
  type PreferenceArgs,
} from '../../.storybook/preferences-args';

type StoryArgs = PreferenceArgs;

const meta: Meta<StoryArgs> = {
  title: 'Screens/PostRecordingAckScreen',
  // Storybook expects the component prop to take args directly,
  // but our PostRecordingAckScreen expects a 'preferences' prop.
  // Omit the 'component' key here and use `render` below for proper mapping.
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    ...preferenceArgTypes,
  },
  args: {
    ...defaultPreferenceArgs,
  },
  render: (args) => <PostRecordingAckScreen preferences={argsToPreferences(args)} />,
};

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Default success screen after upload completes
 */
export const Default: Story = {};

/**
 * Custom branded success screen - green theme
 */
export const GreenBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'SupportHub',
    companyLogoUrl: 'https://placehold.co/120x40/10b981/white?text=SupportHub',
    footnoteText: 'Thank you for your feedback!',
    primaryColor: '#10b981',
  },
};

/**
 * Custom branded success screen - purple theme
 */
export const PurpleBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'FeedbackPro',
    companyLogoUrl: 'https://placehold.co/120x40/7c3aed/white?text=FeedbackPro',
    footnoteText: 'Your recording has been submitted',
    primaryColor: '#7c3aed',
  },
};

/**
 * Custom branded success screen - blue theme
 */
export const BlueBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'TechCorp',
    primaryColor: '#2563eb',
  },
};

/**
 * Custom branded success screen - orange theme
 */
export const OrangeBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'BugHunter',
    companyLogoUrl: 'https://placehold.co/120x40/f97316/white?text=BugHunter',
    footnoteText: 'Our team will review your recording shortly',
    primaryColor: '#f97316',
  },
};
