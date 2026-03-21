import { createMockZAFClient } from '@stories/mocks/zaf-client';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { ZendeskApiProvider } from '@/hooks/zendesk/use-zendesk-api';

import { ClientContext } from './ClientProvider';
import { TopBar } from './TopBar';

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
    <ZendeskApiProvider sessionToken="mock-session-token" apiUrl="https://api-dev.userplane.io">
      <ClientContext.Provider value={client}>
        <Story />
      </ClientContext.Provider>
    </ZendeskApiProvider>
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
