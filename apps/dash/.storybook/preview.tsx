import '@userplane/ui/globals.css';

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'zendesk', value: '#f8f9f9' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
};

export default preview;
