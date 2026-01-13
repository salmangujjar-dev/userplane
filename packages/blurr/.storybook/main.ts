import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|ts)', '../stories/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@chromatic-com/storybook'],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  docs: {},
  core: {
    disableTelemetry: true,
  },
};

export default config;
