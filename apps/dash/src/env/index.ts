import { type Environment, isSecureEnvironment, parseAppEnv } from '@workspace/shared/env';

interface EnvConfig {
  appEnv: Environment;
  /** Whether secure cookies are used (both environments use __Secure- prefix via HTTPS) */
  useSecureCookies: boolean;
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
  const appEnv = parseAppEnv(process.env.APP_ENV);
  const useSecureCookies = isSecureEnvironment(appEnv);

  const config: EnvConfig = {
    appEnv,
    useSecureCookies,
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.userplane.io',
    },
    recorder: {
      url: process.env.NEXT_PUBLIC_RECORDER_URL || 'https://recorder-dev.userplane.io',
    },
    dashboard: {
      url: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dash-dev.userplane.io',
    },
    home: {
      url: process.env.NEXT_PUBLIC_HOME_URL || 'https://home-dev.userplane.io',
    },
    auth: {
      cookiePrefix: process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX || 'userplane',
    },
  };

  return config;
}

export const env = loadEnvConfig();
