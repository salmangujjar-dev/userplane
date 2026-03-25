import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Userplane',
    description: 'Userplane Chrome Extension',
    permissions: ['storage', 'identity'],
    host_permissions: ['https://api-dev.userplane.io/*', 'https://api.userplane.io/*'],
  },
  webExt: {
    startUrls: ['https://dash-dev.userplane.io'],
  },
  vite: () => ({
    resolve: {
      conditions: ['source'],
    },
  }),
});
