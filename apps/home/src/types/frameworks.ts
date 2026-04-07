// ── Shared types for framework microsites ──

import type {
  ButtonConfig,
  FeatureData,
  GradientConfig,
  IntegrationHeadline,
  ResourceLink,
} from './integrations';

export type { ButtonConfig, FeatureData, GradientConfig, IntegrationHeadline, ResourceLink };

/** Pre-resolved logo for the marquee */
export interface MarqueeLogo {
  name: string;
  src: string;
}

// ── Unified config for a single framework microsite ──

export interface FrameworkConfig {
  slug: string;
  name: string;
  /** Shorter display name for nav dropdowns and cards */
  shortName: string;
  /** Framework SVG icon for sidebar and hero */
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
    preview?: { src: string; alt: string };
    primaryCTA: ButtonConfig;
    secondaryCTA: ButtonConfig;
  };
  features: FeatureData[];
  logos: {
    label: string;
    items: MarqueeLogo[];
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
