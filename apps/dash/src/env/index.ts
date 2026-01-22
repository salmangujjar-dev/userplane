interface EnvConfig {
  api: {
    url: string;
  };
  recorder: {
    url: string;
  };
  dashboard: {
    url: string;
  };
  home: {
    url: string;
  };
  auth: {
    cookiePrefix: string;
  };
}

function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    },
    recorder: {
      url: process.env.NEXT_PUBLIC_RECORDER_URL || 'http://localhost:4322',
    },
    dashboard: {
      url: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000',
    },
    home: {
      url: process.env.NEXT_PUBLIC_HOME_URL || 'http://localhost:4321',
    },
    auth: {
      cookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX || 'userplane',
    },
  };

  return config;
}

export const env = loadEnvConfig();
