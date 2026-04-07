import type { FrameworkConfig } from '@/types/frameworks';

import { SIGNUP_URL } from '../onboarding';
import { getMarketingUrl } from '../urls';
import { DOCS_HOME, DOCS_RECORDING_REQUESTING, DOCS_SDK_OVERVIEW } from './links';
import { FRAMEWORK_LOGOS, FRAMEWORK_LOGOS_LABEL } from './logos';

type RequiredOverrides = Pick<FrameworkConfig, 'slug' | 'name' | 'gradient' | 'icon'>;
type OptionalOverrides = Partial<
  Pick<FrameworkConfig, 'shortName' | 'seo' | 'jsonLd' | 'hero' | 'features' | 'logos' | 'cta'>
> & {
  resources?: Partial<FrameworkConfig['resources']>;
};

export function defineFramework(overrides: RequiredOverrides & OptionalOverrides): FrameworkConfig {
  const { name, slug, icon, gradient, resources: resourcesOverrides, ...rest } = overrides;
  const shortName = rest.shortName ?? name;

  const frameworkDocLink = {
    label: 'Guide',
    title: `${shortName} Setup Guide`,
    description: `Install Userplane in your ${shortName} application. Step-by-step setup with code examples.`,
    href: DOCS_HOME,
  };

  const sdkLink = {
    label: 'SDK',
    title: 'SDK Overview',
    description:
      'Embed script or npm package. Attach metadata, control recordings, and configure privacy.',
    href: DOCS_SDK_OVERVIEW,
  };

  const recordingLink = {
    label: 'Recording',
    title: 'How Screen Recording Works',
    description:
      'How recordings capture console logs, network requests, and session metadata automatically.',
    href: DOCS_RECORDING_REQUESTING,
  };

  return {
    name,
    slug,
    shortName,
    icon,
    gradient,
    seo: {
      title: `Userplane for ${name} | Screen Recordings with Console Logs and Session Data`,
      description: `Capture console logs, network requests, and session metadata from your ${name} application. One-click screen recordings for debugging and support.`,
      keywords: `${name.toLowerCase()} screen recording, ${name.toLowerCase()} session replay, ${name.toLowerCase()} console logs, ${name.toLowerCase()} debugging, userplane ${name.toLowerCase()}, screen recording sdk`,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Userplane for ${name}`,
      description: `Screen recordings with console logs and session data for ${name} applications.`,
      url: getMarketingUrl(`/frameworks/${slug}`),
    },
    hero: {
      headline: {
        lines: ['Screen recordings for', `${name} applications`],
        highlights: [{ wordIndex: 3, color: 'blue' as const }],
      },
      description: [
        `Capture console logs, network requests, and session metadata from your ${name} application.`,
      ],
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'View Docs', href: DOCS_HOME },
    },
    features: [],
    logos: {
      label: FRAMEWORK_LOGOS_LABEL,
      items: FRAMEWORK_LOGOS,
    },
    resources: {
      label: 'Resources',
      headline: shortName,
      links: [frameworkDocLink, sdkLink, recordingLink],
      seeAllHref: DOCS_HOME,
      ...resourcesOverrides,
    },
    cta: {
      headline: {
        lines: ['Start capturing sessions', `in your ${name} app`],
        highlights: [{ wordIndex: 1, color: 'blue' as const }],
      },
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'View Docs', href: DOCS_HOME },
    },
    ...rest,
  };
}
