import '../src/styles/global.css';

import type { Preview } from '@storybook/react-vite';

import { AppModeProvider } from '@/contexts/AppModeContext';

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppModeProvider actionType="recording">
        <Story />
      </AppModeProvider>
    ),
  ],
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1f2937' },
        { name: 'gray', value: '#f3f4f6' },
      ],
    },
  },
};

export default preview;
