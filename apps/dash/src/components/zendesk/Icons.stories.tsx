import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  ErrorIcon,
  LockIcon,
  RecordingIcon,
  RecordingsListIcon,
  SuccessIcon,
  UpgradeIcon,
  UserplaneIcon,
} from './Icons';

const meta: Meta = {
  title: 'Zendesk/Icons',
  parameters: {
    backgrounds: { default: 'zendesk' },
  },
};

export default meta;

type Story = StoryObj;

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <UserplaneIcon size={40} />
      <SuccessIcon size={40} />
      <ErrorIcon size={40} />
      <RecordingIcon size={40} />
      <RecordingsListIcon size={40} />
      <LockIcon size={40} />
      <UpgradeIcon size={40} />
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <UserplaneIcon size={24} />
      <SuccessIcon size={24} />
      <ErrorIcon size={24} />
      <RecordingIcon size={24} />
      <RecordingsListIcon size={24} />
      <LockIcon size={24} />
      <UpgradeIcon size={24} />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <UserplaneIcon size={64} />
      <SuccessIcon size={64} />
      <ErrorIcon size={64} />
      <RecordingIcon size={64} />
      <RecordingsListIcon size={64} />
      <LockIcon size={64} />
      <UpgradeIcon size={64} />
    </div>
  ),
};
