import type { Meta, StoryObj } from '@storybook/react';

import { ErrorMessage } from '../ErrorMessage';
import { ErrorIcon, RecordingIcon, RecordingsListIcon, SuccessIcon, UserplaneIcon } from '../Icons';
import { LinkSuccess } from '../LinkSuccess';
import { OpenerView } from '../OpenerView';
import { ScreenHeader } from '../ScreenHeader';

// ============================================================
// Icons
// ============================================================

const iconsMeta: Meta = {
  title: 'Zendesk/Icons',
};

export default iconsMeta;

export const AllIcons: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <UserplaneIcon size={40} />
      <SuccessIcon size={40} />
      <ErrorIcon size={40} />
      <RecordingIcon size={40} />
      <RecordingsListIcon size={40} />
    </div>
  ),
};

// ============================================================
// ScreenHeader
// ============================================================

export const Header: StoryObj = {
  render: () => (
    <ScreenHeader
      icon={<UserplaneIcon size={40} />}
      title="Request a Recording"
      description="Send a screen recording link to the customer."
    />
  ),
};

export const HeaderNoDescription: StoryObj = {
  render: () => <ScreenHeader icon={<UserplaneIcon size={40} />} title="Userplane" />,
};

// ============================================================
// OpenerView
// ============================================================

export const Opener: StoryObj = {
  render: () => (
    <div style={{ width: '330px', padding: '16px' }}>
      <OpenerView
        onRequestRecording={() => console.log('Request recording')}
        onViewRecordings={() => console.log('View recordings')}
      />
    </div>
  ),
};

// ============================================================
// LinkSuccess
// ============================================================

export const Success: StoryObj = {
  render: () => (
    <div style={{ width: '330px', padding: '16px' }}>
      <LinkSuccess
        linkUrl="https://rec.userplane.io/abc123"
        description="The link has been added to your reply draft."
        actions={[
          { label: 'Create another link', onClick: () => {}, variant: 'primary' },
          { label: 'Done', onClick: () => {}, variant: 'secondary' },
        ]}
      />
    </div>
  ),
};

// ============================================================
// ErrorMessage
// ============================================================

export const Error: StoryObj = {
  render: () => (
    <div style={{ width: '330px', padding: '16px' }}>
      <ErrorMessage
        message="Recording limit exceeded. Upgrade your plan in the dashboard."
        onRetry={() => console.log('Retry')}
        onGoBack={() => console.log('Go back')}
      />
    </div>
  ),
};

export const ErrorNoActions: StoryObj = {
  render: () => (
    <div style={{ width: '330px', padding: '16px' }}>
      <ErrorMessage message="Something went wrong." />
    </div>
  ),
};
