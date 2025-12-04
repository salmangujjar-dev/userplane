interface EnvConfig {
  api: {
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
    auth: {
      cookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX || 'userplane',
    },
  };

  return config;
}

export const env = loadEnvConfig();
