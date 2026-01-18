import {
  argsToPreferences,
  defaultPreferenceArgs,
  type PreferenceArgs,
  preferenceArgTypes,
} from '@stories/preferences-args';
import type { Meta, StoryObj } from '@storybook/react-vite';

import PostRecordingUploadScreen from './PostRecordingUploadScreen';

/**
 * Sample video for stories
 */
const SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface StoryArgs extends PreferenceArgs {
  videoUrl: string;
  progress: number;
}

const meta: Meta<StoryArgs> = {
  title: 'Screens/PostRecordingUploadScreen',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    videoUrl: {
      control: 'text',
      description: 'URL of the recorded video',
      table: { category: 'Content' },
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Upload progress percentage (0-100)',
      table: { category: 'State' },
    },
    ...preferenceArgTypes,
  },
  args: {
    ...defaultPreferenceArgs,
    videoUrl: SAMPLE_VIDEO_URL,
    progress: 0,
  },
  render: (args) => (
    <PostRecordingUploadScreen
      videoUrl={args.videoUrl}
      progress={args.progress}
      preferences={argsToPreferences(args)}
    />
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Upload just started
 */
export const JustStarted: Story = {
  args: {
    progress: 0,
  },
};

/**
 * Upload at 25%
 */
export const Quarter: Story = {
  args: {
    progress: 25,
  },
};

/**
 * Upload at 50%
 */
export const Halfway: Story = {
  args: {
    progress: 50,
  },
};

/**
 * Upload at 75%
 */
export const ThreeQuarters: Story = {
  args: {
    progress: 75,
  },
};

/**
 * Upload almost complete
 */
export const AlmostDone: Story = {
  args: {
    progress: 95,
  },
};

/**
 * Upload complete
 */
export const Complete: Story = {
  args: {
    progress: 100,
  },
};

/**
 * Custom branded upload screen - purple theme
 */
export const PurpleBranding: Story = {
  args: {
    progress: 60,
    customizeLink: true,
    companyName: 'VioletCloud',
    companyLogoUrl: 'https://placehold.co/120x40/7c3aed/white?text=VioletCloud',
    footnoteText: 'Secure upload in progress',
    primaryColor: '#7c3aed',
  },
};

/**
 * Custom branded upload screen - blue theme
 */
export const BlueBranding: Story = {
  args: {
    progress: 45,
    customizeLink: true,
    companyName: 'BlueWave',
    primaryColor: '#0ea5e9',
  },
};

/**
 * Custom branded upload screen - pink theme
 */
export const PinkBranding: Story = {
  args: {
    progress: 80,
    customizeLink: true,
    companyName: 'RoseApp',
    primaryColor: '#ec4899',
  },
};
