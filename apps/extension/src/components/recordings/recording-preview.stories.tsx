import type { Meta, StoryObj } from '@storybook/react-vite';

import { useWorkspaceStore } from '@/stores/workspace';

import { RecordingPreview } from './recording-preview';

const defaultArgs = {
  recordingId: 'rec-001',
  createdBy: 'Alice Johnson',
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  expiresAt: null,
  durationMs: 125000, // 2:05
  thumbnailUrl: null,
};

const meta = {
  title: 'Recordings/RecordingPreview',
  component: RecordingPreview,
  parameters: {
    layout: 'padded',
  },
  args: defaultArgs,
  decorators: [
    (Story) => {
      useWorkspaceStore.setState({ workspaceId: 'ws-storybook-123' });
      return <Story />;
    },
  ],
} satisfies Meta<typeof RecordingPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithThumbnail: Story = {
  args: {
    thumbnailUrl: 'https://placehold.co/640x360/e2e8f0/64748b?text=Recording+Preview',
  },
};

export const ShortRecording: Story = {
  args: {
    durationMs: 15000, // 0:15
    createdBy: 'Bob Smith',
  },
};

export const LongRecording: Story = {
  args: {
    durationMs: 3661000, // 61:01
    createdBy: 'Charlie Brown',
  },
};

export const NoDuration: Story = {
  args: {
    durationMs: null,
  },
};

export const ExpiringSoon: Story = {
  args: {
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdBy: 'Diana Prince',
  },
};

export const NotExpiringSoon: Story = {
  args: {
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
};

export const RecordingGrid: Story = {
  name: 'Multiple Recordings',
  render: () => (
    <div className="space-y-2">
      <RecordingPreview
        recordingId="rec-001"
        createdBy="Alice Johnson"
        createdAt={new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)}
        expiresAt={null}
        durationMs={125000}
        thumbnailUrl={null}
      />
      <RecordingPreview
        recordingId="rec-002"
        createdBy="Bob Smith"
        createdAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)}
        expiresAt={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
        durationMs={45000}
        thumbnailUrl="https://placehold.co/640x360/e2e8f0/64748b?text=Screen+Recording"
      />
      <RecordingPreview
        recordingId="rec-003"
        createdBy="Charlie Brown"
        createdAt={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        expiresAt={null}
        durationMs={300000}
        thumbnailUrl={null}
      />
    </div>
  ),
};
