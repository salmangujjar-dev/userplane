import {
  argsToPreferences,
  defaultPreferenceArgs,
  type PreferenceArgs,
  preferenceArgTypes,
} from '@stories/preferences-args';
import type { Meta, StoryObj } from '@storybook/react-vite';

import PostRecordingReviewScreen from './PostRecordingReviewScreen';

/**
 * Sample video for stories - using a public test video
 */
const SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface StoryArgs extends PreferenceArgs {
  videoUrl: string;
  isSubmitting?: boolean;
  errorMessage?: string;
}

const meta: Meta<StoryArgs> = {
  title: 'Screens/PostRecordingReviewScreen',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    videoUrl: {
      control: 'text',
      description: 'URL of the recorded video',
      table: { category: 'Content' },
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Show submitting/loading state',
      table: { category: 'State' },
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
      table: { category: 'State' },
    },
    ...preferenceArgTypes,
  },
  args: {
    ...defaultPreferenceArgs,
    videoUrl: SAMPLE_VIDEO_URL,
    isSubmitting: false,
    errorMessage: '',
  },
  render: (args) => (
    <PostRecordingReviewScreen
      videoUrl={args.videoUrl}
      isSubmitting={args.isSubmitting}
      errorMessage={args.errorMessage || undefined}
      preferences={argsToPreferences(args)}
      onSubmit={() => console.log('Submit clicked')}
      onStartOver={() => console.log('Start over clicked')}
    />
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Default review screen - user can preview and submit recording
 */
export const Default: Story = {};

/**
 * Submitting state - button shows loading
 */
export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

/**
 * With error message - shows retry option
 */
export const WithError: Story = {
  args: {
    errorMessage: 'Upload failed. Please check your connection and try again.',
  },
};

/**
 * Custom branded review screen - amber theme
 */
export const CustomBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'FeedbackPro',
    companyLogoUrl: 'https://placehold.co/120x40/f59e0b/white?text=FeedbackPro',
    footnoteText: 'Your recording will be reviewed within 24 hours',
    primaryColor: '#f59e0b',
  },
};

/**
 * Green theme branding
 */
export const GreenTheme: Story = {
  args: {
    customizeLink: true,
    companyName: 'EcoTech',
    primaryColor: '#10b981',
  },
};

/**
 * Error state with custom branding
 */
export const ErrorWithBranding: Story = {
  args: {
    customizeLink: true,
    companyName: 'CloudSync',
    primaryColor: '#6366f1',
    errorMessage: 'Network connection lost. Please retry.',
  },
};
