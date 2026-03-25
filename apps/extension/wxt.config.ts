import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: () => {
    const apiUrl = import.meta.env.WXT_API_URL || 'https://api-dev.userplane.io';

    return {
      name: 'Userplane',
      description: 'Userplane Chrome Extension',
      permissions: ['storage', 'identity', 'sidePanel', 'tabs'],
      host_permissions: [`${apiUrl}/*`],
      action: {
        default_icon: {
          16: 'icon/light-16.png',
          32: 'icon/light-32.png',
        },
        theme_icons: [
          { light: 'icon/light-16.png', dark: 'icon/dark-16.png', size: 16 },
          { light: 'icon/light-32.png', dark: 'icon/dark-32.png', size: 32 },
        ],
      },
      side_panel: {
        default_path: 'sidepanel/index.html',
      },
    };
  },
  webExt: {
    startUrls: ['https://dash-dev.userplane.io'],
  },
  dev: {
    server: {
      port: 3010,
    },
  },
  vite: () => ({
    resolve: {
      conditions: ['source'],
    },
    server: {
      allowedHosts: true,
    },
  }),
});
