import {
  argsToPreferences,
  defaultPreferenceArgs,
  type PreferenceArgs,
  preferenceArgTypes,
} from '@stories/preferences-args';
import type { Meta, StoryObj } from '@storybook/react-vite';

import RecordingInProgressScreen from './RecordingInProgressScreen';

interface StoryArgs extends PreferenceArgs {
  title?: string;
  subtitle?: string;
  isProcessing?: boolean;
}

const meta: Meta<StoryArgs> = {
  title: 'Screens/RecordingInProgressScreen',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main heading text',
      table: { category: 'Content' },
    },
    subtitle: {
      control: 'text',
      description: 'Subtitle text below heading',
      table: { category: 'Content' },
    },
    isProcessing: {
      control: 'boolean',
      description: 'Show processing state (after stop clicked)',
      table: { category: 'State' },
    },
    ...preferenceArgTypes,
  },
  args: {
    ...defaultPreferenceArgs,
    isProcessing: false,
  },
  render: (args) => (
    <RecordingInProgressScreen
      title={args.title}
      subtitle={args.subtitle}
      isProcessing={args.isProcessing}
      preferences={argsToPreferences(args)}
      onStopRecording={() => console.log('Stop recording clicked')}
    />
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Default recording screen without live preview
 * (MediaStream not available in Storybook)
 */
export const Default: Story = {};

/**
 * Recording screen in processing state (after stop clicked)
 */
export const Processing: Story = {
  args: {
    isProcessing: true,
  },
};

/**
 * Recording screen with custom title and subtitle
 */
export const CustomCopy: Story = {
  args: {
    title: 'Screen Recording Active',
    subtitle: 'Share your screen to show us what you see',
  },
};

/**
 * Custom branded - purple theme
 */
export const PurpleBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'PurpleStream',
    companyLogoUrl: 'https://placehold.co/120x40/7c3aed/white?text=PurpleStream',
    primaryColor: '#7c3aed',
  },
};

/**
 * Custom branded - blue theme
 */
export const BlueBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'BlueCapture',
    companyLogoUrl: 'https://placehold.co/120x40/2563eb/white?text=BlueCapture',
    primaryColor: '#2563eb',
  },
};

/**
 * Custom branded - green theme
 */
export const GreenBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'GreenRecord',
    primaryColor: '#10b981',
  },
};

/**
 * Custom branded - orange theme with footnote
 */
export const OrangeBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'OrangeCapture',
    companyLogoUrl: 'https://placehold.co/120x40/f97316/white?text=OrangeCapture',
    footnoteText: 'Your screen recording is secure and encrypted',
    primaryColor: '#f97316',
  },
};

/**
 * Processing state with custom branding
 */
export const ProcessingWithBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'TechCorp',
    primaryColor: '#6366f1',
    isProcessing: true,
  },
};
