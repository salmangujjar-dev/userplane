import type { IntegrationConfig } from '@/types/integrations';

import { chromeExtensionConfig } from './chrome-extension';
import { intercomConfig } from './intercom';
import { slackConfig } from './slack';
import { zendeskConfig } from './zendesk';

export const INTEGRATION_REGISTRY: Record<string, IntegrationConfig> = {
  intercom: intercomConfig,
  slack: slackConfig,
  zendesk: zendeskConfig,
  'chrome-extension': chromeExtensionConfig,
};
