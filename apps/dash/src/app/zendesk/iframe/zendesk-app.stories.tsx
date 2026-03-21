import { createMockZAFClient } from '@stories/mocks/zaf-client';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { ZendeskApp } from './zendesk-app';

const iframeContainer: Decorator = (Story) => (
  <div
    style={{
      width: '330px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      background: '#f8f9f9',
    }}
  >
    <Story />
  </div>
);

const withMockClient: Decorator = (Story) => {
  const client = createMockZAFClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ZAFClient = {
    init: () => client,
  };
  return <Story />;
};

const meta: Meta<typeof ZendeskApp> = {
  title: 'Zendesk/SetupScreen',
  component: ZendeskApp,
  decorators: [withMockClient, iframeContainer],
  parameters: {
    backgrounds: { default: 'zendesk' },
  },
};

export default meta;

type Story = StoryObj<typeof ZendeskApp>;

export const NeedsSetup: Story = {
  args: {
    config: null,
    subdomain: 'd3v-userplane',
    apiUrl: 'https://api-dev.userplane.io',
    dashboardUrl: 'https://dash-dev.userplane.io',
  },
};

export const Connected: Story = {
  args: {
    config: { apiToken: 'mock-token', workspaceId: 'ws_mock123', subdomain: 'd3v-userplane' },
    subdomain: 'd3v-userplane',
    apiUrl: 'https://api-dev.userplane.io',
    dashboardUrl: 'https://dash-dev.userplane.io',
  },
};
