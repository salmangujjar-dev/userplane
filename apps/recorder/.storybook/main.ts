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
    // Add path aliases
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../src'),
      '@stories': resolve(__dirname, '.'),
      // Replace next/image with a plain <img> mock to bypass hostname validation
      'next/image': resolve(__dirname, 'mocks/next-image.tsx'),
    };

    // Polyfill `process.env` for Node-only code (e.g. next/image) running in the browser
    config.define = {
      ...config.define,
      'process.env': '{}',
    };

    // Next.js tsconfig uses "jsx": "preserve" which skips the React import transform.
    // Tell esbuild to use the automatic JSX runtime so stories don't need `import React`.
    config.esbuild = {
      ...config.esbuild,
      jsx: 'automatic',
    };

    // Add Tailwind CSS plugin
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());

    return config;
  },
};

export default config;
