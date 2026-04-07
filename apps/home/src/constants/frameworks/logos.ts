import type { IntegrationAssetKey } from '@userplane/storage/media';
import { mergeTransformOptions } from '@userplane/storage/media';

import type { MarqueeLogo } from '@/types/frameworks';

import { mediaClient } from '../../lib/media';

// ── Helpers ──

const LOGO_TRANSFORM = mergeTransformOptions('icon', { width: 24, height: 24, dpr: 2 });

function resolveLogo(name: string, asset: IntegrationAssetKey): MarqueeLogo {
  return {
    name,
    src: mediaClient.getIntegrationMediaUrl(asset, { transform: LOGO_TRANSFORM }),
  };
}

// ── Integration logos (shown on framework pages — "works with your support stack") ──

export const FRAMEWORK_LOGOS_LABEL = 'Works with the tools you already use';

export const FRAMEWORK_LOGOS: MarqueeLogo[] = [
  resolveLogo('Intercom', 'integrations/intercom.webp'),
  resolveLogo('Zendesk', 'integrations/zendesk.webp'),
  resolveLogo('Crisp', 'integrations/crisp.webp'),
  resolveLogo('Help Scout', 'integrations/helpscout.webp'),
  resolveLogo('Slack', 'integrations/slack.webp'),
  resolveLogo('Zapier', 'integrations/zapier.webp'),
  resolveLogo('Freshdesk', 'integrations/freshdesk.webp'),
  resolveLogo('HubSpot', 'integrations/hubspot.webp'),
  resolveLogo('Jira', 'integrations/jira.webp'),
  resolveLogo('Linear', 'integrations/linear.webp'),
  resolveLogo('Notion', 'integrations/notion.webp'),
  resolveLogo('Salesforce', 'integrations/salesforce.webp'),
];
