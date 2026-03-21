import { createMockZAFClient } from '@stories/mocks/zaf-client';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { initZendeskApiClient } from '@/lib/zendesk/api-client';

import { ClientContext } from './ClientProvider';
import { TopBar } from './TopBar';

// Initialize a mock API client for stories
initZendeskApiClient('mock-token', 'https://api-dev.userplane.io');

const topBarContainer: Decorator = (Story) => (
  <div
    style={{
      width: '380px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      background: '#f8f9f9',
      minHeight: '450px',
    }}
  >
    <Story />
  </div>
);

const withMockClient: Decorator = (Story) => {
  const client = createMockZAFClient();
  return (
    <ClientContext.Provider value={client}>
      <Story />
    </ClientContext.Provider>
  );
};

const meta: Meta<typeof TopBar> = {
  title: 'Zendesk/TopBar',
  component: TopBar,
  decorators: [withMockClient, topBarContainer],
  parameters: {
    backgrounds: { default: 'zendesk' },
  },
};

export default meta;

type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: {
    workspaceId: 'ws_mock123',
    dashboardUrl: 'https://dash-dev.userplane.io',
  },
};
