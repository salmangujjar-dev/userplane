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
