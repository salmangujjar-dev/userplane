import type { Preview } from '@storybook/react';

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
          'Getting Started',
          ['Quick Start', 'Embed vs SDK'],
          'CDN Loading',
          ['How It Works', 'Bootstrap Loader', 'Manifest & Caching'],
          'Auto-Initialization',
          ['Overview', 'URL Parameters', 'window.userplane'],
          'Build System',
          ['Overview', 'CDN Build', 'NPM Build'],
          'Deployment',
          ['CDN Deployment', 'Environment Setup'],
          'API Reference',
          ['window.userplane API'],
          'Troubleshooting',
          ['Common Issues'],
        ],
      },
    },
  },
};

export default preview;
