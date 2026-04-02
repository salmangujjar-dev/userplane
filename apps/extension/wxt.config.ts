import posthogPlugin from '@posthog/rollup-plugin';
import { defineConfig } from 'wxt';

const shouldUploadSourcemaps = !!process.env.POSTHOG_PERSONAL_API_KEY;

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: () => {
    const apiUrl = import.meta.env.WXT_API_URL || 'https://api-dev.userplane.io';

    return {
      name: 'Request Screen Recording - Userplane',
      description:
        'Request screen recordings with console logs, network requests, and session data. Resolve support issues without the back and forth.',
      permissions: ['storage', 'sidePanel', 'tabs', 'contextMenus'],
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
      commands: {
        'create-recording-link': {
          suggested_key: {
            default: 'Ctrl+Shift+Y',
            mac: 'Command+Shift+Y',
          },
          description: 'Create Recording Link',
        },
      },
      omnibox: {
        keyword: 'userplane',
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
    plugins: shouldUploadSourcemaps
      ? [
          posthogPlugin({
            personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY!,
            projectId: process.env.POSTHOG_PROJECT_ID!,
            host: process.env.WXT_POSTHOG_HOST || 'https://i.userplane.io',
            sourcemaps: { enabled: true, deleteAfterUpload: true },
          }),
        ]
      : [],
    resolve: {
      conditions: ['source'],
    },
    server: {
      allowedHosts: true,
    },
  }),
});
