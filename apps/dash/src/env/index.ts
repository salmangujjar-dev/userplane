interface EnvConfig {
  api: {
    url: string;
  };
}

function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    },
  };

  return config;
}

export const env = loadEnvConfig();
