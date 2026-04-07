import type { FrameworkAssetKey, IntegrationAssetKey } from '@userplane/storage/media';
import { mergeTransformOptions } from '@userplane/storage/media';

import type { MarqueeLogo } from '@/types/roles';

import { mediaClient } from '../../lib/media';

// ── Helpers ──

const LOGO_TRANSFORM = mergeTransformOptions('icon', { width: 24, height: 24, dpr: 2 });

function resolveIntegrationLogo(name: string, asset: IntegrationAssetKey): MarqueeLogo {
  return {
    name,
    src: mediaClient.getIntegrationMediaUrl(asset, { transform: LOGO_TRANSFORM }),
  };
}

function resolveFrameworkLogo(name: string, asset: FrameworkAssetKey): MarqueeLogo {
  return {
    name,
    src: mediaClient.getFrameworkMediaUrl(asset, { transform: LOGO_TRANSFORM }),
  };
}

// ── Integration logos (used by support & CS role pages) ──

export const ROLE_LOGOS_INTEGRATION_LABEL = 'Works with the tools you already use';

export const ROLE_LOGOS_INTEGRATION: MarqueeLogo[] = [
  resolveIntegrationLogo('Intercom', 'integrations/intercom.webp'),
  resolveIntegrationLogo('Zendesk', 'integrations/zendesk.webp'),
  resolveIntegrationLogo('Crisp', 'integrations/crisp.webp'),
  resolveIntegrationLogo('Help Scout', 'integrations/helpscout.webp'),
  resolveIntegrationLogo('Slack', 'integrations/slack.webp'),
  resolveIntegrationLogo('Zapier', 'integrations/zapier.webp'),
  resolveIntegrationLogo('Freshdesk', 'integrations/freshdesk.webp'),
  resolveIntegrationLogo('HubSpot', 'integrations/hubspot.webp'),
  resolveIntegrationLogo('Jira', 'integrations/jira.webp'),
  resolveIntegrationLogo('Linear', 'integrations/linear.webp'),
  resolveIntegrationLogo('Notion', 'integrations/notion.webp'),
  resolveIntegrationLogo('Salesforce', 'integrations/salesforce.webp'),
];

// ── Framework logos (used by developer role page) ──

export const ROLE_LOGOS_FRAMEWORK_LABEL = 'Works with your stack';

export const ROLE_LOGOS_FRAMEWORK: MarqueeLogo[] = [
  resolveFrameworkLogo('React', 'frameworks/react.svg'),
  resolveFrameworkLogo('Next.js', 'frameworks/nextjs.svg'),
  resolveFrameworkLogo('Vue', 'frameworks/vue.svg'),
  resolveFrameworkLogo('Angular', 'frameworks/angular.svg'),
  resolveFrameworkLogo('Nuxt', 'frameworks/nuxt.svg'),
  resolveFrameworkLogo('Svelte', 'frameworks/svelte.svg'),
  resolveFrameworkLogo('Astro', 'frameworks/astro.svg'),
  resolveFrameworkLogo('Remix', 'frameworks/remix.svg'),
  resolveFrameworkLogo('Node.js', 'frameworks/nodejs.svg'),
  resolveFrameworkLogo('Bun', 'frameworks/bun.svg'),
  resolveFrameworkLogo('Deno', 'frameworks/deno.svg'),
  resolveFrameworkLogo('TypeScript', 'frameworks/typescript.svg'),
  resolveFrameworkLogo('JavaScript', 'frameworks/javascript.svg'),
  resolveFrameworkLogo('HTML5', 'frameworks/html5.svg'),
];
