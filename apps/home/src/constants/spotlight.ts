/**
 * Integration logo data
 */
export interface IntegrationLogo {
  src: string;
  alt: string;
}

/**
 * Integration logos for spotlight section
 */
export const INTEGRATION_LOGOS: IntegrationLogo[] = [
  { src: '/images/integrations/angelist.svg', alt: 'AngelList Logo' },
  { src: '/images/integrations/gmail.svg', alt: 'Gmail Logo' },
  { src: '/images/integrations/hubspot.svg', alt: 'HubSpot Logo' },
  { src: '/images/integrations/linkedin.svg', alt: 'LinkedIn Logo' },
  { src: '/images/integrations/slack.svg', alt: 'Slack Logo' },
  { src: '/images/integrations/trello.svg', alt: 'Trello Logo' },
  { src: '/images/integrations/zapier.svg', alt: 'Zapier Logo' },
];

/**
 * Spotlight image data
 */
export const SPOTLIGHT_IMAGE = {
  src: '/images/spotlight/spotlight.png',
  alt: 'AI handling customer support calls',
};
