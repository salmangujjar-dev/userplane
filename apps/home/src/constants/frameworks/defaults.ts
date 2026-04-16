import type { FrameworkConfig } from '@/types/frameworks';

import { SIGNUP_URL } from '../onboarding';
import { getMarketingUrl } from '../urls';
import { buildUTM, withUTM } from '../utm';
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
      'How recordings capture console logs, network requests, and session info automatically.',
    href: DOCS_RECORDING_REQUESTING,
  };

  const config: FrameworkConfig = {
    name,
    slug,
    shortName,
    icon,
    gradient,
    seo: {
      title: `Userplane for ${name} | Screen Recordings with Console Logs and Session Info`,
      description: `Resolve ${name} bugs from the recording, not the ticket. Console logs, network data, and full session context on every capture.`,
      keywords: `${name.toLowerCase()} screen recording, ${name.toLowerCase()} session replay, ${name.toLowerCase()} console logs, ${name.toLowerCase()} debugging, userplane ${name.toLowerCase()}, screen recording sdk`,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Userplane for ${name}`,
      description: `Screen recordings with console logs and session info for ${name} applications.`,
      url: getMarketingUrl(`/frameworks/${slug}`),
    },
    hero: {
      headline: {
        lines: ['Screen recordings for', `${name} applications`],
        highlights: [{ wordIndex: 3, color: 'blue' as const }],
      },
      description: [`Logs, network data, and session info from your ${name} app.`],
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
        lines: [`Resolve ${name} issues with full session context`],
        highlights: [{ wordIndex: 1, color: 'blue' as const }],
      },
      primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
      secondaryCTA: { text: 'View Docs', href: DOCS_HOME },
    },
    ...rest,
  };

  // Post-process: inject UTM params on all CTA hrefs
  config.hero.primaryCTA.href = withUTM(
    config.hero.primaryCTA.href,
    buildUTM('framework', slug, 'hero-primary')
  );
  if (config.hero.secondaryCTA) {
    config.hero.secondaryCTA.href = withUTM(
      config.hero.secondaryCTA.href,
      buildUTM('framework', slug, 'hero-secondary')
    );
  }
  config.cta.primaryCTA.href = withUTM(
    config.cta.primaryCTA.href,
    buildUTM('framework', slug, 'cta-primary')
  );
  if (config.cta.secondaryCTA) {
    config.cta.secondaryCTA.href = withUTM(
      config.cta.secondaryCTA.href,
      buildUTM('framework', slug, 'cta-secondary')
    );
  }

  return config;
}
