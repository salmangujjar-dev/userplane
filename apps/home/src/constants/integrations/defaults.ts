import type { IntegrationConfig } from '@/types/integrations';

import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getMarketingUrl } from '../urls';
import {
  DOCS_DEVELOPER_INSTALLATION,
  DOCS_HELPDESK_SETUP,
  DOCS_HOME,
  DOCS_RECORDING_REQUESTING,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';

type RequiredOverrides = Pick<IntegrationConfig, 'slug' | 'name' | 'url' | 'gradient' | 'icon'>;
type OptionalOverrides = Partial<
  Pick<IntegrationConfig, 'shortName' | 'seo' | 'jsonLd' | 'hero' | 'features' | 'browser' | 'cta'>
> & {
  resources?: Partial<IntegrationConfig['resources']>;
};

export function defineIntegration(
  overrides: RequiredOverrides & OptionalOverrides
): IntegrationConfig {
  const { name, slug, url, resources: resourcesOverrides, ...rest } = overrides;
  const shortName = rest.shortName ?? name;

  const integrationLink = {
    label: 'Integration' as const,
    title: `Userplane for ${shortName}`,
    description: `See how Userplane works inside ${shortName} — features, setup, and what your team gets out of the box.`,
    href: getMarketingUrl(`/integrations/${slug}`),
  };

  const quickstartLink = {
    label: 'Quickstart' as const,
    title: `Getting Started with ${name}`,
    description: `Set up Userplane in your ${name} workspace and send your first recording request in minutes.`,
    href: DOCS_HELPDESK_SETUP,
  };

  const recordingLink = {
    label: 'Recording' as const,
    title: 'How Screen Recording Works',
    description:
      'Learn how recordings capture console logs, network requests, and session metadata automatically.',
    href: DOCS_RECORDING_REQUESTING,
  };

  const developerLink = {
    label: 'Developer' as const,
    title: 'Developer Installation Guide',
    description:
      'Technical guide for installing the Userplane SDK and configuring it for your application.',
    href: DOCS_DEVELOPER_INSTALLATION,
  };

  return {
    name,
    slug,
    url,
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
        lines: ['Screen recordings that', `live inside ${shortName}`],
        highlights: [{ wordIndex: 5, color: 'yellow' as const }],
      },
      description: [
        `Userplane is the screen recording layer for support teams using ${shortName}. Request, capture, and replay customer issues with full technical context.`,
      ],
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
        learnMoreHref: DOCS_HELPDESK_SETUP,
      },
      {
        number: '02',
        title: 'Automatic technical context',
        description:
          'Every recording automatically captures console logs, network requests, browser metadata, and user steps. Your engineering team gets the data they need without asking for it.',
        tagline: 'Full-stack visibility',
        capabilities: [
          'Console logs & errors',
          'Network request detail',
          'Browser & OS metadata',
          'Step-by-step user actions',
        ],
        image: '',
        learnMoreHref: DOCS_RECORDING_REQUESTING,
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
        learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
      },
    ],
    browser: {
      links: [integrationLink, quickstartLink, recordingLink],
    },
    resources: {
      label: 'Resources',
      headline: shortName,
      links: [quickstartLink, recordingLink, developerLink],
      seeAllHref: DOCS_HOME,
      ...resourcesOverrides,
    },
    cta: {
      headline: {
        lines: ['Request screen recordings', `right within ${shortName}`],
        highlights: [{ wordIndex: 5, color: 'yellow' as const }],
      },
      description: `Request, capture, and replay customer issues with full technical context — without leaving ${shortName}.`,
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
    },
    // Apply overrides last so they win (resources is deep-merged above)
    ...rest,
  };
}
