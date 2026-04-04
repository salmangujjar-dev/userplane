// ── Shared types for integration microsites ──

export interface GradientConfig {
  /** 4 RGBA color stops for the integration's brand gradient */
  stops: [string, string, string, string];
}

export interface ButtonConfig {
  text: string;
  href: string;
}

export interface IntegrationHeadline {
  lines: string[];
  accent: string;
}

export interface FeatureData {
  number: string;
  title: string;
  description: string;
  tagline: string;
  capabilities: string[];
  image?: string;
}

export interface ResourceLink {
  label: string;
  title: string;
  description: string;
  href: string;
}

export interface IntegrationLogo {
  name: string;
  asset: `integrations/${string}.webp`;
}

// ── Unified config for a single integration microsite ──

export interface IntegrationConfig {
  slug: string;
  name: string;
  url: string;
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
    description: string;
    primaryCTA: ButtonConfig;
    secondaryCTA: ButtonConfig;
    preview: { src: string; alt: string };
  };
  features: FeatureData[];
  resources: {
    label: string;
    headline: string;
    links: ResourceLink[];
    seeAllHref: string;
  };
  cta: {
    headline: IntegrationHeadline;
    primaryCTA: ButtonConfig;
    secondaryCTA: ButtonConfig;
  };
}
