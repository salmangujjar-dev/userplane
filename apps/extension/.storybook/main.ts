import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.{js,jsx,mjs,ts,tsx}'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@chromatic-com/storybook'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../src'),
      '@userplane/ui/globals.css': resolve(__dirname, '../../../packages/ui/src/styles/globals.css'),
      '@userplane/ui': resolve(__dirname, '../../../packages/ui/src'),
      'posthog-js/dist/module.no-external': resolve(__dirname, 'mocks/posthog.ts'),
      'posthog-js/dist/posthog-recorder': resolve(__dirname, 'mocks/posthog.ts'),
      'posthog-js/dist/exception-autocapture': resolve(__dirname, 'mocks/posthog.ts'),
      'posthog-js': resolve(__dirname, 'mocks/posthog.ts'),
    };

    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
    };

    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());

    return config;
  },
};

export default config;
