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

export interface StepsHeadline {
  before: string;
  segments: Array<{ accent: string; after: string }>;
}

export interface StepData {
  number: string;
  title: string;
  description: string;
  image?: string;
}

export interface FeatureData {
  number: string;
  title: string;
  description: string;
  tagline: string;
  capabilities: string[];
  image?: string;
}

export interface ComplianceBadge {
  title: string;
  description: string;
  icon: 'gdpr' | 'ccpa';
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

// ── Shared data ──

export const INTEGRATION_LOGOS_LABEL = 'Works with the tools you already use';

export const INTEGRATION_LOGOS: IntegrationLogo[] = [
  { name: 'Intercom', asset: 'integrations/intercom.webp' },
  { name: 'Zendesk', asset: 'integrations/zendesk.webp' },
  { name: 'Crisp', asset: 'integrations/crisp.webp' },
  { name: 'Help Scout', asset: 'integrations/helpscout.webp' },
  { name: 'Slack', asset: 'integrations/slack.webp' },
  { name: 'Zapier', asset: 'integrations/zapier.webp' },
  { name: 'Freshdesk', asset: 'integrations/freshdesk.webp' },
  { name: 'HubSpot', asset: 'integrations/hubspot.webp' },
  { name: 'Jira', asset: 'integrations/jira.webp' },
  { name: 'Linear', asset: 'integrations/linear.webp' },
  { name: 'Notion', asset: 'integrations/notion.webp' },
  { name: 'Salesforce', asset: 'integrations/salesforce.webp' },
];
