// ── Shared types for integration microsites ──

import type { IntegrationAssetKey } from '@userplane/storage/media';

import type { HighlightConfig } from './highlight';

export interface GradientConfig {
  /** 4 RGBA color stops for the integration's brand gradient */
  stops: [string, string, string, string];
}

export interface ButtonConfig {
  text: string;
  href: string;
}

export interface HeadlineIcon {
  wordIndex: number;
  /** Where to place the icon relative to the word (default: 'before') */
  position?: 'before' | 'after';
  src: string;
  alt: string;
}

export interface IntegrationHeadline {
  lines: string[];
  highlights?: HighlightConfig[];
  icons?: HeadlineIcon[];
}

export interface FeatureData {
  number: string;
  title: string;
  description: string;
  tagline: string;
  capabilities: string[];
  image?: string;
  learnMoreHref?: string;
}

export interface ResourceLink {
  label: string;
  title: string;
  description: string;
  href: string;
}

export interface IntegrationLogo {
  name: string;
  asset: IntegrationAssetKey;
}

// ── Unified config for a single integration microsite ──

export interface IntegrationConfig {
  slug: string;
  name: string;
  /** Shorter display name for contexts where the full name reads awkwardly (e.g. "Chrome" instead of "Chrome Extension") */
  shortName: string;
  url: string;
  /** Brand icon for nav dropdowns, cards, etc. */
  icon: { src: string; alt: string };
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogImage?: string;
  };
  jsonLd: Record<string, unknown>;
  gradient: GradientConfig;
  hero: {
    headline: IntegrationHeadline;
    description: string[];
    primaryCTA: ButtonConfig;
    secondaryCTA: ButtonConfig;
    preview: { src: string; alt: string };
  };
  features: FeatureData[];
  browser: {
    links: ResourceLink[];
  };
  resources: {
    label: string;
    headline: string;
    links: ResourceLink[];
    seeAllHref: string;
  };
  cta: {
    headline: IntegrationHeadline;
    description?: string;
    primaryCTA: ButtonConfig;
    secondaryCTA: ButtonConfig;
  };
}
