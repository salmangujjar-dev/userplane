import type { Preview } from '@storybook/html';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Demos',
          ['Console Capture', 'Network Capture', 'Click Tracking', 'Error Capture', 'LogStore'],
          'Getting Started',
          ['Quick Start'],
          'Architecture',
          ['Overview', 'Event Flow', 'Lifecycle'],
          'Interceptors',
          ['Overview', 'Console', 'Network', 'User Actions', 'Errors'],
          'Storage',
          ['LogStore'],
          'Dispatch',
          ['Strategies'],
          'Guides',
          ['Internal Endpoint Filtering', 'Payload Truncation', 'Tab State'],
          'API Reference',
          ['LogProcessor', 'LogStore', 'Interceptors', 'Utilities', 'Types'],
          'Examples',
          ['Basic Usage'],
        ],
      },
    },
  },
};

export default preview;
