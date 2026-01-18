import type { Meta, StoryObj } from '@storybook/react-vite';

import PreRecordingLoadingScreen from './PreRecordingLoadingScreen';

const meta: Meta<typeof PreRecordingLoadingScreen> = {
  title: 'Screens/PreRecordingLoadingScreen',
  component: PreRecordingLoadingScreen,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PreRecordingLoadingScreen>;

/**
 * Loading screen shown while session initializes
 */
export const Default: Story = {};
