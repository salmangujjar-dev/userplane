import type { Meta, StoryObj } from '@storybook/react-vite';
import PreRecordingScreen from './PreRecordingScreen';
import {
  preferenceArgTypes,
  defaultPreferenceArgs,
  argsToPreferences,
  type PreferenceArgs,
} from '../../.storybook/preferences-args';

interface StoryArgs extends PreferenceArgs {
  requesterName?: string;
  isLoading?: boolean;
}

const meta: Meta<StoryArgs> = {
  title: 'Screens/PreRecordingScreen',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    requesterName: {
      control: 'text',
      description: 'Name of the person who requested the recording',
      table: { category: 'Content' },
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading state while requesting permissions',
      table: { category: 'State' },
    },
    ...preferenceArgTypes,
  },
  args: {
    ...defaultPreferenceArgs,
    requesterName: '',
    isLoading: false,
  },
  render: (args) => (
    <PreRecordingScreen
      requesterName={args.requesterName || undefined}
      isLoading={args.isLoading}
      preferences={argsToPreferences(args)}
      onStartRecording={() => console.log('Start recording clicked')}
    />
  ),
};

export default meta;
type Story = StoryObj<StoryArgs>;

/**
 * Default pre-recording screen with requester name
 */
export const Default: Story = {
  args: {
    requesterName: 'John from Support',
  },
};

/**
 * Without requester name
 */
export const NoRequester: Story = {
  args: {
    requesterName: '',
  },
};

/**
 * Loading state while requesting permissions
 */
export const Loading: Story = {
  args: {
    requesterName: 'Sarah',
    isLoading: true,
  },
};

/**
 * Custom branded screen - blue theme
 */
export const CustomBranding: Story = {
  args: {
    requesterName: 'Alex from Engineering',
    customizeLink: true,
    companyName: 'TechCorp',
    companyLogoUrl: 'https://placehold.co/120x40/2563eb/white?text=TechCorp',
    headerText: 'Share your screen with us',
    footnoteText: 'Your recording is encrypted and secure',
    primaryColor: '#2563eb',
  },
};

/**
 * Purple theme branding
 */
export const PurpleTheme: Story = {
  args: {
    requesterName: 'Design Team',
    customizeLink: true,
    companyName: 'DesignHub',
    headerText: 'Record your feedback',
    primaryColor: '#7c3aed',
  },
};

/**
 * Green theme branding
 */
export const GreenTheme: Story = {
  args: {
    requesterName: 'Customer Success',
    customizeLink: true,
    companyName: 'GreenTech',
    companyLogoUrl: 'https://placehold.co/120x40/10b981/white?text=GreenTech',
    headerText: 'Help us understand your issue',
    footnoteText: 'Recording will be reviewed within 24 hours',
    primaryColor: '#10b981',
  },
};

/**
 * Orange theme branding
 */
export const OrangeTheme: Story = {
  args: {
    requesterName: 'QA Team',
    customizeLink: true,
    companyName: 'BugTracker',
    headerText: 'Show us the bug',
    primaryColor: '#f97316',
  },
};
