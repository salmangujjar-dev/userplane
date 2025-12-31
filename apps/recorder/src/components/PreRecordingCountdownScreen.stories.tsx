import type { Meta, StoryObj } from '@storybook/react-vite';
import PreRecordingCountdownScreen from './PreRecordingCountdownScreen';
import {
  preferenceArgTypes,
  defaultPreferenceArgs,
  argsToPreferences,
  type PreferenceArgs,
} from '../../.storybook/preferences-args';

interface StoryArgs extends PreferenceArgs {
  countdownSeconds: number;
}

const meta: Meta<StoryArgs> = {
  title: 'Screens/PreRecordingCountdownScreen',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    countdownSeconds: {
      control: { type: 'range', min: 0, max: 5, step: 1 },
      description: 'Countdown value in seconds',
      table: { category: 'State' },
    },
    ...preferenceArgTypes,
  },
  args: {
    ...defaultPreferenceArgs,
    countdownSeconds: 3,
  },
  render: (args) => (
    <PreRecordingCountdownScreen
      countdownSeconds={args.countdownSeconds}
      preferences={argsToPreferences(args)}
    />
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Countdown at 3 seconds
 */
export const CountdownThree: Story = {
  args: {
    countdownSeconds: 3,
  },
};

/**
 * Countdown at 2 seconds
 */
export const CountdownTwo: Story = {
  args: {
    countdownSeconds: 2,
  },
};

/**
 * Countdown at 1 second
 */
export const CountdownOne: Story = {
  args: {
    countdownSeconds: 1,
  },
};

/**
 * Countdown at 0 - about to start
 */
export const CountdownZero: Story = {
  args: {
    countdownSeconds: 0,
  },
};

/**
 * Custom branded countdown - purple theme
 */
export const PurpleBranding: Story = {
  args: {
    countdownSeconds: 3,
    customizeLink: true,
    companyName: 'PurpleTech',
    companyLogoUrl: 'https://placehold.co/120x40/7c3aed/white?text=PurpleTech',
    primaryColor: '#7c3aed',
  },
};

/**
 * Custom branded countdown - blue theme
 */
export const BlueBranding: Story = {
  args: {
    countdownSeconds: 2,
    customizeLink: true,
    companyName: 'BlueStream',
    primaryColor: '#2563eb',
  },
};

/**
 * Custom branded countdown - green theme
 */
export const GreenBranding: Story = {
  args: {
    countdownSeconds: 1,
    customizeLink: true,
    companyName: 'GreenRecord',
    primaryColor: '#10b981',
  },
};

/**
 * Custom branded countdown - orange theme with footnote
 */
export const OrangeBranding: Story = {
  args: {
    countdownSeconds: 3,
    customizeLink: true,
    companyName: 'OrangeCapture',
    footnoteText: 'Recording will start automatically',
    primaryColor: '#f97316',
  },
};
