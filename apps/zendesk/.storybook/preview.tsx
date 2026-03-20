import '../src/app/index.css';

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'zendesk',
      values: [
        { name: 'zendesk', value: '#f8f9f9' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
