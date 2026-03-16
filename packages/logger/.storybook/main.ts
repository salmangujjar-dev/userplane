import type { StorybookConfig } from '@storybook/html-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|ts)', '../stories/**/*.mdx'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  viteFinal(config) {
    if (process.env.NODE_ENV === 'production') {
      config.base = '/logger/';
    }
    return config;
  },
  docs: {},
  core: {
    disableTelemetry: true,
  },
};

export default config;
