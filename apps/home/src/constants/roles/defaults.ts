import type { RoleConfig } from '@/types/roles';

import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getMarketingUrl } from '../urls';
import {
  DOCS_FOR_SUPPORT_AGENTS,
  DOCS_HELPDESK_SETUP,
  DOCS_HOME,
  DOCS_RECORDING_REQUESTING,
} from './links';
import { ROLE_LOGOS_INTEGRATION, ROLE_LOGOS_INTEGRATION_LABEL } from './logos';

type RequiredOverrides = Pick<RoleConfig, 'slug' | 'name' | 'gradient'>;
type OptionalOverrides = Partial<
  Pick<RoleConfig, 'shortName' | 'seo' | 'jsonLd' | 'hero' | 'features' | 'logos' | 'cta'>
> & {
  resources?: Partial<RoleConfig['resources']>;
};

export function defineRole(overrides: RequiredOverrides & OptionalOverrides): RoleConfig {
  const { name, slug, gradient, resources: resourcesOverrides, ...rest } = overrides;
  const shortName = rest.shortName ?? name;

  const onRampLink = {
    label: 'Getting Started',
    title: `Userplane for ${shortName}`,
    description: `See how Userplane works for ${shortName.toLowerCase()} — features, setup, and what your team gets.`,
    href: DOCS_FOR_SUPPORT_AGENTS,
  };

  const recordingLink = {
    label: 'Recording',
    title: 'How Screen Recording Works',
    description:
      'Learn how recordings capture console logs, network requests, and session metadata automatically.',
    href: DOCS_RECORDING_REQUESTING,
  };

  const helpdeskLink = {
    label: 'Quickstart',
    title: 'Help Desk Setup',
    description:
      'Connect Userplane to your help desk and send your first recording request in minutes.',
    href: DOCS_HELPDESK_SETUP,
  };

  return {
    name,
    slug,
    shortName,
    seo: {
      title: `Userplane for ${name} | Screen Recordings with Full Technical Context`,
      description: `Userplane helps ${name.toLowerCase()} resolve issues faster with screen recordings, console logs, network data, and session metadata.`,
      keywords: `userplane ${name.toLowerCase()}, screen recording ${name.toLowerCase()}, ${name.toLowerCase()} tools, support screen recording, session replay`,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Userplane for ${name}`,
      description: `Screen recordings with full technical context for ${name.toLowerCase()}.`,
      url: getMarketingUrl(`/for/${slug}`),
    },
    gradient,
    hero: {
      headline: {
        lines: ['Screen recordings with', 'full technical context'],
        highlights: [{ wordIndex: 4, color: 'blue' as const }],
      },
      description: [
        `Userplane gives ${name.toLowerCase()} screen recordings with console logs, network data, and session metadata.`,
      ],
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
    },
    features: [],
    logos: {
      label: ROLE_LOGOS_INTEGRATION_LABEL,
      items: ROLE_LOGOS_INTEGRATION,
    },
    resources: {
      label: 'Resources',
      headline: shortName,
      links: [onRampLink, recordingLink, helpdeskLink],
      seeAllHref: DOCS_HOME,
      ...resourcesOverrides,
    },
    cta: {
      headline: {
        lines: ['Screen recordings with', 'full technical context'],
        highlights: [{ wordIndex: 4, color: 'blue' as const }],
      },
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
    },
    // Apply overrides last so they win (resources is deep-merged above)
    ...rest,
  };
}
