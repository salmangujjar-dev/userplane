import type { IntegrationConfig } from '@/types/integrations';

import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getDocsUrl, getMarketingUrl } from '../urls';

type RequiredOverrides = Pick<IntegrationConfig, 'slug' | 'name' | 'url' | 'gradient'>;
type OptionalOverrides = Partial<
  Pick<
    IntegrationConfig,
    'shortName' | 'seo' | 'jsonLd' | 'hero' | 'features' | 'resources' | 'cta'
  >
>;

export function defineIntegration(
  overrides: RequiredOverrides & OptionalOverrides
): IntegrationConfig {
  const { name, slug, url } = overrides;
  const shortName = overrides.shortName ?? name;

  return {
    shortName,
    seo: {
      title: `${name} Integration | Userplane - Screen Recordings for ${name}`,
      description: `Request and receive screen recordings without leaving ${name}. Capture console logs, network requests, and session data attached to every conversation.`,
      keywords: `${name.toLowerCase()} screen recording, ${name.toLowerCase()} integration, screen recording for ${name.toLowerCase()}, ${name.toLowerCase()} support tool, userplane, customer support, bug reporting`,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `Userplane for ${name}`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: `Screen recording integration for ${name}. Request, capture, and replay customer issues with full technical context.`,
      url: getMarketingUrl(`/integrations/${slug}`),
      sameAs: url,
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '249',
        priceCurrency: 'USD',
        offerCount: 4,
      },
    },
    hero: {
      headline: {
        lines: ['Screen recordings that', 'live inside'],
        accent: shortName,
      },
      description: `Userplane is the screen recording layer for support teams using ${shortName}. Request, capture, and replay customer issues with full technical context.`,
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'See Demo', href: '/demo' },
      preview: {
        src: '',
        alt: `${name} integration preview`,
      },
    },
    features: [
      {
        number: '01',
        title: `Native ${shortName} integration`,
        description: `Userplane lives inside ${shortName}. Your team can request recordings without switching tabs or copying links. The entire workflow happens where your conversations already live.`,
        tagline: 'Seamless integration',
        capabilities: [
          'One-click recording requests',
          'Inline recording playback',
          'Conversation-linked recordings',
          'No context switching',
        ],
        image: '',
      },
      {
        number: '02',
        title: 'Automatic technical context',
        description:
          'Every recording automatically captures console logs, network requests, browser metadata, and user steps. Your engineering team gets the data they need without asking for it.',
        tagline: 'Full-stack visibility',
        capabilities: [
          'Console logs & errors',
          'Network request waterfall',
          'Browser & OS metadata',
          'Step-by-step user actions',
        ],
        image: '',
      },
      {
        number: '03',
        title: 'Privacy-first recording',
        description:
          'Sensitive data is automatically blurred and redacted before recordings reach your team. Built-in compliance controls ensure customer trust while giving your team complete visibility.',
        tagline: 'Built for trust & compliance',
        capabilities: [
          'Automatic PII redaction',
          'Field-level blurring',
          'GDPR & CCPA compliant',
          'Customer consent controls',
        ],
        image: '',
      },
    ],
    resources: {
      label: 'Resources',
      headline: 'The Latest',
      links: [
        {
          label: 'Integration',
          title: `Userplane for ${shortName}`,
          description: `See how Userplane works inside ${shortName} — features, setup, and what your team gets out of the box.`,
          href: getMarketingUrl(`/integrations/${slug}`),
        },
        {
          label: 'Quickstart',
          title: `Getting Started with ${name}`,
          description: `Set up Userplane in your ${name} workspace and send your first recording request in minutes.`,
          href: getDocsUrl('/getting-started/helpdesk-setup'),
        },
        {
          label: 'Recording',
          title: 'How Screen Recording Works',
          description:
            'Learn how recordings capture console logs, network requests, and session metadata automatically.',
          href: getDocsUrl('/recording/requesting'),
        },
      ],
      seeAllHref: getDocsUrl(''),
    },
    cta: {
      headline: {
        lines: ['Screen recordings that', 'live inside'],
        accent: shortName,
      },
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
    },
    // Apply overrides last so they win
    ...overrides,
  };
}
