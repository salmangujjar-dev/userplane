import type { Meta, StoryObj } from '@storybook/react-vite';

import VideoPlayer from './VideoPlayer';

/**
 * Sample video for stories - using a public test video
 */
const SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const meta: Meta<typeof VideoPlayer> = {
  title: 'Components/VideoPlayer',
  component: VideoPlayer,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '640px', height: '360px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onError: { action: 'error' },
    onLoadStart: { action: 'loadStart' },
    onCanPlay: { action: 'canPlay' },
  },
};

export default meta;
type Story = StoryObj<typeof VideoPlayer>;

/**
 * Default video player with controls visible on hover
 */
export const Default: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    showControls: true,
  },
};

/**
 * Video player without overlay controls
 */
export const WithoutControls: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    showControls: false,
  },
};

/**
 * Video player with autoplay enabled (muted required for autoplay)
 */
export const Autoplay: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    autoPlay: true,
    muted: true,
  },
};

/**
 * Video player muted
 */
export const Muted: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    muted: true,
  },
};

/**
 * Video player with reduced opacity (50%)
 */
export const ReducedOpacity: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    opacity: 0.5,
  },
};

/**
 * Video player with very low opacity (25%)
 */
export const LowOpacity: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    opacity: 0.25,
  },
};

/**
 * Video player with poster image shown before play
 */
export const WithPoster: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    poster: 'https://placehold.co/640x360/1f2937/white?text=Click+to+Play',
  },
};

/**
 * Error state - invalid video URL
 */
export const ErrorState: Story = {
  args: {
    src: 'https://invalid-url-that-will-fail.mp4',
  },
};

/**
 * Small player size
 */
export const SmallSize: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '320px', height: '180px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    src: SAMPLE_VIDEO_URL,
  },
};

/**
 * Large player size
 */
export const LargeSize: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '960px', height: '540px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    src: SAMPLE_VIDEO_URL,
  },
};
