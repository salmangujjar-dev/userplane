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
          ['Quick Start', 'CDN & Script Tag', 'Framework Guides'],
          'Concepts',
          ['Recording Sessions', 'Workspace Identity', 'Tab Identity', 'Iframe Architecture'],
          'Configuration',
          ['Initialize Options', 'Open Modes', 'URL Parameters'],
          'Lifecycle',
          ['Overview', 'State Tracking', 'Unload Protection'],
          'Metadata',
          ['Overview', 'Static Metadata', 'Dynamic Metadata'],
          'Privacy',
          ['Privacy Blur', 'Domain Verification', 'Sandbox & Permissions'],
          'Cross-Tab',
          ['Tab Reference', 'Capture Iframe'],
          'Architecture',
          ['Overview', 'Frame Managers', 'Bridge Integration'],
          'API Reference',
          ['initialize', 'Recorder Control', 'State & Session', 'Metadata API', 'Types'],
          'Troubleshooting',
          ['Common Issues', 'Debugging Guide'],
        ],
      },
    },
  },
};

export default preview;
