import { TALLY_SALES_FORM_URL } from '../contact';
import { SIGNUP_URL } from '../onboarding';
import { getDocsUrl, getMarketingUrl } from '../urls';
import type { IntegrationConfig } from './_types';

type RequiredOverrides = Pick<IntegrationConfig, 'slug' | 'name' | 'url' | 'gradient'>;
type OptionalOverrides = Partial<
  Pick<
    IntegrationConfig,
    'seo' | 'jsonLd' | 'hero' | 'steps' | 'features' | 'compliance' | 'resources' | 'cta'
  >
>;

export function defineIntegration(
  overrides: RequiredOverrides & OptionalOverrides
): IntegrationConfig {
  const { name, slug, url } = overrides;

  return {
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
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    hero: {
      headline: {
        lines: ['Screen recordings that', 'live inside'],
        accent: name,
      },
      description: `Userplane is the screen recording layer for support teams using ${name}. Request, capture, and replay customer issues with full technical context.`,
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'See Demo', href: '/demo' },
      preview: {
        src: `https://placehold.co/1440x800/f8f8f8/cccccc?text=${encodeURIComponent(name)}+Integration`,
        alt: `${name} integration preview`,
      },
    },
    steps: {
      headline: {
        before: 'Userplane',
        segments: [
          { accent: 'captures', after: 'what your customer sees,' },
          { accent: 'attaches', after: 'technical context, and delivers' },
          { accent: 'resolution', after: 'without the back and forth.' },
        ],
      },
      steps: [
        {
          number: '01',
          title: `Send a recording request from ${name}`,
          description: `With one click from your ${name} conversation, send a recording link to your customer. No installs or browser extensions needed.`,
          image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+01',
        },
        {
          number: '02',
          title: 'Customer records what went wrong',
          description:
            'Your customer clicks the link and records their screen. Console logs, network requests, and session metadata are captured automatically.',
          image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+02',
        },
        {
          number: '03',
          title: 'Replay with complete context',
          description: `The recording appears right in your ${name} workspace with console errors, network waterfall, and browser metadata attached.`,
          image: 'https://placehold.co/400x220/f8f8f8/cccccc?text=Step+03',
        },
      ],
    },
    features: [
      {
        number: '01',
        title: `Native ${name} integration`,
        description: `Userplane lives inside ${name}. Your team can request recordings without switching tabs or copying links. The entire workflow happens where your conversations already live.`,
        tagline: 'Seamless integration',
        capabilities: [
          'One-click recording requests',
          'Inline recording playback',
          'Conversation-linked recordings',
          'No context switching',
        ],
        image: `https://placehold.co/864x540/f8f8f8/cccccc?text=Native+${encodeURIComponent(name)}+integration`,
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
        image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Automatic+technical+context',
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
        image: 'https://placehold.co/864x540/f8f8f8/cccccc?text=Privacy-first+recording',
      },
    ],
    compliance: {
      label: 'Security',
      headline: {
        bold: 'Secure by design.',
        muted: 'Safe by default.',
      },
      badges: [
        {
          title: 'GDPR',
          description:
            'Fully compliant with GDPR. Customer data is processed and stored in accordance with EU data protection regulations.',
          icon: 'gdpr',
        },
        {
          title: 'CCPA',
          description:
            'Compliant with the California Consumer Privacy Act. Users retain full control over their personal information.',
          icon: 'ccpa',
        },
      ],
    },
    resources: {
      label: 'Resources',
      headline: 'The Latest',
      links: [
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
        {
          label: 'Developer',
          title: 'Developer Installation Guide',
          description:
            'Technical guide for installing the Userplane SDK and configuring it for your application.',
          href: getDocsUrl('/developer/installation'),
        },
      ],
      seeAllHref: getDocsUrl(''),
    },
    cta: {
      headline: {
        lines: ['Screen recordings that', 'live inside'],
        accent: name,
      },
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'Talk to a Human', href: TALLY_SALES_FORM_URL },
    },
    // Apply overrides last so they win
    ...overrides,
  };
}
